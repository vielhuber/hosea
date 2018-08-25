import Helpers from './_helpers';
import PouchDB from 'pouchdb';
import jQuery from 'jquery'; window.$ = window.jQuery = jQuery;
import 'fullcalendar'; import 'fullcalendar/dist/locale/de';
import moment from 'moment'; import de from 'moment/locale/de'; import { utc } from 'moment'; moment.locale('de');
import jwtbutler from 'jwtbutler';

export default class App
{
    constructor()
    {

        this.api = null;
        this.db = null;
        this.tickets = null;        
        this.url = null;
        this.backup = null;
        this.cols = [
            'status',
            'priority',
            'date',
            'time',
            'project',
            'description'
        ];
        this.colors = {
            'idle': '#b3e5fc',
            'done': '#fff59d',
            'billed': '#81c784',
            'recurring': '#ffeded',
            'working': '#ef9a9a',
            'delegated': '#ce93d8',
            'weekend': '#bbdefb',
            'big': '#e1bee7',
            
            'windows': '#42A5F5', 
            'mac': '#8D6E63',            
            'linux': '#9CCC65',
        };
        this.dates = null;
        this.session = null;
    }

    async init()
    {
    await this.login();
    await this.readConfig();
          this.initSessionVariables();
    await this.fetchTickets();
          this.buildHtml();
          this.textareaAutoHeight();
          this.initKeyboardNavigation();
          this.initScheduler();
          this.setupBindings();
        /*
          this.initFilter();
          this.initSort();
          this.updateColors();
          this.updateSum();
      */
    }

    setupBindings()
    {
        this.bindAutoTime();
        this.bindChangeTracking();
        this.bindUpload();
        this.bindDownload();
        this.bindDeleteAttachment();
        this.bindDelete();
        this.bindSave();
        this.bindRefresh();
        this.bindCreate();
        this.bindScheduler();
    }

    login()
    {
        this.api = new jwtbutler({
            auth_server: '/_auth'
        });
        return this.api.login();
    }

    readConfig()
    {        
        return new Promise((resolve,reject) =>
        {
            Helpers.get('config.json', (data) =>
            {
                this.url = data.url;
                this.backup = data.backup;
                resolve();
            }, () =>
            {
                reject();
                console.log(error);
            });          
        });
    }

    initSessionVariables()
    {
        this.session = {
            activeDay: new Date()
        };
    }

    fetchTickets()
    {
        return new Promise((resolve,reject) =>
        {
            this.api.fetch('/_api/tickets', {
                method: 'GET',
                cache: 'no-cache',
                headers: { 'content-type': 'application/json' }
            }).then(res => res.json()).catch(err => {
                reject(err);
            }).then(response =>
            {
                this.tickets = [];
                response.data.forEach((tickets__value) =>
                {
                    this.tickets.push(tickets__value);
                });
                resolve();
            });
        });
    }

    buildHtml()
    {        
        $('#app').append(`
            <div id="meta"></div>
            <div id="tickets"></div>
            <div class="scheduler"></div>
        `);

        $('#tickets').append(`
            <table class="ticket_table">
                <thead>
                    <tr></tr>
                </thead>
                <tbody>
                </tbody>
                <tfoot>
                    <tr></tr>
                </tfoot>
            </table>
            <a href="#" class="button_save">Speichern</a>
        `);
        this.cols.forEach((cols__value) =>
        {
            $('.ticket_table thead tr').append('<td>'+cols__value+'</td>');
            $('.ticket_table tfoot tr').append('<td>'+((cols__value=='time')?('<span class="sum"></span>'):(''))+'</td>');
        });
        $('.ticket_table thead tr').append('<td>attachments</td><td>delete</td>');
        $('.ticket_table tfoot tr').append('<td></td><td></td>');
        this.tickets.forEach((tickets__value) =>
        {
            $('.ticket_table tbody').append(
                this.createHtmlLine(tickets__value)
            );
        });
    }    

    textareaAutoHeight()
    {
        //Helpers.textareaAutoHeight('#tickets textarea.autosize');
    }

    textareaSetHeights()
    {
        //Helpers.textareaSetHeights('#tickets textarea.autosize');
    }


    getTicketData( document_id )
    {
        let data = null;
        this.tickets.forEach((tickets__value) =>
        {
            if( tickets__value._id == document_id )
            {
                data = tickets__value;
            }
        });
        return data;
    }

    setTicketData( document_id, property, value = null )
    {
        this.tickets.forEach((tickets__value) =>
        {
            if( tickets__value.id == document_id )
            {
                if( Helpers.isObject(property) )
                {
                    Object.entries(property).forEach(([property__key, property__value]) =>
                    {
                        tickets__value[property__key] = property__value;
                    });
                }
                else
                {
                    tickets__value[property] = value;
                }
            }
        });      
    }

    createHtmlLine(ticket)
    {
        let html = '';

        html += '<tr class="ticket_entry" data-id="'+ticket.id+'">';

        this.cols.forEach((cols__value) =>
        {
            html += '<td>';
                html += '<textarea '+((['date','description'].includes(cols__value))?(' class="autosize"'):(''))+' name="'+cols__value+'">'+(ticket[cols__value]||'')+'</textarea>';
            html += '</td>';
        });
        
        html += `
            <td>
                <ul class="ticket_entry__attachments">`;
                if( ticket.attachments !== undefined && ticket.attachments.length > 0 )
                {
                    ticket.attachments.forEach((attachments__value, attachments__key) =>
                    {
                        html += this.createHtmlDownloadLine(attachments__value);
                    });
                }
        html += `
                </ul>

                <label class="ticket_entry__upload">
                    <input type="file" name="attachments" multiple="multiple" />
                </label>
   
            </td>
            <td>
                <a href="#" class="ticket_entry__delete">x</a>
            </td>
        </tr>
        `;
        return html;
    }

    getFilename( attachment_id )
    {
        return attachment_id.split('#')[1];
    }

    createHtmlDownloadLine( attachment )
    {
        return `
            <li class="ticket_entry__attachment" data-id="${ attachment.id }">
                <a class="ticket_entry__attachment_download" href="#" title="${ attachment.name }"></a>
                <a class="ticket_entry__attachment_delete" href="#" title="Löschen"></a>
            </li>
        `;
    }

    bindSave()
    {
        // button click
        $('#tickets').on('click', '.button_save', () =>
        {
            this.saveTickets().then(() => { }).catch((error) => { console.log(error); });
            return false;
        });        

        // ctrl+s
        $(window).bind('keydown', (event) =>
        {
            let focus = $(':focus');
            if(event.ctrlKey || event.metaKey)
            {
                if(String.fromCharCode(event.which).toLowerCase() === 's')
                {
                    this.saveTickets().then(() =>
                    {
                        if( focus.length > 0 )
                        {
                            focus.focus();
                        }
                    }).catch((error) =>
                    {
                        console.log(error);
                    });
                    return false;
                }
            }
        });
    }


    bindRefresh()
    {
        // f5
        $(window).bind('keydown', (event) =>
        {
            if( event.keyCode === 116 )
            {
                this.doFilter();
                return false;
            }
        });
    }

    bindCreate()
    {
        // ctrl+d
        $(window).bind('keydown', (event) =>
        {
            if(event.ctrlKey || event.metaKey)
            {
                if(String.fromCharCode(event.which).toLowerCase() === 'd')
                {
                    let current = $('.ticket_table tbody .ticket_entry:visible').last();
                    if( $(':focus').closest('.ticket_entry').length > 0 )
                    {
                        current = $(':focus').closest('.ticket_entry');
                    }
                    this.createTicket(this.getTicketData(current.attr('data-id'))).then((ticket) =>
                    {

                        current.after( this.createHtmlLine(ticket) );
                        current.next('.ticket_entry').find('td:nth-child(1)').find(':input').focus();
                        this.initScheduler();
                        this.updateColors();
                        this.updateSum();
                        this.updateFilter();
                        this.textareaSetHeights();
                    }).catch((error) =>
                    {
                        console.log(error);
                    }); 
                    return false;
                }
            }
        });
    }


    bindChangeTracking()
    {
        $('#tickets').on('input', '.ticket_entry :input', (el) =>
        {
            if( $(el.currentTarget).is('[type="file"]') )
            {
                return;
            }
            $(el.currentTarget).closest('.ticket_entry').addClass('ticket_entry--changed');
        });
    }

    bindAutoTime()
    {
        $('#tickets').on('change', '.ticket_entry [name="date"]', (e) =>
        {
            if( $(e.currentTarget).val() != '' )
            {
                let ticket_dates = $(e.currentTarget).val().split('\n'),
                    begin = null,
                    end = null;
                ticket_dates.forEach((ticket_dates__value, ticket_dates__key) =>
                {
                    if( (ticket_dates__key%2) === 0 )
                    {
                        begin = ticket_dates__value;
                    }
                    else
                    {
                        end = ticket_dates__value;
                        if( Helpers.isDate(begin) && Helpers.isDate(end) )
                        {
                            $(e.currentTarget).closest('.ticket_entry').find('[name="time"]').val(
                                (Math.round((Math.abs(new Date(end) - new Date(begin))/(1000*60*60))*100)/100).toString().replace('.',',')
                            );
                        }
                    }
                });
            }
        });
    }

    bindUpload()
    {
        $('#tickets').on('change', '.ticket_entry input[type="file"]', (e) =>
        {
            this.startUploads(
                $(e.currentTarget).closest('.ticket_entry').attr('data-id'),
                e.currentTarget.files
            ).then((attachments) =>
            {
                $(e.currentTarget).val('');
                attachments.forEach((attachments__value) =>
                {
                    $(e.currentTarget).closest('.ticket_entry').find('.ticket_entry__attachments').append(
                        this.createHtmlDownloadLine(attachments__value)
                    );
                });
            }).catch((error) =>
            {
                console.log(error);
            });
        });
    }

    async startUploads( document_id, files )
    {
        let attachments = [];

        for(let files__value of Array.from(files))
        {
            this.lockTicket(document_id);            
            let attachment = await this.startUpload( document_id, files__value );
            this.unlockTicket(document_id, true);
            attachments.push(attachment);
        }

        console.log(attachments);

        // fetch entire doc to get newest attachment object
        await this.updateLocalTicket(document_id);

        return attachments;
    }

    startUpload( document_id, file )
    {
        return new Promise((resolve,reject) =>
        {
            this.filetobase64(file).then((base64) =>
            {
                this.api.fetch('/_api/attachments', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: file.name,
                        data: base64,
                        ticket_id: document_id
                    }),
                    cache: 'no-cache',
                    headers: { 'content-type': 'application/json' }
                }).then(res => res.json()).catch(err => {
                    console.log(err);
                }).then(response =>
                {
                    resolve(response.data);
                });
            });
        });
        /*
        let attachment_id = Helpers.guid()+'#'+file.name;
        return this.db.putAttachment(
            document_id,
            attachment_id,
            this.getTicketData(document_id)._rev,
            file,
            file.type
        ).then((result) =>
        {
            return {
                rev: result.rev,
                attachment_id: attachment_id
            };
        }).catch((error) =>
        {
            console.log(error);
        });
        */
    }

    bindDownload()
    {
        $('#tickets').on('click', '.ticket_entry__attachment_download', (e) => 
        {
            this.startDownload(
                $(e.currentTarget).closest('.ticket_entry__attachment').attr('data-id')
            );
            return false;
        });   
    }

    startDownload( attachment_id )
    { 
        this.api.fetch('/_api/attachments/'+attachment_id, {
            method: 'GET',
            cache: 'no-cache',
            headers: { 'content-type': 'application/json' }
        }).then(res => res.json()).catch(err => {
            console.log(err);
        }).then(response =>
        {
            let base64 = response.data.data,
                filename = response.data.name,
                url = 'data:application/octet-stream;base64,'+base64;

            let a = document.createElement('a');
            a.setAttribute('style','display:none');
            a.setAttribute('download', filename);
            a.setAttribute('href', url);
            document.body.appendChild(a);
            a.click();
            a.remove();
        });
        return false;
    }

    bindDelete()
    {
        $('#tickets').on('click', '.ticket_entry__delete', (e) =>
        {
            let document_id = $(e.currentTarget).closest('.ticket_entry').attr('data-id');
            if( this.ticketIsLocked(document_id) )
            {
                return false;
            }
            if( $('#tickets .ticket_entry').length === 1 )
            {
                alert('don\'t delete the genesis block!');
                return false;
            }
            var result = confirm('Sind Sie sicher?');
            if( result )
            {
                this.deleteTicket( document_id ).then((result) =>
                {
                    $(e.currentTarget).closest('.ticket_entry').remove();
                    this.initScheduler();
                    this.updateSum();
                    this.updateFilter();
                }).catch((error) => { });
                return false;
            }
            return false;
        });
    }

    deleteTicket( document_id )
    {
        return new Promise((resolve,reject) =>
        {
            this.db.remove(
                document_id,
                this.getTicketData(document_id)._rev
            ).then((result) =>
            {
                this.tickets.forEach((tickets__value, tickets__key) =>
                {
                    if( tickets__value._id == document_id )
                    {
                        this.tickets.splice(tickets__key, 1);
                    }
                });
                resolve();
            }).catch((error) =>
            {
                reject();
                console.log(error);
            });
        });
    }

    bindDeleteAttachment()
    {
        $('#tickets').on('click', '.ticket_entry__attachment_delete', (e) =>
        {
            if( this.ticketIsLocked($(e.currentTarget).closest('.ticket_entry').attr('data-id')) )
            {
                return false;
            }
            this.deleteAttachment(
                $(e.currentTarget).closest('.ticket_entry').attr('data-id'),
                $(e.currentTarget).closest('.ticket_entry__attachment').attr('data-id')
            ).then((result) =>
            {
                $(e.currentTarget).closest('.ticket_entry__attachment').remove();
            }).catch((error) =>
            {                
            });
            return false;
        });
    }

    lockTicket(document_id)
    {
        $('.ticket_entry[data-id="'+document_id+'"]').addClass('ticket_entry--locked');
        $('.ticket_entry[data-id="'+document_id+'"]').find(':input').each((index,el) =>
        {
            $(el).attr('disabled','disabled');
            $(el).attr('readonly','readonly');
        });
    }

    unlockTicket(document_id, leave_changed = false)
    {
        //console.log('unlocking ticket '+document_id);
        if( leave_changed === false )
        {
            $('.ticket_entry[data-id="'+document_id+'"]').removeClass('ticket_entry--changed');
        }
        $('.ticket_entry[data-id="'+document_id+'"]').removeClass('ticket_entry--locked');
        $('.ticket_entry[data-id="'+document_id+'"]').find(':input').each((index,el) =>
        {
            $(el).removeAttr('disabled');
            $(el).removeAttr('readonly');
        });
    }

    ticketIsLocked(document_id)
    {
        if( $('.ticket_entry[data-id="'+document_id+'"] .ticket_entry--locked').length > 0 )
        {
            return true;
        }
        return false;
    }

    deleteAttachment( document_id, attachment_id )
    {
        return new Promise((resolve,reject) =>
        {
            this.lockTicket(document_id);
            this.db.removeAttachment(
                document_id,
                attachment_id,
                this.getTicketData(document_id)._rev
            ).then((result) =>
            {
                this.unlockTicket(document_id, true);
                this.removeAttachmentFromLocalTicket( document_id, attachment_id );
                resolve();
            }).catch((error) =>
            {
                reject();
                console.log(error);
            });
        });
    }

    saveTickets()
    {
        return new Promise((resolve, reject) =>
        {
            let changed = [];
            $('.ticket_entry--changed').each((index,el) =>
            {
                let data = {};
                this.cols.forEach((cols__value) =>
                {
                    data[cols__value] = $(el).find('[name="'+cols__value+'"]').val();    
                });
                this.setTicketData(
                    $(el).attr('data-id'),
                    data
                );
                this.lockTicket( $(el).attr('data-id') );
                changed.push(
                    this.getTicketData( $(el).attr('data-id') )
                );
            });
            this.db.bulkDocs(changed).then((result) =>
            {
                console.log(result);
                result.forEach((value) =>
                {
                    this.unlockTicket(value.id);
                });
                this.initScheduler();
                this.updateColors();
                this.updateSum();
                this.updateFilter();
                resolve();
            }).catch((error) =>
            {
                console.log(error);
                reject();
            }); 
        });
    }

    updateLocalTicket(document_id)
    {
        return new Promise((resolve,reject) =>
        {
            this.api.fetch('/_api/tickets/'+document_id, {
                method: 'GET',
                cache: 'no-cache',
                headers: { 'content-type': 'application/json' }
            }).then(res => res.json()).catch(err => {
                reject(err);
            }).then(response =>
            {
                this.setTicketData(
                    document_id,
                    response.data
                );
                resolve();
            });
        });
    }

    removeAttachmentFromLocalTicket( document_id, attachment_id )
    {
        this.tickets.forEach((tickets__value) =>
        {
            if( tickets__value._id == document_id )
            {
                delete tickets__value._attachments[attachment_id];
            }
        });   
    }

    initKeyboardNavigation()
    {
        $('#tickets').on('keydown', '.ticket_entry :input', (e) =>
        {
            let left = $(e.currentTarget).closest('td').prev('td'),
                right = $(e.currentTarget).closest('td').next('td'),
                top = $(e.currentTarget).closest('tr').prevAll(':visible').first(),
                down = $(e.currentTarget).closest('tr').nextAll(':visible').first(),
                index = ($(e.currentTarget).closest('td').prevAll('td').length+1);

            // arrow right (switch)
            if( e.keyCode === 39 && right.length > 0 && e.currentTarget.selectionEnd >= $(e.currentTarget).val().length )
            {
                right.find(':input').focus().select();
                return false;
            }
            // arrow left (switch)
            else if( e.keyCode === 37 && left.length > 0 && e.currentTarget.selectionEnd <= 0 )
            {
                left.find(':input').focus().select();
                return false;
            }
            // arrow top (switch)
            else if( e.keyCode === 38 && top.length > 0 && e.currentTarget.selectionEnd <= 0 )
            {
                top.find('td:nth-child('+index+')').find(':input').focus().select();
                return false;
            }
            // arrow down (switch)
            else if( e.keyCode === 40 && down.length > 0 && e.currentTarget.selectionEnd >= $(e.currentTarget).val().length )
            {
                down.find('td:nth-child('+index+')').find(':input').focus().select();
                return false;
            }
        });
    }

    lastLineIsEmpty()
    {
        let empty = true;
        let last = $('.ticket_entry:last-child');
        while( !last.is(':visible') && last.prev('.ticket_entry').length > 0 )
        {
            last = last.prev('.ticket_entry');
        }
        last.find(':input').each((index,el) =>
        {
            if( $(el).val() != '' )
            {
                empty = false;    
            }
        });
        return empty;
    }

    createTicket(data = {})
    {
        return new Promise((resolve, reject) =>
        {
            let ticket = {};
            this.cols.forEach((cols__value) =>
            {
                ticket[cols__value] = data[cols__value]||null;
            });
            this.db.post(ticket).then((response) =>
            {
                ticket._id = response.id;
                ticket._rev = response.rev;
                this.tickets.push(ticket);
                resolve(ticket);
            }).catch((error) =>
            {
                reject(error);
            });
        });
    }

    initScheduler()
    {
        $('.scheduler').html(`
            <div class="scheduler__navigation">
                <span class="scheduler__navigation-week"></span>
                <a href="#" class="scheduler__navigation-next">next</a>
                <a href="#" class="scheduler__navigation-prev">prev</a>
                <a href="#" class="scheduler__navigation-today">today</a>
            </div>

            <table class="scheduler__table">
                <tbody class="scheduler__table-body">
                    <tr class="scheduler__row">
                        <td class="scheduler__cell"></td>   
                        ${Array(7).join(0).split(0).map((item, i) => `
                            <td class="scheduler__cell${(this.sameDay(this.getDayOfActiveWeek(i+1),this.getCurrentDate())?(' scheduler__cell--curday'):(''))}">
                                ${this.dateFormat(this.getDayOfActiveWeek(i+1), 'D d.m.')}
                                <br/>
                                KW ${this.weekNumber(this.getDayOfActiveWeek(i+1))}
                            </td>
                        `).join('')}
                    </tr>
                    <tr class="scheduler__row">
                        <td class="scheduler__cell">Ganztätig</td>
                        ${Array(7).join(0).split(0).map((item, i) => `<td class="scheduler__cell${(this.sameDay(this.getDayOfActiveWeek(i+1),this.getCurrentDate())?(' scheduler__cell--curday'):(''))}"></td>`).join('')}
                    </tr>
                    ${Array(15).join(0).split(0).map((item, j) => {
                        j=j+9;
                        return `
                            <tr class="scheduler__row">
                                <td class="scheduler__cell">${('0'+(j)).slice(-2)}&ndash;${('0'+(j+1)).slice(-2)}</td>
                                ${Array(7).join(0).split(0).map((item, i) => `
                                    <td class="
                                        scheduler__cell
                                        ${(this.sameDay(this.getDayOfActiveWeek(i+1),this.getCurrentDate())?(' scheduler__cell--curday'):(''))}
                                        ${((i<5 && ((j>=9 && j<13) || (j>=14 && j<18)))?(' scheduler__cell--main'):(''))}
                                    ">
                                    </td>
                                `).join('')}
                            </tr>
                        `
                    }).join('')}
                </tbody>
            </table>

            <div class="scheduler__appointments">
            </div>
        `);        

        this.generateDates().forEach((date__value) =>
        {
            $('.scheduler__appointments').append(`
                <div class="scheduler__appointment" title="${date__value.title}" style="
                    left:${12.5*date__value.day}%;
                    top:${6.25*(date__value.begin-8)}%;
                    bottom:${100-(6.25*(date__value.end-8))}%;
                    background-color:${date__value.backgroundColor};
                ">
                    ${date__value.title}
                </div>
            `);
        });

        $('.scheduler__navigation-week').html(`
            ${this.dateFormat( this.getDayOfActiveWeek(1), 'd. F Y' )} &ndash; ${this.dateFormat( this.getDayOfActiveWeek(7), 'd. F Y' )}
        `);
    }

    bindScheduler()
    {
        $('.scheduler').on('click', '.scheduler__navigation-today', () =>
        {
            this.session.activeDay = new Date();
            this.initScheduler();
            return false;
        });
        $('.scheduler').on('click', '.scheduler__navigation-prev', () =>
        {
            this.session.activeDay.setDate(this.session.activeDay.getDate()-7);
            this.initScheduler();
            return false;
        });
        $('.scheduler').on('click', '.scheduler__navigation-next', () =>
        {
            this.session.activeDay.setDate(this.session.activeDay.getDate()+7);
            this.initScheduler();
            return false;
        });
    }

    generateDates()
    {
        let dates = [];
        this.tickets.forEach((tickets__value) =>
        {
            if( this.dateIsInActiveWeek(tickets__value.date.split('\n')[0]) )
            {
                let title = tickets__value.project+'\n'+(tickets__value.description||'').substring(0,100),
                    ticket_dates = tickets__value.date.split('\n'),
                    cur = 0;
                while( ticket_dates[cur] !== undefined )
                {
                    let d1 = new Date(ticket_dates[cur]),
                        d2 = new Date(ticket_dates[cur+1]);
                    dates.push({
                        day: ((d1.getDay()+6)%7)+1,
                        begin: (d1.getHours()+(d1.getMinutes()/60))||24,
                        end: (d2.getHours()+(d2.getMinutes()/60))||24,
                        title: title,
                        backgroundColor: this.getColor(tickets__value.status)
                    });
                    cur += 2;
                }
            }   
        });
        console.log(dates);
        return dates;
    }

    initFilter()
    {
        this.initUpdateFilter(false);
    }

    updateFilter()
    {
        this.initUpdateFilter(true);
    }

    initUpdateFilter(update)
    {
        let selected = {};
        if( update === true )
        {
            $('#meta #filter select').each((index, el) =>
            {
                selected[$(el).attr('name')] = $(el).val();
            });
            $('#meta #filter').remove();
        } 

        $('#meta').append('<div id="filter"></div>');
        ['person', 'status', 'priority', 'date', 'project'].forEach((columns__value) =>
        {
            $('#filter').append(`
                <select name="${columns__value}">
                    <option value="*">${columns__value}</option>
                </select>
            `);
            if( columns__value === 'date' )
            {
                $('#filter [name="date"]').append('<option selected="selected" value="'+moment().format('YYYY-MM-DD')+'">_today</option>');
                $('#filter [name="date"]').append('<option value="'+moment().add(1, 'days').format('YYYY-MM-DD')+'">_tomorrow</option>');
                $('#filter [name="date"]').append('<option value="'+moment().add(-1, 'days').format('YYYY-MM-DD')+'">_yesterday</option>');
            }
            let options = [];
            this.tickets.forEach((tickets__value) =>
            {
                let options_value = tickets__value[columns__value];
                if( columns__value == 'date' && options_value != null && options_value != '' )
                {
                    options_value = options_value.substring(0,10);
                }
                if( !options.includes(options_value) )
                {
                    options.push(options_value);
                }
            });
            options.sort((a, b) =>
            {
                if( a === null ) { a = ''; } if( b === null ) { b = ''; }                
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });
            options.forEach((options__value) =>
            {
                let active = false;
                $('#filter select[name="'+columns__value+'"]').append(
                    '<option'+((active===true)?(' selected="selected"'):(''))+' value="'+options__value+'">'+options__value+'</option>'
                );
            });

            if( update === false )
            {
                this.doFilter();
                $('#meta').on('change', '#filter select', () =>
                {
                    this.doFilter();
                });
            }
            else
            {
                Object.entries(selected).forEach(([selected__key, selected__value]) =>
                {
                    $('#meta #filter [name="'+selected__key+'"]').val(selected__value);
                });
            }
        });
    }

    doFilter()
    {
        this.tickets.forEach((tickets__value) =>
        {
            let visible = true;
            $('#filter select').each((index,el) =>
            {
                let val_search = $(el).val();
                let val_target = tickets__value[$(el).attr('name')];
                if( $(el).attr('name') == 'date' && val_target !== null )
                {
                    val_target = val_target.substring(0,10);
                }
                if( val_search != '*' && val_target != val_search )
                {
                    visible = false;
                }
                /* hide billed in overview */
                if(
                    $(el).attr('name') == 'status'
                    &&
                    val_search == '*'
                    &&
                    val_target == 'billed'
                    &&
                    ($('#filter select[name="date"]').val() == '*' || $('#filter select[name="date"]').val() == '')
                )
                {
                    visible = false;
                }                
            });
            if( visible === false )
            {
                tickets__value.visible = false;
                $('#tickets .ticket_entry[data-id="'+tickets__value._id+'"]').hide();
            }
            else
            {
                $('#tickets .ticket_entry[data-id="'+tickets__value._id+'"]').show();
                tickets__value.visible = true;
            }                    
        });
        this.doSort();
        this.updateSum();
        this.textareaSetHeights();
    }

    initSort()
    {
        $('#meta').append('<div id="sort"></div>');
        [1,2].forEach((step) =>
        {
            $('#sort').append('<select name="sort_'+step+'"><option value="">sort #'+step+'</option></select>');
            this.cols.forEach((columns__value) =>
            {
                $('#sort select[name="sort_'+step+'"]').append('<option value="'+columns__value+'">'+columns__value+'</option>');
            });
        });
        this.doSort();
        $('#meta').on('change', '#sort select', () =>
        {
            this.doSort();
        });
    }


    doSort()
    {
        let sort_1 = $('#sort select[name="sort_1"]').val(),
            sort_2 = $('#sort select[name="sort_2"]').val(),
            sorted = $('#tickets .ticket_table tbody .ticket_entry').sort((a, b) =>
            {
                if( sort_1 != '' )
                {
                    if( $(a).find('[name="'+sort_1+'"]').val() < $(b).find('[name="'+sort_1+'"]').val() ) { return -1; }
                    if( $(a).find('[name="'+sort_1+'"]').val() > $(b).find('[name="'+sort_1+'"]').val() ) { return 1; }
                }
                else if( $(a).find('[name="status"]').val() != $(b).find('[name="status"]').val() )
                {
                    for(let status__value of ['billed','done','working','scheduled','recurring','weekend','delegated','idle','big'])
                    {
                        if( $(a).find('[name="status"]').val() === status__value ) { return -1; }
                        if( $(b).find('[name="status"]').val() === status__value ) { return 1; }
                    }
                }
                if( sort_2 != '' )
                {
                    if( $(a).find('[name="'+sort_2+'"]').val() < $(b).find('[name="'+sort_2+'"]').val() ) { return -1; }
                    if( $(a).find('[name="'+sort_2+'"]').val() > $(b).find('[name="'+sort_2+'"]').val() ) { return 1; }
                }
                if( $(a).find('[name="date"]').val() < $(b).find('[name="date"]').val() ) { return -1; }
                if( $(a).find('[name="date"]').val() > $(b).find('[name="date"]').val() ) { return 1; }
                if( $(a).find('[name="priority"]').val() < $(b).find('[name="priority"]').val() ) { return -1; }
                if( $(a).find('[name="priority"]').val() > $(b).find('[name="priority"]').val() ) { return 1; }
                if( $(a).attr('data-id') < $(b).attr('data-id') ) { return -1; }
                if( $(a).attr('data-id') > $(b).attr('data-id') ) { return 1; }
                return 0;
            });
        $('#tickets .ticket_table tbody').html(sorted);
    }

    getColor(status)
    {
        let color = '#f2f2f2';
        if( status !== null && status != '' && this.colors.hasOwnProperty(status) )
        {
            color = this.colors[status];
        }
        return color;
    }

    updateColors()
    {
        this.tickets.forEach((tickets__value) =>
        {
            $('#tickets .ticket_entry[data-id="'+tickets__value._id+'"]').css('background-color',this.getColor(tickets__value.status));
        });   
    }


    updateSum()
    {
        let sum = 0;
        this.tickets.forEach((tickets__value) =>
        {
            if(
                tickets__value.visible !== false &&
                tickets__value.time !== null &&
                tickets__value.time != '' &&
                !['idle', 'done', 'billed', 'delegated'].includes(tickets__value.status)
            )
            {
                sum += parseFloat(tickets__value.time.replace(',','.'));
            }
        });
        sum = (Math.round(sum*100)/100);
        sum = sum.toString().replace('.',',');
        $('#tickets .ticket_table tfoot .sum').text(sum);
    }

    getCurrentDate()
    {
        return new Date();
    }

    getDayOfActiveWeek(shift)
    {
        return this.getDayOfWeek(shift, this.session.activeDay);
    }

    getDayOfWeek(shift, date)
    {
        let d = new Date(date),
            day = d.getDay(),
            diff = d.getDate() - day + (day == 0 ? -6 : 1) + (shift-1);
        return new Date(d.setDate(diff));
    }

    dateFormat(d, format)
    {
        if( format === 'D d.m.' )
        {
            return ['SO','MO','DI','MI','DO','FR','SA'][d.getDay()]+' '+('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.';
        }
        if( format === 'd. F Y' )
        {
            return ('0'+d.getDate()).slice(-2)+'. '+['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'][d.getMonth()]+' '+d.getFullYear();
        }
        return ('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.'+d.getFullYear()+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+':'+('0'+d.getSeconds()).slice(-2);
    }

    dateIsInActiveWeek(d)
    {
        if( d === null || d === '' )
        {
            return false;
        }
        d = new Date(d);
        return this.sameDay( this.getDayOfWeek(1, d), this.getDayOfActiveWeek(1) );
    }

    sameDay(d1, d2)
    {
        return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    }

    weekNumber(d)
    {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        let dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        let yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    }

    filetobase64(file)
    {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }

}
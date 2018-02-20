import Helpers from './_helpers';
import PouchDB from 'pouchdb';
import jQuery from 'jquery'; window.$ = window.jQuery = jQuery;
import 'fullcalendar'; import 'fullcalendar/dist/locale/de';
import moment from 'moment'; import de from 'moment/locale/de'; import { utc } from 'moment'; moment.locale('de');

export default class App
{
    constructor()
    {

        this.db = null;
        this.tickets = null;        
        this.url = null;
        this.backup = null;
        this.cols = [
            'person',
            'status',
            'priority',
            'date',
            'time',
            'worked',
            'project',
            'description'
        ];
        this.colors = {
            'idle': '#b3e5fc',
            'done': '#fff59d',
            'billed': '#81c784',
            'working': '#ef9a9a',
            'delegated': '#ce93d8',
            
            'windows': '#42A5F5', 
            'mac': '#8D6E63',            
            'linux': '#9CCC65',
        };
        this.dates = null;
    }

    async init()
    {
    await this.readConfig();
          this.initDatabase();
    await this.cleanDatabase();
    await this.backupDatabase();
    await this.fetchTickets();
          this.buildHtml();
          this.textareaAutoHeight();
          this.setupBindings();
          this.initKeyboardNavigation();
          this.initScheduler();
          this.initFilter();
          this.initSort();
          this.updateColors();
          this.updateSum();
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
        this.bindCreate();
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
    
    initDatabase()
    {
        this.db = new PouchDB(this.url);
    }

    cleanDatabase()
    {
        return new Promise((resolve,reject) =>
        {
            this.db.compact().then(() => 
            {
                resolve();
            }).catch((error) =>
            {
                console.log(error);
                reject();
            });            
        });
    }


    backupDatabase()
    {
        return new Promise((resolve,reject) =>
        {
            let remote = new PouchDB(this.backup);
            let replication = PouchDB.replicate(this.db, remote, {
                live: false,
                retry: false
            }).on('complete', (info) =>
            {
                console.log('backuped database to local couchdb instance');
                resolve();
            }).on('error', (error) =>
            {
                console.log(error);
                reject();
            });
        });        
    }

    fetchTickets()
    {
        return new Promise((resolve,reject) =>
        {
            this.db.allDocs({
                include_docs: true,
                attachments: false
            }).then((tickets) =>
            {
                this.tickets = [];
                tickets.rows.forEach((tickets__value) =>
                {
                    this.tickets.push(tickets__value.doc);
                });
                resolve();
            }).catch((error) =>
            {
                reject(error);
            });
        });
    }

    buildHtml()
    {        
        $('#app').append(`
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
        Helpers.textareaAutoHeight('#app textarea.autosize');
    }

    textareaSetHeights()
    {
        Helpers.textareaSetHeights('#app textarea.autosize');
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
            if( tickets__value._id == document_id )
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

        html += '<tr class="ticket_entry" data-id="'+ticket._id+'">';

        this.cols.forEach((cols__value) =>
        {
            html += '<td>';
                html += '<textarea '+((['date','description'].includes(cols__value))?(' class="autosize"'):(''))+' name="'+cols__value+'">'+(ticket[cols__value]||'')+'</textarea>';
            html += '</td>';
        });
        
        html += `
            <td>
                <ul class="ticket_entry__attachments">`;
                if( ticket._attachments !== undefined && Object.keys(ticket._attachments).length > 0 )
                {
                    Object.entries(ticket._attachments).forEach(([attachment__key, attachment__value]) =>
                    {
                        html += this.createHtmlDownloadLine(attachment__key);
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

    createHtmlDownloadLine( attachment_id )
    {
        return `
            <li class="ticket_entry__attachment" data-id="${attachment_id}">
                <a class="ticket_entry__attachment_download" href="#" title="${ this.getFilename(attachment_id) }"></a>
                <a class="ticket_entry__attachment_delete" href="#" title="Löschen"></a>
            </li>
        `;
    }

    bindSave()
    {
        // button click
        $('#app').on('click', '.button_save', () =>
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
                        this.refreshScheduler();
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
        $('#app').on('input', '.ticket_entry :input', (el) =>
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
        $('#app').on('change', '.ticket_entry [name="date"]', (e) =>
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
        $('#app').on('change', '.ticket_entry input[type="file"]', (e) =>
        {
            this.startUploads(
                $(e.currentTarget).closest('.ticket_entry').attr('data-id'),
                e.currentTarget.files
            ).then((attachment_ids) =>
            {
                $(e.currentTarget).val('');
                attachment_ids.forEach((attachment_ids__value) =>
                {
                    $(e.currentTarget).closest('.ticket_entry').find('.ticket_entry__attachments').append(
                        this.createHtmlDownloadLine(attachment_ids__value)
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
        let attachment_ids = [];

        for(let files__value of Array.from(files))
        {
            this.lockTicket(document_id);            
            let result = await this.startUpload( document_id, files__value );
            this.unlockTicket(document_id, result.rev, true);
            attachment_ids.push(result.attachment_id);
        }

        // fetch entire doc to get newest attachment object
        await this.updateLocalTicket(document_id);

        return attachment_ids;
    }

    startUpload( document_id, file )
    {
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
    }

    bindDownload()
    {
        $('#app').on('click', '.ticket_entry__attachment_download', (e) => 
        {
            this.startDownload(
                $(e.currentTarget).closest('.ticket_entry').attr('data-id'),
                $(e.currentTarget).closest('.ticket_entry__attachment').attr('data-id')
            );
            return false;
        });   
    }

    startDownload( document_id, attachment_id )
    { 
        this.db.getAttachment( document_id, attachment_id ).then((blob) =>
        {                
            let a = $('<a style="display: none;" />');
            let url = URL.createObjectURL(blob);
            a.attr('href', url);
            a.attr('download', this.getFilename(attachment_id));
            $('body').append(a);
            a.get(0).click();
            URL.revokeObjectURL(url);
            a.remove();
            //console.log('<div>Filesize: ' + JSON.stringify(Math.floor(blob.size/1024)) + 'KB, Content-Type: ' + JSON.stringify(blob.type) + "</div>"+'<div>Download link: <a href="' + url + '">' + url + '</div>');
        }).catch((error) =>
        {
            console.log(error);
        });
        return false;
    }

    bindDelete()
    {
        $('#app').on('click', '.ticket_entry__delete', (e) =>
        {
            let document_id = $(e.currentTarget).closest('.ticket_entry').attr('data-id');
            if( this.ticketIsLocked(document_id) )
            {
                return false;
            }
            if( $('#app .ticket_entry').length === 1 )
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
                    this.refreshScheduler();
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
        $('#app').on('click', '.ticket_entry__attachment_delete', (e) =>
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

    unlockTicket(document_id, rev, leave_changed = false)
    {
        this.setTicketData(document_id, '_rev', rev);
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
                this.unlockTicket(document_id, result.rev, true);
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
                    this.unlockTicket(value.id, value.rev);
                });
                this.refreshScheduler();
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
        return this.db.get(document_id).then((data) =>
        {
            this.setTicketData(
                document_id,
                data
            );
        }).catch((error) =>
        {
            console.log(error);
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
        $('#app').on('keydown', '.ticket_entry :input', (e) =>
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
        $('#scheduler').fullCalendar({
            locale: 'de',
            editable: false,
            events: this.generateDates(),
            defaultView: 'agendaWeek',
            weekends: true,
            allDaySlot: true,
            eventTextColor: '#000000',
            height: 'auto',
            contentHeight: 'auto',
            businessHours: [
                {
                    dow: [ 1, 2, 3, 4, 5 ],
                    start: '09:00',
                    end: '13:00'
                },
                {
                    dow: [ 1, 2, 3, 4, 5 ],
                    start: '14:00',
                    end: '18:00'
                }
            ],
            minTime: '09:00:00'
        });
    }

    sizeScheduler()
    {
        let h1 = $(window).height(),
            h2 = $('#scheduler .fc-header-toolbar').outerHeight(true),
            h3 = h1-h2;
        $('#scheduler .fc-time-grid .fc-slats td').height('auto');
        $('#scheduler .fc-time-grid-container').height('auto');
        $('#scheduler').fullCalendar('option', 'height', h1);
        $('#scheduler').fullCalendar('option', 'contentHeight', h3);
        let h4 = $('.fc-time-grid').height(),
            h5 = h4/$('#scheduler .fc-time-grid .fc-slats tr').length;
        $('#scheduler .fc-time-grid .fc-slats td').height(h5);
        $('#scheduler').fullCalendar('rerenderEvents');
    }

    refreshScheduler()
    {
        $('#scheduler').fullCalendar('destroy');
        this.initScheduler();
    }

    generateDates()
    {    
        this.dates = [];
        // add pseudo environment full day dates
        for( let i = -100; i < 100; i++ )
        {
            if( ((i+2) % 7) === 0 || ((i+1) % 7) === 0 )
            {
                continue;
            }
            let type = null,
                day = moment().startOf('isoWeek').add(i, 'days');
            switch(day.format('dddd'))
            {
                case 'Montag': type = 'windows'; break;
                case 'Dienstag': type = 'linux'; break;
                case 'Mittwoch': type = 'mac'; break;
                case 'Donnerstag': type = 'mac'; break;
                case 'Freitag': type = 'windows'; break;
                default: type = 'windows'; break;
            }
            this.dates.push({
                start: day.format('YYYY-MM-DD'),
                end: day.format('YYYY-MM-DD'),
                title: '_'+type.toUpperCase(),
                backgroundColor: this.getColor(type)
            });
        }
        this.tickets.forEach((tickets__value) =>
        {
            if( tickets__value.date !== null && tickets__value.date != '' )
            {
                let date = null;
                let title = tickets__value.project+'\n'+(tickets__value.description||'').substring(0,100);
                let ticket_dates = tickets__value.date.split('\n');
                ticket_dates.forEach((ticket_dates__value, ticket_dates__key) =>
                {
                    if( (ticket_dates__key%2) === 0 )
                    {
                        date = {
                            title: title,
                            backgroundColor: this.getColor(tickets__value.status),
                        };
                    }
                    date[(((ticket_dates__key%2)===0)?('start'):('end'))] = ticket_dates__value;
                    if( (ticket_dates__key%2) === 1 )
                    {
                        this.dates.push(date);
                    }
                });
            }   
        });
        return this.dates;
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
                $('#app .ticket_entry[data-id="'+tickets__value._id+'"]').hide();
            }
            else
            {
                $('#app .ticket_entry[data-id="'+tickets__value._id+'"]').show();
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
            sorted = $('#app .ticket_table tbody .ticket_entry').sort((a, b) =>
            {
                if( sort_1 != '' )
                {
                    if( $(a).find('[name="'+sort_1+'"]').val() < $(b).find('[name="'+sort_1+'"]').val() ) { return -1; }
                    if( $(a).find('[name="'+sort_1+'"]').val() > $(b).find('[name="'+sort_1+'"]').val() ) { return 1; }
                }
                else
                {
                    if( $(a).find('[name="date"]').val() < $(b).find('[name="date"]').val() ) { return -1; }
                    if( $(a).find('[name="date"]').val() > $(b).find('[name="date"]').val() ) { return 1; }
                }
                if( sort_2 != '' )
                {
                    if( $(a).find('[name="'+sort_2+'"]').val() < $(b).find('[name="'+sort_2+'"]').val() ) { return -1; }
                    if( $(a).find('[name="'+sort_2+'"]').val() > $(b).find('[name="'+sort_2+'"]').val() ) { return 1; }
                }
                if( $(a).find('[name="status"]').val() < $(b).find('[name="status"]').val() ) { return 1; }
                if( $(a).find('[name="status"]').val() > $(b).find('[name="status"]').val() ) { return -1; }
                if( $(a).attr('data-id') < $(b).attr('data-id') ) { return -1; }
                if( $(a).attr('data-id') > $(b).attr('data-id') ) { return 1; }
                return 0;
            });
        $('#app .ticket_table tbody').html(sorted);
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
            $('#app .ticket_entry[data-id="'+tickets__value._id+'"]').css('background-color',this.getColor(tickets__value.status));
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
        $('#app .ticket_table tfoot .sum').text(sum);
    }

}
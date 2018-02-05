import Helpers from './_helpers';
import PouchDB from 'pouchdb';
import jQuery from 'jquery'; window.$ = window.jQuery = jQuery;
import 'fullcalendar';
import 'fullcalendar/dist/locale/de';

export default class App
{

    constructor()
    {       
        this.db = null;
        this.tickets = null;        
        this.couchdb = 'http://localhost:5984/hosea';
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
            'working': '#ef9a9a'
        };
        this.dates = null;
    }

    async init()
    {
          this.initDatabase();
    await this.cleanDatabase();
    //await this.backupDatabase();
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
        this.bindChangeTracking();
        this.bindUpload();
        this.bindDownload();
        this.bindDeleteAttachment();
        this.bindDelete();
        this.bindSave();
    }
    
    initDatabase()
    {
        this.db = new PouchDB(this.couchdb);
    }

    cleanDatabase()
    {
        return new Promise((resolve,reject) =>
        {
            this.db.compact().then((info) => 
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
            resolve();
            /*
            const couchbackup = require('@cloudant/couchbackup');
            couchbackup.backup(
                this.couchdb,
                fs.createWriteStream('backup.txt'),
                  {parallelism: 2},
                  function(err, data) {
                    if (err) {
                      console.error("Failed! " + err);
                    } else {
                        console.log('backup complete!');
                        resolve();
                    }
                  });
                  */
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
                this.tickets = this.tickets.sort((a, b) =>
                {
                    if( a.date < b.date ) { return -1; }
                    if( a.date > b.date ) { return 1; }
                    if( a.status < b.status ) { return 1; }
                    if( a.status > b.status ) { return -1; }
                    if( a._id < b._id ) { return -1; }
                    if( a._id > b._id ) { return 1; }
                    return 0;
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
        this.tickets.forEach((tickets__value) => {
            $('.ticket_table tbody').append(
                this.createHtmlLine(tickets__value)
            );
        });
    }    

    textareaAutoHeight()
    {
        Helpers.textareaAutoHeight('#app textarea');
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
            html += `
                <td>
                    <textarea name="${cols__value}">${ticket[cols__value]||''}</textarea>
                </td>
            `;
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

                <input type="file" name="attachments" multiple="multiple" />
   
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
                <a class="ticket_entry__attachment_download" href="#">${ this.getFilename(attachment_id) }</a>
                <a class="ticket_entry__attachment_delete" href="#">löschen</a>
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
                    this.saveTickets().then(() => {
                        if( focus.length > 0 )
                        {
                            focus.focus();
                        }
                    }).catch((error) => { console.log(error); });
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

    bindUpload()
    {
        $('#app').on('change', '.ticket_entry input[type="file"]', (e) =>
        {
            this.startUploads(
                $(e.currentTarget).closest('.ticket_entry').attr('data-id'),
                e.currentTarget.files
            ).then((attachment_ids) =>
            {
                console.log(attachment_ids);
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
        });   
    }

    startDownload( document_id, attachment_id )
    { 
        this.db.getAttachment( document_id, attachment_id ).then((blob) =>
        {                
            console.log(blob);
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
            this.deleteTicket( document_id ).then((result) => { }).catch((error) => { });
            $(e.currentTarget).closest('.ticket_entry').remove();
            return false;
        });
    }

    deleteTicket( document_id )
    {
        return new Promise((resolve,reject) => {
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
            ).then((result) => { }).catch((error) => { });
            $(e.currentTarget).closest('.ticket_entry__attachment').remove();
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
        console.log('unlocking ticket '+document_id);
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
        return new Promise((resolve,reject) => {
            this.lockTicket(document_id);
            this.db.removeAttachment(
                document_id,
                attachment_id,
                this.getTicketData(document_id)._rev
            ).then((result) =>
            {
                this.unlockTicket(document_id, result.rev, true);
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
                resolve();
            }).catch((error) =>
            {
                console.log(error);
                reject();
            }); 
        });
    }

    initKeyboardNavigation()
    {
        $('#app').on('keydown', '.ticket_entry :input', (e) =>
        {
            // arrow right (switch)
            if( e.keyCode === 39 && $(e.currentTarget).closest('td').next('td').length > 0 && e.currentTarget.selectionEnd >= $(e.currentTarget).val().length )
            {
                $(e.currentTarget).closest('td').next('td').find(':input').focus();
            }
            // arrow left (switch)
            if( e.keyCode === 37 && $(e.currentTarget).closest('td').prev('td').length > 0 && e.currentTarget.selectionEnd <= 0 )
            {
                $(e.currentTarget).closest('td').prev('td').find(':input').focus();
            }
            // arrow top (switch)
            if( e.keyCode === 38 && $(e.currentTarget).closest('tr').prev('tr').length > 0 && e.currentTarget.selectionEnd <= 0 )
            {
                $(e.currentTarget).closest('tr').prev('tr').find('td:nth-child('+($(e.currentTarget).closest('td').prevAll('td').length+1)+')').find(':input').focus();
            }
            // arrow down (switch)
            if( e.keyCode === 40 && $(e.currentTarget).closest('tr').next('tr').length > 0 && e.currentTarget.selectionEnd >= $(e.currentTarget).val().length )
            {
                $(e.currentTarget).closest('tr').next('tr').find('td:nth-child('+($(e.currentTarget).closest('td').prevAll('td').length+1)+')').find(':input').focus();
            }
            // arrow down (create)
            if( e.keyCode === 40 && $(e.currentTarget).closest('tr').next('tr').length === 0 && e.currentTarget.selectionEnd >= $(e.currentTarget).val().length )
            {
                if( this.lastLineIsEmpty() )
                {
                    return false;
                }
                this.createTicket().then((ticket) =>
                {
                    $('.ticket_table tbody').append(this.createHtmlLine(ticket));
                    $(e.currentTarget).closest('tr').next('tr').find('td:nth-child('+($(e.currentTarget).closest('td').prevAll('td').length+1)+')').find(':input').focus();
                }).catch((error) =>
                {
                    console.log(error);
                });            }
        });
    }

    lastLineIsEmpty()
    {
        let empty = true;
        $('.ticket_entry:last-child :input').each((index,el) =>
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
            weekends: false,
            locale: 'de',
            editable: false,
            events: this.generateDates(),
            defaultView: 'agendaWeek',
            weekends: true,
            allDaySlot: false,
            eventTextColor: '#000000',
            /*
            aspectRatio: 3,
            */
            height: 'auto',
            contentHeight: 'auto',
            businessHours: {
                dow: [ 1, 2, 3, 4, 5 ],
                start: '09:00',
                end: '18:00'
            },
            minTime: '09:00:00',
            //maxTime: '24:00:00',
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
        this.tickets.forEach((tickets__value) =>
        {
            if( tickets__value.date !== null )
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
        $('#meta #filter').remove();
        $('#meta').append('<div id="filter"></div>');
        ['person', 'status', 'priority', 'date', 'project'].forEach((columns__value) =>
        {
            $('#filter').append(`
                <select name="${columns__value}">
                    <option value="*">${columns__value}</option>
                </select>
            `);
            let options = [];
            this.tickets.forEach((tickets__value) =>
            {
                let options_value = tickets__value[columns__value];
                if( columns__value == 'date' && options_value != '' )
                {
                    options_value = options_value.substring(0,10);
                }
                if( !options.includes(options_value) )
                {
                    options.push(options_value);
                }
            });
            options.sort();
            options.forEach((options__value) =>
            {
                $('#filter select[name="'+columns__value+'"]').append('<option value="'+options__value+'">'+options__value+'</option>');
            });
            $('#filter select').change((el) =>
            {
                this.tickets.forEach((tickets__value) =>
                {
                    let visible = true;
                    $('#filter select').each((index,el) =>
                    {
                        let val_search = $(el).val();
                        let val_target = tickets__value[$(el).attr('name')];
                        if( $(el).attr('name') == 'date' )
                        {
                            val_target = val_target.substring(0,10);
                        }
                        if( val_search != '*' && val_target != val_search )
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
                this.updateSum();
            });
        });
    }

    initSort()
    {
        $('#meta #sort').remove();
        $('#meta').append('<div id="sort"></div>');
        [1,2].forEach((step) =>
        {
            $('#sort').append('<select name="sort_'+step+'"><option value="">sort #'+step+'</option></select>');
            this.cols.forEach((columns__value) =>
            {
                $('#sort select[name="sort_'+step+'"]').append('<option value="'+columns__value+'">'+columns__value+'</option>');
            });
        });
        $('#sort select').change((el) =>
        {
            let sort_1 = $('#sort select[name="sort_1"]').val(),
                sort_2 = $('#sort select[name="sort_2"]').val();
            if( sort_1 != '' )
            {
                let sorted = $('#app .ticket_table tbody .ticket_entry').sort((a, b) =>
                {
                    if( $(a).find('[name="'+sort_1+'"]').val() < $(b).find('[name="'+sort_1+'"]').val() ) { return -1; }
                    if( $(a).find('[name="'+sort_1+'"]').val() > $(b).find('[name="'+sort_1+'"]').val() ) { return 1; }
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
        });
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
            if( tickets__value.visible !== false && tickets__value.time !== null )
            {
                sum += parseFloat(tickets__value.time.replace(',','.'));
            }
        });
        $('#app .ticket_table tfoot .sum').text(sum);
    }

}
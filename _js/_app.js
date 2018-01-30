import Helpers from './_helpers';
import PouchDB from 'pouchdb';
import jQuery from 'jquery'; window.$ = window.jQuery = jQuery;

export default class App {

    constructor() {
        this.db = null;
        this.tickets = null;
    }

    async init()
    {
          this.initDatabase();
    await this.cleanDatabase();
    await this.fetchTickets();
          this.buildHtml();
          this.setupBindings();
          this.initKeyboardNavigation();
          this.initSaveManually();
        /*
        */
        //this.initAutosaveAfterChange();
        //this.initAutosaveAfterTime();
    }

    initDatabase()
    {
        this.db = new PouchDB('http://localhost:5984/hosea');

    }

    cleanDatabase()
    {
        return new Promise((resolve,reject) =>
        {
            this.db.compact().then((info) => {
                //console.log('compaction complete');
                //console.log(info);
                resolve();
            }).catch((error) =>
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
        $('#app').append('<table class="ticket_table"></table>');
        $('.ticket_table').append(`
            <thead>
                <tr>
                    <td>priority</td>
                    <td>date</td>
                    <td>time</td>
                    <td>project</td>
                    <td>description</td>
                    <td>attachment</td>
                    <td>delete</td>
                </tr>
            </thead>
        `);
        $('.ticket_table').append('<tbody></tbody>');
        this.tickets.forEach((tickets__value) => {
            $('.ticket_table tbody').append(
                this.createHtmlLine(tickets__value)
            );
        });
        $('#app').append('<a href="#" class="button_save">Speichern</a>');
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
        let html = ``;

        html += `
            <tr
                class="ticket_entry"
                data-id="${ticket._id}"
            >
                <td>
                    <input name="priority" type="text" value="${ticket.priority||''}" />
                </td>
                <td>
                    <input name="date" type="text" value="${ticket.date||''}" />
                </td>
                <td>
                    <input name="time" type="text" value="${ticket.time||''}" />
                </td>
                <td>
                    <input name="project" type="text" value="${ticket.project||''}" />
                </td>
                <td>
                    <textarea name="description">${ticket.description||''}</textarea>
                </td>
                <td>
        `;
        html += `<ul class="ticket_entry__attachments">`;
        if( ticket._attachments !== undefined && Object.keys(ticket._attachments).length > 0 )
        {
            Object.entries(ticket._attachments).forEach(([attachment__key, attachment__value]) =>
            {
                html += this.createHtmlDownloadLine(attachment__key);
            });
        }
        html += `</ul>`;
        html += `<input name="attachment" type="file" />`;        
        html += `
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

    setupBindings()
    {
        this.bindChangeTracking();
        this.bindUpload();
        this.bindDownload();
        this.bindDeleteAttachment();
        this.bindDelete();
    }

    bindChangeTracking()
    {
        $('#app').on('change', '.ticket_entry :input', (el) =>
        {
            $(el.currentTarget).closest('.ticket_entry').addClass('ticket_entry--changed');
        });
    }

    bindUpload()
    {
        $('#app').on('change', '.ticket_entry input[type="file"]', (e) =>
        {
            this.startUpload(
                $(e.currentTarget).closest('.ticket_entry').attr('data-id'),
                e.currentTarget.files[0]
            ).then((attachment_id) =>
            {
                $(e.currentTarget).val('');
                $(e.currentTarget).closest('.ticket_entry').find('.ticket_entry__attachments').append(
                    this.createHtmlDownloadLine(attachment_id)
                );
            }).catch((error) =>
            {
                console.log(error);
            });;
        });
    }

    startUpload( document_id, file )
    {
        return new Promise((resolve,reject) => {
            this.lockTicket(document_id);
            let attachment_id = Helpers.guid()+'#'+file.name;
            this.db.putAttachment(
                document_id,
                attachment_id,
                this.getTicketData(document_id)._rev,
                file,
                file.type
            ).then((result) =>
            {
                this.unlockTicket(document_id, result.rev);
                resolve(attachment_id);
            }).catch((error) =>
            {
                console.log(error);
                reject();
            });
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

    unlockTicket(document_id, rev)
    {
        this.setTicketData(document_id, '_rev', rev);
        console.log('unlocking ticket '+document_id);
        $('.ticket_entry[data-id="'+document_id+'"]').removeClass('ticket_entry--changed');
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
                this.unlockTicket(document_id, result.rev);
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
        let changed = [];
        $('.ticket_entry--changed').each((index,el) =>
        {
            this.setTicketData(
                $(el).attr('data-id'),
                {
                    priority: $(el).find('[name="priority"]').val(),
                    date: $(el).find('[name="date"]').val(),
                    time: $(el).find('[name="time"]').val(),
                    project: $(el).find('[name="project"]').val(),
                    description: $(el).find('[name="description"]').val(),
                }
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
        }).catch((error) =>
        {
            console.log(error);
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
            if( e.keyCode === 38 && $(e.currentTarget).closest('tr').prev('tr').length > 0 )
            {
                $(e.currentTarget).closest('tr').prev('tr').find('td:nth-child('+($(e.currentTarget).closest('td').prevAll('td').length+1)+')').find(':input').focus();
            }
            // arrow down (switch)
            if( e.keyCode === 40 && $(e.currentTarget).closest('tr').next('tr').length > 0 )
            {
                $(e.currentTarget).closest('tr').next('tr').find('td:nth-child('+($(e.currentTarget).closest('td').prevAll('td').length+1)+')').find(':input').focus();
            }
            // arrow down (create)
            if( e.keyCode === 40 && $(e.currentTarget).closest('tr').next('tr').length === 0 )
            {
                this.createTicket().then((ticket) =>
                {
                    $('.ticket_table tbody').append(this.createHtmlLine(ticket));
                    $(e.currentTarget).closest('tr').next('tr').find('td:nth-child('+($(e.currentTarget).closest('td').prevAll('td').length+1)+')').find(':input').focus();
                }).catch((error) =>
                {
                    console.log(error);
                });                
            }
        });
    }

    createTicket(
        priority = null,
        date = null,
        time = null,
        project = null,
        description = null
    )
    {
        return new Promise((resolve, reject) =>
        {
            let ticket = {
                priority: priority,
                date: date,
                time: time,
                project: project,
                description: description
            }
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

    initAutosaveAfterTime()
    {
        setInterval(() => 
        {
            this.saveTickets();
            console.log('autosave successful');
        },10000);
    }

    initAutosaveAfterChange()
    {
        $('#app').on('change', '.ticket_entry :input', (e) =>
        {

        });
    }

    initSaveManually()
    {
        $('#app').on('click', '.button_save', () =>
        {
            this.saveTickets();
            return false;
        });
    }

}
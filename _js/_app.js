import Helpers from './_helpers';
import PouchDB from 'pouchdb';
import jQuery from "jquery";
window.$ = window.jQuery = jQuery;

export default class App {

    constructor() {
        this.db = null;
    }

    init()
    {
        this.initDatabase();
        this.getTickets();
        this.initHtml();
        this.initAutosave();
        this.initKeyboardNavigation();
    }

    initDatabase()
    {
        this.db = new PouchDB('http://localhost:5984/hosea');
    }

    createTicket(
        priority = null,
        date = null,
        time = null,
        project = null,
        description = null,
        attachment = null
    )
    {
        let ticket = {
            type: 'ticket',
            priority: priority,
            date: date,
            time: time,
            project: project,
            description: description,
            attachment: attachment
        }
        return new Promise((resolve, reject) =>
        {
            this.db.post(ticket).then((response) =>
            {
                ticket._id = response.id;
                ticket._rev = response.rev;
                resolve(ticket);
            }).catch((error) =>
            {
                reject(error);
            });
        });
    }

    getTickets()
    {
        return new Promise((resolve,reject) =>
        {
            this.db.allDocs({
                include_docs: true,
                attachments: true
            }).then((tickets) =>
            {
                resolve(tickets.rows);
            }).catch((error) =>
            {
                reject(error);
            });
        });
    }

    async initHtml()
    {
        let tickets = await this.getTickets();
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
                </tr>
            </thead>
        `);
        $('.ticket_table').append('<tbody></tbody>');
        tickets.forEach((tickets__value) => {
            $('.ticket_table tbody').append(this.createHtmlLine(tickets__value.doc));
        });
        /*
        $('#app').append('<a href="#" class="button_save">Speichern</a>');
        $('#app').on('click', '.button_save', () =>
        {
            this.updateTickets();
            return false;
        });
        */
    }

    updateTicket(id)
    {
        let el = $('.ticket_entry[data-id="'+id+'"]');
        let data = {
            _id: el.attr('data-id'),
            _rev: el.attr('data-rev'),
            priority: el.find('[name="priority"]').val(),
            date: el.find('[name="date"]').val(),
            time: el.find('[name="time"]').val(),
            project: el.find('[name="project"]').val(),
            description: el.find('[name="description"]').val(),
            attachment: el.find('[name="attachment"]').val(),
        }
        console.log(data);
        this.db.put(data).then((response) =>
        {
            console.log(response);
            $(ticket).closest('.ticket_entry').attr('data-rev', response.rev);
        }).catch((error) =>
        {
            console.log(error);
        });
    }

    updateTickets()
    {
        let tickets = [];
        $('#app .ticket_entry').each(function() 
        {
            tickets.push({
                _id: $(this).attr('data-id'),
                _rev: $(this).attr('data-rev'),
                priority: $(this).find('[name="priority"]').val(),
                date: $(this).find('[name="date"]').val(),
                time: $(this).find('[name="time"]').val(),
                project: $(this).find('[name="project"]').val(),
                description: $(this).find('[name="description"]').val(),
                attachment: $(this).find('[name="attachment"]').val(),
            });
        });
        this.db.bulkDocs(tickets).then((result) =>
        {
            console.log(result);
            result.forEach((value) =>
            {
                $('.ticket_entry[data-id="'+value.id+'"]').attr('data-rev',value.rev);
            });
        }).catch((error) =>
        {
            console.log(error);
        });
    }

    createHtmlLine(ticket)
    {
        return `
            <tr
                class="ticket_entry"
                data-id="${ticket._id}"
                data-rev="${ticket._rev}"
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
                    <input name="attachment" type="text" value="${ticket.attachment||''}" />
                </td>
            </tr>
        `
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

    initAutosave()
    {
        setInterval(() => 
        {
            this.updateTickets();
            console.log('autosave successful');
        },10000);
    }

}

/* make publically available to run from outside for debugging purposes */
window.App = App;
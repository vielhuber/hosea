import Store from './Store';

export default class Html {
    static buildHtml() {
        document.querySelector('#app').insertAdjacentHTML(
            'beforeend',
            `
            <div id="meta"></div>
            <div id="tickets"></div>
            <div class="scheduler"></div>
        `
        );

        document.querySelector('#tickets').insertAdjacentHTML(
            'beforeend',
            `
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
        `
        );
        Store.data.cols.forEach(cols__value => {
            document
                .querySelector('.ticket_table thead tr')
                .insertAdjacentHTML(
                    'beforeend',
                    '<td>' + cols__value + '</td>'
                );
            document
                .querySelector('.ticket_table tfoot tr')
                .insertAdjacentHTML(
                    'beforeend',
                    '<td>' +
                        (cols__value == 'time'
                            ? '<span class="sum"></span>'
                            : '') +
                        '</td>'
                );
        });
        document
            .querySelector('.ticket_table thead tr')
            .insertAdjacentHTML(
                'beforeend',
                '<td>attachments</td><td>delete</td>'
            );
        document
            .querySelector('.ticket_table tfoot tr')
            .insertAdjacentHTML('beforeend', '<td></td><td></td>');
        Store.data.tickets.forEach(tickets__value => {
            document
                .querySelector('.ticket_table tbody')
                .insertAdjacentHTML(
                    'beforeend',
                    Html.createHtmlLine(tickets__value, false)
                );
        });
    }

    static createHtmlLine(ticket, visible) {
        let html = '';

        html +=
            '<tr class="ticket_entry' +
            (visible === true ? ' ticket_entry--visible' : '') +
            '" data-id="' +
            ticket.id +
            '">';

        Store.data.cols.forEach(cols__value => {
            html += '<td>';
            html +=
                '<textarea ' +
                (['date', 'description'].includes(cols__value)
                    ? ' class="autosize"'
                    : '') +
                ' name="' +
                cols__value +
                '">' +
                (ticket[cols__value] || '') +
                '</textarea>';
            html += '</td>';
        });

        html += `
            <td>
                <ul class="ticket_entry__attachments">`;
        if (ticket.attachments !== undefined && ticket.attachments.length > 0) {
            ticket.attachments.forEach(
                (attachments__value, attachments__key) => {
                    html += Html.createHtmlDownloadLine(attachments__value);
                }
            );
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

    static createHtmlDownloadLine(attachment) {
        return `
            <li class="ticket_entry__attachment" data-id="${attachment.id}">
                <a class="ticket_entry__attachment_download" href="#" title="${
                    attachment.name
                }"></a>
                <a class="ticket_entry__attachment_delete" href="#" title="Löschen"></a>
            </li>
        `;
    }
}

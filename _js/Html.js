import Store from './Store';

export default class Html {
    static buildHtml() {
        document.querySelector('#app').insertAdjacentHTML(
            'beforeend',
            `
            <div class="tickets"></div>
            <div class="scheduler"></div>
        `
        );

        document.querySelector('.tickets').insertAdjacentHTML(
            'beforeend',
            `
            <div class="metabar"></div>
            <div class="tickets__table-container">
                <table class="tickets__table">
                    <thead class="tickets__table-head">
                        <tr class="tickets__table-row"></tr>
                    </thead>
                    <tbody class="tickets__table-body">
                    </tbody>
                    <tfoot class="tickets__table-foot">
                        <tr class="tickets__table-row"></tr>
                    </tfoot>
                </table>
            </div>
            <a href="#" class="button-save">Speichern</a>
        `
        );
        Store.data.cols.forEach(cols__value => {
            document.querySelector('.tickets__table-head tr').insertAdjacentHTML('beforeend', '<td class="tickets__table-cell">' + cols__value + '</td>');
            document
                .querySelector('.tickets__table-foot tr')
                .insertAdjacentHTML('beforeend', '<td class="tickets__table-cell">' + (cols__value == 'time' ? '<span class="tickets__sum"></span>' : '') + '</td>');
        });
        document.querySelector('.tickets__table-head tr').insertAdjacentHTML(
            'beforeend',
            `
                    <td class="tickets__table-cell">attachments</td>
                    <td class="tickets__table-cell">delete</td>
                `
        );
        document.querySelector('.tickets__table-foot tr').insertAdjacentHTML(
            'beforeend',
            `
                <td class="tickets__table-cell"></td>
                <td class="tickets__table-cell"></td>
            `
        );
        Store.data.tickets.forEach(tickets__value => {
            document.querySelector('.tickets__table-body').insertAdjacentHTML('beforeend', Html.createHtmlLine(tickets__value, false));
        });
    }

    static createHtmlLine(ticket, visible) {
        let html = '';

        html += '<tr class="tickets__table-row tickets__entry' + (visible === true ? ' tickets__entry--visible' : '') + '" data-id="' + ticket.id + '">';

        Store.data.cols.forEach(cols__value => {
            html += '<td class="tickets__table-cell">';
            html +=
                '<textarea class="tickets__textarea" autocorrect="off" autocapitalize="off" spellcheck="false" ' +
                (['date', 'description'].includes(cols__value) ? ' class="autosize"' : '') +
                ' name="' +
                cols__value +
                '">' +
                (ticket[cols__value] || '') +
                '</textarea>';
            html += '</td>';
        });

        html += `
            <td class="tickets__table-cell">
                <ul class="tickets__attachments">`;
        if (ticket.attachments !== undefined && ticket.attachments.length > 0) {
            ticket.attachments.forEach((attachments__value, attachments__key) => {
                html += Html.createHtmlDownloadLine(attachments__value);
            });
        }
        html += `
                </ul>

                <label class="tickets__upload">
                    <input class="tickets__upload-input" type="file" name="attachments" multiple="multiple" />
                </label>
   
            </td>
            <td class="tickets__table-cell">
                <a href="#" class="tickets__entry__delete">x</a>
            </td>
        </tr>
        `;
        return html;
    }

    static createHtmlDownloadLine(attachment) {
        return `
            <li class="tickets__attachment" data-id="${attachment.id}">
                <a class="tickets__attachment-download" href="#" title="${attachment.name}"></a>
                <a class="tickets__attachment-delete" href="#" title="Löschen"></a>
            </li>
        `;
    }
}

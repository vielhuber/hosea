import Store from './Store';

export default class Html {
    static buildHtml() {
        document.querySelector('#app').insertAdjacentHTML(
            'beforeend',
            `
            <div class="tickets"></div>
            <div class="scheduler"></div>
            <div class="quickbox"></div>
            <div class="footer"></div>
        `
        );

        Html.setViewClass();

        document.querySelector('#app').insertAdjacentHTML(
            'afterbegin',
            `
                <div class="animation">
                    <div class="animation__grid">
                        <div class="animation__grid-lines"></div>
                    </div>
                    <div class="animation__mask"></div>
                </div>
            `
        );

        document.querySelector('.footer').insertAdjacentHTML(
            'beforeend',
            `
            <a href="#" class="footer__save">_save</a>
            <a href="#" class="footer__create">_create</a>
            <a href="#" class="footer__view">_view</a>
            <span class="footer__status"></span>
            <a href="#" class="footer__cron" target="_blank">_cron</a>
            <a href="#" class="footer__ical" target="_blank">_ical</a>
            <a href="#" class="footer__logout">_logout</a>
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
        `
        );
        Store.data.cols.forEach((cols__value) => {
            document
                .querySelector('.tickets__table-head tr')
                .insertAdjacentHTML('beforeend', '<td class="tickets__table-cell">' + cols__value + '</td>');
            if (cols__value === 'status') {
                document.querySelector('.tickets__table-head tr td:last-child').insertAdjacentHTML(
                    'beforeend',
                    `
                    <span title="scheduled
idle
allday
roaming
fixed
done
billed
recurring
working" class="tickets__table-tooltip">(?)</span>
                `
                );
            }
            if (cols__value === 'priority') {
                document.querySelector('.tickets__table-head tr td:last-child').insertAdjacentHTML(
                    'beforeend',
                    `
                    <span title="[A-D]" class="tickets__table-tooltip">(?)</span>
                `
                );
            }
            if (cols__value === 'time') {
                document.querySelector('.tickets__table-head tr td:last-child').insertAdjacentHTML(
                    'beforeend',
                    `
                    <span title="[0-24]" class="tickets__table-tooltip">(?)</span>
                `
                );
            }
            if (cols__value === 'project') {
                document.querySelector('.tickets__table-head tr td:last-child').insertAdjacentHTML(
                    'beforeend',
                    `
                    <span title="- caps only
- use emojis at start+end
- prefix '--' means not certain" class="tickets__table-tooltip">(?)</span>
                `
                );
            }
            if (cols__value === 'date') {
                document.querySelector('.tickets__table-head tr td:last-child').insertAdjacentHTML(
                    'beforeend',
                    `
                    <span title="01.01.18
01.01.18 09:00-10:00
MO [-05.10.18 -12.10.18 >01.01.18 <01.01.19]
MO 10:00-11:00 [-05.10.18 -12.10.18 >01.01.18 <01.01.19]
MO#1 10:00-11:00 [-05.10.18 -12.10.18 >01.01.18 <01.01.19]
MO#12 10:00-11:00 [-05.10.18 -12.10.18 >01.01.18 <01.01.19]
MO~1 10:00-11:00 [-05.10.18 -12.10.18 >01.01.18 <01.01.19]
MO~12 10:00-11:00 [-05.10.18 -12.10.18 >01.01.18 <01.01.19]
MO%2 10:00-11:00 [-05.10.18 -12.10.18 >01.01.18 <01.01.19]
01.01. [-05.10.18 -12.10.18 >01.01.18 <01.01.19]
01.01. 09:00-10:00 [-05.10.18 -12.10.18 >01.01.18 <01.01.19]

DD#N: (N%4)th weekday in every ((N-1)/4)th month
DD~N: weekday in calendar week N
DD%N: weekday in calendar week %N=0 (if >X specified, N -= calendar week of X)

*: magic algorithm that generates an automatic date" class="tickets__table-tooltip">(?)</span>
                `
                );
            }
            document
                .querySelector('.tickets__table-foot tr')
                .insertAdjacentHTML(
                    'beforeend',
                    '<td class="tickets__table-cell">' +
                        (cols__value == 'time' ? '<span class="tickets__sum"></span>' : '') +
                        '</td>'
                );
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
    }

    static createHtmlLine(ticket, visible) {
        let html = '';

        html +=
            '<tr class="tickets__table-row tickets__entry' +
            (visible === true ? ' tickets__entry--visible' : '') +
            '" data-id="' +
            ticket.id +
            '">';

        Store.data.cols.forEach((cols__value) => {
            html += '<td class="tickets__table-cell">';
            html +=
                '<textarea class="tickets__textarea tickets__textarea--' +
                cols__value +
                (['date', 'description'].includes(cols__value) ? ' autoheight' : '') +
                (['priority', 'project'].includes(cols__value) ? ' autocaps' : '') +
                ' validate-field validate-field--' +
                cols__value +
                '" autocorrect="off" autocapitalize="off" spellcheck="false" name="' +
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

                <label class="tickets__upload" title="_upload">
                    <input class="tickets__upload-input" type="file" name="attachments" multiple="multiple" />
                </label>

            </td>
            <td class="tickets__table-cell">
                <a href="#" class="tickets__entry__delete">🗑️</a>
            </td>
        </tr>
        `;
        return html;
    }

    static createHtmlDownloadLine(attachment) {
        return `
            <li class="tickets__attachment" data-id="${attachment.id}">
                <a class="tickets__attachment-download" href="#" title="${attachment.name}"></a>
                <a class="tickets__attachment-delete" href="#" title="_delete"></a>
            </li>
        `;
    }

    static setViewClass() {
        if (Store.data.weeksInViewport > 1) {
            document.querySelector('#app').classList.add('view-mode--wide');
        } else {
            document.querySelector('#app').classList.remove('view-mode--wide');
        }
    }

    static bindValidation() {
        document.addEventListener('input', (e) => {
            if (e.target.closest('.validate-field')) {
                Html.validateField(e.target);
            }
        });
    }

    static validateField($target) {
        if ($target.value !== '') {
            if ($target.closest('.validate-field--date')) {
                if ($target.value !== '*' && Dates.parseDateString($target.value, 'tickets') === false) {
                    $target.setCustomValidity('wrong format');
                } else {
                    $target.setCustomValidity('');
                }
            }
            if ($target.closest('.validate-field--time')) {
                if (
                    !new RegExp('^[0-9]$|^[0-9],[0-9]$|^[0-9],[0-9][0-9]$').test($target.value) ||
                    $target.value < 0 ||
                    $target.value > 24
                ) {
                    $target.setCustomValidity('wrong format');
                } else {
                    $target.setCustomValidity('');
                }
            }
            if ($target.closest('.validate-field--project')) {
                if (
                    new RegExp(
                        '^(--)?(\\p{RGI_Emoji})?[A-Z0-9\u00c4\u00d6\u00dc\u00df]{1}[ A-Z0-9\u00c4\u00d6\u00dc\u00df]{1,}[A-Z0-9\u00c4\u00d6\u00dc\u00df]{1}(\\p{RGI_Emoji})?$',
                        'v'
                    ).test($target.value) === false
                ) {
                    $target.setCustomValidity('wrong format');
                } else if (
                    (new RegExp('(\\p{RGI_Emoji}){1}$', 'v').test($target.value) === true ||
                        new RegExp('^(--)?(\\p{RGI_Emoji}){1}', 'v').test($target.value) === true) &&
                    ($target.value.match(new RegExp('\\p{RGI_Emoji}', 'gv')).length !== 2 ||
                        $target.value.match(new RegExp('\\p{RGI_Emoji}', 'gv'))[0] !==
                            $target.value.match(new RegExp('\\p{RGI_Emoji}', 'gv'))[1])
                ) {
                    $target.setCustomValidity('wrong format');
                } else {
                    $target.setCustomValidity('');
                }
            }
            if ($target.closest('.validate-field--priority')) {
                if (!['A', 'B', 'C', 'D'].includes($target.value)) {
                    $target.setCustomValidity('wrong format');
                } else {
                    $target.setCustomValidity('');
                }
            }
            if ($target.closest('.validate-field--status')) {
                if (
                    ![
                        'scheduled',
                        'idle',
                        'allday',
                        'roaming',
                        'fixed',
                        'done',
                        'billed',
                        'recurring',
                        'working',
                    ].includes($target.value)
                ) {
                    $target.setCustomValidity('wrong format');
                } else {
                    $target.setCustomValidity('');
                }
            }
        } else {
            $target.setCustomValidity('');
        }
    }

    static bindAutoCaps() {
        document.addEventListener('input', (e) => {
            if (e.target.closest('.autocaps')) {
                let p = e.target.selectionStart;
                e.target.value = e.target.value.toUpperCase();
                e.target.setSelectionRange(p, p);
            }
        });
    }
}

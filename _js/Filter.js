import Dates from './Dates';
import Tickets from './Tickets';
import Sort from './Sort';
import Store from './Store';
import Textarea from './Textarea';

export default class Filter {
    static initFilter() {
        Filter.initUpdateFilter(false);
    }

    static updateFilter() {
        Filter.initUpdateFilter(true);
    }

    static initUpdateFilter(update) {
        let selected = {};
        if (update === true) {
            document.querySelectorAll('#meta #filter select').forEach(el => {
                selected[el.getAttribute('name')] = el.value;
            });
            document.querySelector('#meta #filter').remove();
        }

        document
            .querySelector('#meta')
            .insertAdjacentHTML('beforeend', '<div id="filter"></div>');
        ['person', 'status', 'priority', 'date', 'project'].forEach(
            columns__value => {
                document.querySelector('#filter').insertAdjacentHTML(
                    'beforeend',
                    `
                <select name="${columns__value}">
                    <option value="*">${columns__value}</option>
                </select>
            `
                );
                if (columns__value === 'date') {
                    let d = Dates.getCurrentDate();
                    document
                        .querySelector('#filter [name="date"]')
                        .insertAdjacentHTML(
                            'beforeend',
                            '<option selected="selected" value="' +
                                Dates.dateFormat(d, 'Y-m-d') +
                                '">_today</option>'
                        );
                    d.setDate(d.getDate() + 1);
                    document
                        .querySelector('#filter [name="date"]')
                        .insertAdjacentHTML(
                            'beforeend',
                            '<option value="' +
                                Dates.dateFormat(d, 'Y-m-d') +
                                '">_tomorrow</option>'
                        );
                    d.setDate(d.getDate() + 1);
                    document
                        .querySelector('#filter [name="date"]')
                        .insertAdjacentHTML(
                            'beforeend',
                            '<option value="' +
                                Dates.dateFormat(d, 'Y-m-d') +
                                '">_day after tomorrow</option>'
                        );
                    d.setDate(d.getDate() - 3);
                    document
                        .querySelector('#filter [name="date"]')
                        .insertAdjacentHTML(
                            'beforeend',
                            '<option value="' +
                                Dates.dateFormat(d, 'Y-m-d') +
                                '">_yesterday</option>'
                        );
                    d.setDate(d.getDate() - 1);
                    document
                        .querySelector('#filter [name="date"]')
                        .insertAdjacentHTML(
                            'beforeend',
                            '<option value="' +
                                Dates.dateFormat(d, 'Y-m-d') +
                                '">_day before yesterday</option>'
                        );
                }
                let options = [];
                Store.data.tickets.forEach(tickets__value => {
                    let options_value = tickets__value[columns__value];
                    if (
                        columns__value == 'date' &&
                        options_value != null &&
                        options_value != ''
                    ) {
                        options_value = options_value.substring(0, 10);
                    }
                    if (!options.includes(options_value)) {
                        options.push(options_value);
                    }
                });
                options.sort((a, b) => {
                    if (a === null) {
                        a = '';
                    }
                    if (b === null) {
                        b = '';
                    }
                    return a.toLowerCase().localeCompare(b.toLowerCase());
                });
                options.forEach(options__value => {
                    document
                        .querySelector(
                            '#filter select[name="' + columns__value + '"]'
                        )
                        .insertAdjacentHTML(
                            'beforeend',
                            '<option value="' +
                                options__value +
                                '">' +
                                options__value +
                                '</option>'
                        );
                });
            }
        );

        if (update === true) {
            Object.entries(selected).forEach(
                ([selected__key, selected__value]) => {
                    document.querySelector(
                        '#meta #filter [name="' + selected__key + '"]'
                    ).value = selected__value;
                }
            );
        } else {
            Filter.doFilter();
            document.querySelector('#meta').addEventListener('change', e => {
                if (e.target.closest('#filter select')) {
                    Filter.doFilter();
                }
            });
        }
    }

    static doFilter() {
        Store.data.tickets.forEach(tickets__value => {
            let visible = true;
            document.querySelectorAll('#filter select').forEach(el => {
                let val_search = el.value,
                    val_target = tickets__value[el.getAttribute('name')];
                if (el.getAttribute('name') == 'date' && val_target !== null) {
                    val_target = val_target.substring(0, 10);
                }
                if (val_search != '*' && val_target != val_search) {
                    visible = false;
                }
                /* hide billed in overview */
                if (
                    el.getAttribute('name') == 'status' &&
                    val_search == '*' &&
                    val_target == 'billed' &&
                    (document.querySelector('#filter select[name="date"]')
                        .value == '*' ||
                        document.querySelector('#filter select[name="date"]')
                            .value == '')
                ) {
                    visible = false;
                }
            });
            if (visible === false && tickets__value.visible === true) {
                tickets__value.visible = false;
                document
                    .querySelector(
                        '#tickets .ticket_entry[data-id="' +
                            tickets__value.id +
                            '"]'
                    )
                    .classList.remove('ticket_entry--visible');
            } else if (visible === true && tickets__value.visible === false) {
                tickets__value.visible = true;
                document
                    .querySelector(
                        '#tickets .ticket_entry[data-id="' +
                            tickets__value.id +
                            '"]'
                    )
                    .classList.add('ticket_entry--visible');
            }
        });
        Sort.doSort();
        Tickets.updateSum();
        Textarea.textareaSetVisibleHeights();
    }
}

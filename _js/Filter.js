import Dates from './Dates';
import Tickets from './Tickets';
import Sort from './Sort';
import Store from './Store';
import Scheduler from './Scheduler';
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
            document
                .querySelector('.metabar__filter')
                .querySelectorAll('.metabar__select--filter')
                .forEach(el => {
                    selected[el.getAttribute('name')] = el.value;
                });
            document.querySelector('.metabar__filter').remove();
        }

        document.querySelector('.metabar').insertAdjacentHTML('beforeend', '<div class="metabar__filter"></div>');
        ['status', 'priority', 'date', 'project'].forEach(columns__value => {
            document.querySelector('.metabar__filter').insertAdjacentHTML(
                'beforeend',
                `
                <select class="metabar__select metabar__select--filter" name="${columns__value}">
                    <option value="*">${columns__value}</option>
                </select>
            `
            );
            if (columns__value === 'date') {
                document.querySelector('.metabar__select--filter[name="date"]').insertAdjacentHTML('beforeend', '<option value=""></option>');
                let firstDay = new Date('2018-01-01 00:00:00');
                let curDay = new Date();
                curDay.setHours(0);
                curDay.setMinutes(0);
                curDay.setSeconds(0);
                let lastDay = new Date(parseInt(new Date().getFullYear()) + 1 + '-12-31 00:00:00');
                while (firstDay < lastDay) {
                    document
                        .querySelector('.metabar__select--filter[name="date"]')
                        .insertAdjacentHTML(
                            'beforeend',
                            '<option' +
                                (Dates.sameDay(firstDay, curDay) ? ' selected="selected"' : '') +
                                ' value="' +
                                Dates.dateFormat(firstDay, 'Y-m-d') +
                                '">' +
                                Dates.dateFormat(firstDay, 'd.m.y') +
                                '</option>'
                        );
                    firstDay.setDate(firstDay.getDate() + 1);
                }
            } else {
                let options = [];
                Store.data.tickets.forEach(tickets__value => {
                    let options_value = tickets__value[columns__value];
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
                        .querySelector('.metabar__select--filter[name="' + columns__value + '"]')
                        .insertAdjacentHTML('beforeend', '<option value="' + options__value + '">' + options__value + '</option>');
                });
            }
        });

        if (update === true) {
            Object.entries(selected).forEach(([selected__key, selected__value]) => {
                document.querySelector('.metabar__filter [name="' + selected__key + '"]').value = selected__value;
            });
        } else {
            Filter.doFilter();
            document.querySelector('.metabar').addEventListener('change', e => {
                if (e.target.closest('.metabar__select--filter')) {
                    let date = e.target.closest('.metabar__select--filter[name="date"]');
                    if (date && date.value !== '*' && date.value !== '') {
                        Store.data.session.activeDay = new Date(date.value);
                        Scheduler.initScheduler();
                    }
                    Filter.doFilter();
                }
            });
        }
    }

    static doFilter() {
        Store.data.tickets.forEach(tickets__value => {
            let visible = true;
            document
                .querySelector('.metabar__filter')
                .querySelectorAll('select')
                .forEach(el => {
                    let val_search = el.value,
                        val_target = tickets__value[el.getAttribute('name')],
                        visible_this = false;

                    // date
                    if (el.getAttribute('name') === 'date' && val_search !== '*' && val_search !== '') {
                        let parsed_values = Dates.parseDateString(val_target, 'tickets');
                        if (parsed_values !== false && parsed_values.length > 0) {
                            visible_this = true;
                        }
                    }

                    // all others
                    else if (val_search === '*' || val_target === val_search) {
                        visible_this = true;
                    }

                    /* special behaviour: hide billed in overview */
                    if (el.getAttribute('name') == 'status' && val_search === '*' && val_target === 'billed' && document.querySelector('.metabar__select--filter[name="date"]').value === '*') {
                        visible_this = false;
                    }

                    if (visible_this === false) {
                        visible = false;
                    }
                });
            if (visible === false && tickets__value.visible === true) {
                tickets__value.visible = false;
                document.querySelector('.tickets .tickets__entry[data-id="' + tickets__value.id + '"]').classList.remove('tickets__entry--visible');
            } else if (visible === true && tickets__value.visible === false) {
                tickets__value.visible = true;
                document.querySelector('.tickets .tickets__entry[data-id="' + tickets__value.id + '"]').classList.add('tickets__entry--visible');
            }
        });
        Sort.doSort();
        Tickets.updateSum();
        Textarea.textareaSetVisibleHeights();
    }
}

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
                .forEach((el) => {
                    selected[el.getAttribute('name')] = el.value;
                });
            document.querySelector('.metabar__filter').remove();
        }

        document.querySelector('.metabar').insertAdjacentHTML('beforeend', '<div class="metabar__filter"></div>');
        ['status', 'priority', 'date', 'project'].forEach((columns__value) => {
            document.querySelector('.metabar__filter').insertAdjacentHTML(
                'beforeend',
                `
                <select class="metabar__select metabar__select--filter" name="${columns__value}">
                    <option value="*">${columns__value}</option>
                </select>
            `
            );
            if (columns__value === 'date') {
                document
                    .querySelector('.metabar__select--filter[name="date"]')
                    .insertAdjacentHTML('beforeend', '<option value=""></option>');
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

                let skip_old_dates = [],
                    skip_year_end = parseInt(new Date().getFullYear().toString().slice(-2)) - 1;
                for (let skip_year = 17; skip_year <= skip_year_end; skip_year++) {
                    skip_old_dates.push('.' + skip_year);
                }

                Store.data.tickets.forEach((tickets__value) => {
                    // skip old projects
                    if (columns__value === 'project') {
                        if (skip_old_dates.includes(tickets__value.date.substring(5, 8))) {
                            return;
                        }
                    }
                    let options_value = tickets__value[columns__value];
                    if (!options.includes(options_value)) {
                        options.push(options_value);
                    }
                });
                // combined filter
                if (columns__value === 'status') {
                    if (
                        options.filter((options__value) => !['done', 'recurring'].includes(options__value)).length > 0
                    ) {
                        options.push('!done&!recurring');
                    }
                    if (
                        options.filter((options__value) => ['done', 'scheduled', 'working'].includes(options__value))
                            .length > 0
                    ) {
                        options.push('done|scheduled|working');
                    }
                    if (
                        options.filter((options__value) => ['scheduled', 'working'].includes(options__value)).length > 0
                    ) {
                        options.push('scheduled|working');
                    }
                    if (options.filter((options__value) => ['idle', 'working'].includes(options__value)).length > 0) {
                        options.push('idle|working');
                    }
                    if (options.filter((options__value) => ['fixed', 'working'].includes(options__value)).length > 0) {
                        options.push('fixed|working');
                    }
                }
                options.sort((a, b) => {
                    // normalize
                    if (a === null) {
                        a = '';
                    }
                    if (b === null) {
                        b = '';
                    }
                    a = a.toLowerCase();
                    b = b.toLowerCase();

                    // remove emojis
                    a = a.replaceAll(hlp.emojiRegex(), '');
                    b = b.replaceAll(hlp.emojiRegex(), '');

                    if (a.indexOf('|') > -1 || a.indexOf('&') > -1 || a.indexOf('!') > -1) {
                        a = 'zz' + a;
                    }
                    if (b.indexOf('|') > -1 || b.indexOf('&') > -1 || b.indexOf('!') > -1) {
                        b = 'zz' + b;
                    }
                    a = a.split('|').join('');
                    b = b.split('|').join('');

                    return a.localeCompare(b);
                });
                options.forEach((options__value) => {
                    let options__value_normalized = options__value.replace(hlp.emojiRegex(false), '');

                    document
                        .querySelector('.metabar__select--filter[name="' + columns__value + '"]')
                        .insertAdjacentHTML(
                            'beforeend',
                            '<option value="' + options__value + '">' + options__value_normalized + '</option>'
                        );
                });
            }
        });

        if (update === true) {
            Object.entries(selected).forEach(([selected__key, selected__value]) => {
                document.querySelector('.metabar__filter [name="' + selected__key + '"]').value = selected__value;
            });
        } else {
            Filter.doFilter();
            document.querySelector('.metabar').addEventListener('change', (e) => {
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
        Store.data.tickets.forEach((tickets__value) => {
            let visible = true;
            document
                .querySelector('.metabar__filter')
                .querySelectorAll('select')
                .forEach((el) => {
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
                    } else if (val_search.indexOf('|') > -1) {
                        if (val_search.split('|').includes(val_target)) {
                            visible_this = true;
                        }
                    } else if (val_search.indexOf('&') > -1) {
                        visible_this = true;
                        val_search.split('&').forEach((val_search__val) => {
                            if (val_search__val.indexOf('!') === 0) {
                                if (val_search__val.split('!').join('') === val_target) {
                                    visible_this = false;
                                }
                            } else {
                                if (val_search__val !== val_target) {
                                    visible_this = false;
                                }
                            }
                        });
                    }

                    /* special behaviour: hide billed in overview */
                    if (
                        el.getAttribute('name') == 'status' &&
                        val_search === '*' &&
                        val_target === 'billed' &&
                        document.querySelector('.metabar__select--filter[name="date"]').value === '*'
                    ) {
                        visible_this = false;
                    }

                    if (visible_this === false) {
                        visible = false;
                    }
                });
            if (visible === false && tickets__value.visible === true) {
                tickets__value.visible = false;
                document
                    .querySelector('.tickets .tickets__entry[data-id="' + tickets__value.id + '"]')
                    .classList.remove('tickets__entry--visible');
            } else if (visible === true && tickets__value.visible === false) {
                tickets__value.visible = true;
                document
                    .querySelector('.tickets .tickets__entry[data-id="' + tickets__value.id + '"]')
                    .classList.add('tickets__entry--visible');
            }
        });
        Sort.doSort();
        Scheduler.updateColors();
        Tickets.updateSum();
        Textarea.textareaSetVisibleHeights();
    }
}

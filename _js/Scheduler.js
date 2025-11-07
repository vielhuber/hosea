import Store from './Store';
import Dates from './Dates';
import Filter from './Filter';
import hlp from 'hlp';
import Quickbox from './Quickbox';
import Weather from './Weather';
import tippy from 'tippy.js';
import Html from './Html';

export default class Scheduler {
    static initScheduler() {
        document.querySelector('.scheduler').innerHTML = `
            <div class="scheduler__navigation">
                <span class="scheduler__navigation-week"></span>
                <a href="#" class="scheduler__navigation-button scheduler__navigation-button--next-month" title="_next_month">&gt;&gt;&gt;</a>
                <a href="#" class="scheduler__navigation-button scheduler__navigation-button--next-week" title="_next_week [⤴page down]">&gt;&gt;</a>
                <a href="#" class="scheduler__navigation-button scheduler__navigation-button--next-day" title="_next_day [⤴right arrow]">&gt;</a>
                <a href="#" class="scheduler__navigation-button scheduler__navigation-button--today" title="_today">_</a>
                <a href="#" class="scheduler__navigation-button scheduler__navigation-button--prev-day" title="_prev_day [⤴left arrow]">&lt;</a>
                <a href="#" class="scheduler__navigation-button scheduler__navigation-button--prev-week" title="_prev_week [⤴page up]">&lt;&lt;</a>
                <a href="#" class="scheduler__navigation-button scheduler__navigation-button--prev-month" title="_prev_month">&lt;&lt;&lt;</a>
            </div>

            <table class="scheduler__table">
                <thead class="scheduler__table-head">
                    <tr class="scheduler__row">
                        <td class="scheduler__cell"></td>
                        ${Array(
                            Store.data.shiftingView
                                ? Store.data.shiftingViewPrevDays + Store.data.weeksInViewport * 7
                                : Store.data.weeksInViewport * 7
                        )
                            .join(0)
                            .split(0)
                            .map(
                                (item, i) => `
                            <td data-date="${Dates.dateFormat(Dates.getDayOfActiveViewport(i + 1), 'Y-m-d')}" class="
                                scheduler__cell scheduler__navigation-daylink
                                ${
                                    Dates.sameDay(Dates.getDayOfActiveViewport(i + 1), Dates.getCurrentDate())
                                        ? ' scheduler__cell--curday'
                                        : ''
                                }
                                ${
                                    Dates.sameDay(Dates.getDayOfActiveViewport(i + 1), Dates.getActiveDate())
                                        ? ' scheduler__cell--activeday'
                                        : ''
                                }
                                ${
                                    // SA-SO
                                    [0, 6].includes(Dates.getDayOfActiveViewport(i + 1).getDay())
                                        ? ' scheduler__cell--weekend'
                                        : ''
                                }
                            ">
                                ${Dates.dateFormat(Dates.getDayOfActiveViewport(i + 1), 'D d.m.')}
                            </td>
                        `
                            )
                            .join('')}
                    </tr>
                    <tr class="scheduler__row">
                        <td class="scheduler__cell"></td>
                        ${Array(
                            Store.data.shiftingView
                                ? Store.data.shiftingViewPrevDays + Store.data.weeksInViewport * 7
                                : Store.data.weeksInViewport * 7
                        )
                            .join(0)
                            .split(0)
                            .map(
                                (item, i) => `
                                    <td class="
                                        scheduler__cell
                                        ${
                                            Dates.sameDay(Dates.getDayOfActiveViewport(i + 1), Dates.getCurrentDate())
                                                ? ' scheduler__cell--curday'
                                                : ''
                                        }
                                        ${
                                            Dates.sameDay(Dates.getDayOfActiveViewport(i + 1), Dates.getActiveDate())
                                                ? ' scheduler__cell--activeday'
                                                : ''
                                        }
                                        ${
                                            // SA-SO
                                            [0, 6].includes(Dates.getDayOfActiveViewport(i + 1).getDay())
                                                ? ' scheduler__cell--weekend'
                                                : ''
                                        }
                                        ${
                                            Dates.sameDay(Dates.getDayOfActiveViewport(i + 1), Dates.getCurrentDate())
                                                ? ' scheduler__cell--indicator-container'
                                                : ''
                                        }
                                    ">
                                        ${Weather.outputWeather(Dates.getDayOfActiveViewport(i + 1))}
                                        ${
                                            Dates.sameDay(Dates.getDayOfActiveViewport(i + 1), Dates.getCurrentDate())
                                                ? '<div style="top:' +
                                                  Scheduler.indicatorIntervalValue() +
                                                  'px;" class="scheduler__cell--indicator"></div>'
                                                : ''
                                        }
                                    </td>
                                `
                            )
                            .join('')}
                    </tr>
                </thead>
                <tbody class="scheduler__table-body">
                    <tr class="scheduler__row">
                        <td class="scheduler__cell"></td>
                        ${Array(
                            Store.data.shiftingView
                                ? Store.data.shiftingViewPrevDays + Store.data.weeksInViewport * 7
                                : Store.data.weeksInViewport * 7
                        )
                            .join(0)
                            .split(0)
                            .map(
                                (item, i) => `
                            <td class="
                                scheduler__cell
                                ${
                                    Dates.sameDay(Dates.getDayOfActiveViewport(i + 1), Dates.getCurrentDate())
                                        ? ' scheduler__cell--curday'
                                        : ''
                                }
                                ${
                                    Dates.sameDay(Dates.getDayOfActiveViewport(i + 1), Dates.getActiveDate())
                                        ? ' scheduler__cell--activeday'
                                        : ''
                                }
                                ${
                                    // SA-SO
                                    [0, 6].includes(Dates.getDayOfActiveViewport(i + 1).getDay())
                                        ? ' scheduler__cell--weekend'
                                        : ''
                                }
                            "></td>
                        `
                            )
                            .join('')}
                    </tr>
                    ${Array(24 - Store.data.hourBegin)
                        .join(0)
                        .split(0)
                        .map((item, j) => {
                            j = j + Store.data.hourBegin;
                            return `
                            <tr class="scheduler__row">
                                <td class="scheduler__cell">${('0' + j).slice(-2)}&ndash;${('0' + (j + 1)).slice(
                                -2
                            )}</td>
                                ${Array(
                                    Store.data.shiftingView
                                        ? Store.data.shiftingViewPrevDays + Store.data.weeksInViewport * 7
                                        : Store.data.weeksInViewport * 7
                                )
                                    .join(0)
                                    .split(0)
                                    .map(
                                        (item, i) => `
                                    <td class="
                                        scheduler__cell
                                        ${
                                            Dates.sameDay(Dates.getDayOfActiveViewport(i + 1), Dates.getCurrentDate())
                                                ? ' scheduler__cell--curday'
                                                : ''
                                        }
                                        ${
                                            Dates.sameDay(Dates.getDayOfActiveViewport(i + 1), Dates.getActiveDate())
                                                ? ' scheduler__cell--activeday'
                                                : ''
                                        }
                                        ${
                                            // SA-SO
                                            [0, 6].includes(Dates.getDayOfActiveViewport(i + 1).getDay())
                                                ? ' scheduler__cell--weekend'
                                                : ''
                                        }
                                        ${
                                            // MO-FR
                                            [1, 2, 3, 4, 5].includes(Dates.getDayOfActiveViewport(i + 1).getDay()) &&
                                            // 09:00-13:00, 14:00-18:00
                                            ((j >= 9 && j < 13) || (j >= 14 && j < 18))
                                                ? ' scheduler__cell--main'
                                                : ''
                                        }
                                    ">
                                    </td>
                                `
                                    )
                                    .join('')}
                            </tr>
                        `;
                        })
                        .join('')}
                </tbody>
            </table>

            <div class="scheduler__appointments">
            </div>
        `;

        document.querySelectorAll('.scheduler__cell').forEach(($el) => {
            $el.style.width =
                100 /
                    ((Store.data.shiftingView
                        ? Store.data.shiftingViewPrevDays + Store.data.weeksInViewport * 7
                        : Store.data.weeksInViewport * 7) +
                        1) +
                '%';
        });

        let generatedDates = Scheduler.generateDates();

        generatedDates.forEach((date__value) => {
            let date__value_name = date__value.name;
            if (hlp.emojiRegex().test(date__value_name)) {
                let date__value_name_emoji = hlp.emojiSplit(date__value_name);
                date__value_name =
                    date__value_name_emoji[0] +
                    '\n' +
                    date__value_name_emoji.slice(1, -1).join('') +
                    '\n' +
                    date__value_name_emoji.at(-1);
            }
            document.querySelector('.scheduler__appointments').insertAdjacentHTML(
                'beforeend',
                `
                    <div class="scheduler__appointment" title="${date__value.title}" style="
                        left:${date__value.posLeft}%;
                        top:${date__value.posTop}%;
                        bottom:${date__value.posBottom}%;
                        padding:${date__value.padding};
                        background:${date__value.background};
                        animation:${date__value.animation};
                        ${date__value.animation !== 'none' ? 'z-index:1;' : ''}
                        opacity:${date__value.opacity};
                        width:${date__value.width};
                    ">
                        <div class="scheduler__appointment-inner">${date__value_name}</div>
                    </div>
                `
            );
        });

        // custom tooltips instead of basic titles
        tippy('.scheduler__appointment', {
            content(reference) {
                let title = reference.getAttribute('title');
                if (title !== null) {
                    title = title.split('\n').join('<br/>').split(' ').join('&nbsp;');
                }
                reference.removeAttribute('title');
                return title;
            },
            allowHTML: true,
            interactive: false,
        });

        let statsSumWeekly = 0;
        generatedDates.forEach((date__value) => {
            if (date__value.status !== 'allday') {
                if (date__value.begin !== null && date__value.end !== null) {
                    statsSumWeekly += date__value.end - date__value.begin;
                }
            }
        });
        statsSumWeekly = (Math.round(statsSumWeekly * 100) / 100).toString().replace('.', ',');

        document.querySelector('.scheduler__navigation-week').innerHTML = `
            ${Dates.dateFormat(Dates.getDayOfActiveViewport(1), 'd.m.')} &ndash; ${Dates.dateFormat(
            Dates.getDayOfActiveViewport(7),
            'd.m.Y'
        )} /// _kw ${
            Dates.weekNumber(Dates.getDayOfActiveViewport(1)) +
            (Store.data.weeksInViewport > 1
                ? '–' + Dates.weekNumber(Dates.getDayOfActiveViewport(Store.data.weeksInViewport * 7))
                : '')
        } /// ${statsSumWeekly}h /// <a href="#" class="scheduler__navigation-week-link-to-empty">
            ${Scheduler.generateLinkToEmptyDatesSum()}
        </a>
        `;
    }

    static bindScheduler() {
        document.querySelector('.scheduler').addEventListener('click', (e) => {
            if (
                e.target.closest('.scheduler__navigation-button') ||
                e.target.closest('.scheduler__navigation-daylink') ||
                e.target.closest('.scheduler__navigation-week-link-to-empty')
            ) {
                if (
                    e.target.closest('.scheduler__navigation-button') ||
                    e.target.closest('.scheduler__navigation-daylink')
                ) {
                    if (e.target.closest('.scheduler__navigation-button')) {
                        if (e.target.closest('.scheduler__navigation-button--today')) {
                            Store.data.session.activeDay = new Date();
                        } else if (e.target.closest('.scheduler__navigation-button--prev-day')) {
                            Store.data.session.activeDay.setDate(Store.data.session.activeDay.getDate() - 1);
                        } else if (e.target.closest('.scheduler__navigation-button--next-day')) {
                            Store.data.session.activeDay.setDate(Store.data.session.activeDay.getDate() + 1);
                        } else if (e.target.closest('.scheduler__navigation-button--prev-week')) {
                            Store.data.session.activeDay.setDate(
                                Store.data.session.activeDay.getDate() - Store.data.weeksInViewport * 7
                            );
                        } else if (e.target.closest('.scheduler__navigation-button--next-week')) {
                            Store.data.session.activeDay.setDate(
                                Store.data.session.activeDay.getDate() + Store.data.weeksInViewport * 7
                            );
                        } else if (e.target.closest('.scheduler__navigation-button--prev-month')) {
                            Store.data.session.activeDay.setDate(
                                Store.data.session.activeDay.getDate() - Store.data.weeksInViewport * 7 * 4
                            );
                        } else if (e.target.closest('.scheduler__navigation-button--next-month')) {
                            Store.data.session.activeDay.setDate(
                                Store.data.session.activeDay.getDate() + Store.data.weeksInViewport * 7 * 4
                            );
                        }
                    } else if (e.target.closest('.scheduler__navigation-daylink')) {
                        Store.data.session.activeDay = new Date(
                            e.target.closest('.scheduler__navigation-daylink').getAttribute('data-date')
                        );
                    }
                    document.querySelector('.metabar__select--filter[name="date"]').value = Dates.dateFormat(
                        Store.data.session.activeDay,
                        'Y-m-d'
                    );
                    document.querySelector('.metabar__select--sort[name="sort_1"]').value = '';
                    document.querySelector('.metabar__select--sort[name="sort_2"]').value = '';
                }
                if (e.target.closest('.scheduler__navigation-week-link-to-empty')) {
                    document.querySelector('.metabar__select--filter[name="date"]').value = '';
                    document.querySelector('.metabar__select--sort[name="sort_1"]').value = 'priority';
                    document.querySelector('.metabar__select--sort[name="sort_2"]').value = '';
                }

                Filter.doFilter();
                Scheduler.initScheduler();
                Quickbox.initToday();

                e.preventDefault();
            }
        });
    }

    static generateDates() {
        let generatedDates = [];
        Store.data.tickets.forEach((tickets__value) => {
            let name = tickets__value.project,
                title = hlp.htmlEncode(tickets__value.project + '\n' + (tickets__value.description || '')),
                project = tickets__value.project,
                status = tickets__value.status,
                parsed_values = Dates.parseDateString(tickets__value.date, 'scheduler');
            let background =
                Scheduler.getStoreProperty('background', tickets__value.status, tickets__value.project, null) ||
                Scheduler.getStoreProperty('border', tickets__value.status, tickets__value.project, '#9E9E9E');
            let animation = Scheduler.getStoreProperty(
                'animation',
                tickets__value.status,
                tickets__value.project,
                'none'
            );
            if (['done', 'billed'].includes(status)) {
                animation = 'none';
            }
            let opacity = Scheduler.getStoreProperty('opacity', tickets__value.status, tickets__value.project, 1);
            if (tickets__value.hide_in_scheduler === true) {
                opacity = 0.1;
            }
            if (parsed_values !== false && parsed_values.length > 0) {
                parsed_values.forEach((parsed_values__value) => {
                    generatedDates.push({
                        day: parsed_values__value.day,
                        begin: parsed_values__value.begin,
                        end: parsed_values__value.end,
                        status: status,
                        name: name,
                        title: title,
                        project: project,
                        time: parsed_values__value.time,
                        background: background,
                        animation: animation,
                        opacity: opacity,
                    });
                });
            }
        });

        /* visual compression of all day events */
        let generatedDatesUndefinedMax = [],
            generatedDatesUndefinedCur = [];
        generatedDates.forEach((generatedDates__value) => {
            if (generatedDates__value.begin === null) {
                if (!(generatedDates__value.day in generatedDatesUndefinedMax)) {
                    generatedDatesUndefinedMax[generatedDates__value.day] = 0;
                }
                if (!(generatedDates__value.day in generatedDatesUndefinedCur)) {
                    generatedDatesUndefinedCur[generatedDates__value.day] = 0;
                }
                generatedDatesUndefinedMax[generatedDates__value.day]++;
            }
        });

        /* visual compression of conflicting events */
        let conflicts = {};
        generatedDates.forEach((gv1, gk1) => {
            if (gv1.begin === null || gv1.end === null) {
                return;
            }
            generatedDates.forEach((gv2, gk2) => {
                if (gk1 === gk2) {
                    return;
                }
                if (gv2.day !== gv1.day) {
                    return;
                }
                if (gv2.begin === null || gv2.end === null) {
                    return;
                }
                if (gv2.begin < gv1.begin) {
                    return;
                }
                if ('conflict' in gv2 && 'conflict' in gv1 && gv2.conflict === gv1.conflict) {
                    return;
                }
                if (
                    gv1.status === 'recurring' ||
                    gv2.status === 'recurring' ||
                    gv1.status === 'allday' ||
                    gv2.status === 'allday'
                ) {
                    return;
                }
                if (gv2.begin < gv1.end) {
                    if ('conflict' in gv1) {
                        let conflictId = gv1.conflict;
                        gv2.conflict = conflictId;
                        if (!(conflictId in conflicts)) {
                            conflicts[conflictId] = { count: 0, painted: 0 };
                        }
                        conflicts[conflictId].count += 1;
                    } else if ('conflict' in gv2) {
                        let conflictId = gv2.conflict;
                        gv1.conflict = conflictId;
                        if (!(conflictId in conflicts)) {
                            conflicts[conflictId] = { count: 0, painted: 0 };
                        }
                        conflicts[conflictId].count += 1;
                    } else {
                        let conflictId = hlp.pushId();
                        gv1.conflict = conflictId;
                        gv2.conflict = conflictId;
                        if (!(conflictId in conflicts)) {
                            conflicts[conflictId] = { count: 0, painted: 0 };
                        }
                        conflicts[conflictId].count += 2;
                    }
                }
            });
        });

        /* order/z-index */
        generatedDates.sort((gv1, gv2) => {
            if (['recurring', 'allday'].includes(gv1.status) && !['recurring', 'allday'].includes(gv2.status)) {
                return -1;
            }
            if (!['recurring', 'allday'].includes(gv1.status) && ['recurring', 'allday'].includes(gv2.status)) {
                return 1;
            }
            if (['recurring', 'allday'].includes(gv1.status) && ['recurring', 'allday'].includes(gv2.status)) {
                return gv1.begin - gv2.begin;
            }
            return 0;
        });

        /* finalize */
        generatedDates.forEach((date__value) => {
            let posTop,
                posBottom,
                heightFrac = 100 / (24 + 1 - Store.data.hourBegin);
            if (date__value.begin === null) {
                posTop =
                    (generatedDatesUndefinedCur[date__value.day] / generatedDatesUndefinedMax[date__value.day]) *
                    heightFrac;
                posBottom =
                    100 -
                    ((generatedDatesUndefinedCur[date__value.day] + 1) / generatedDatesUndefinedMax[date__value.day]) *
                        heightFrac;
                generatedDatesUndefinedCur[date__value.day]++;
            } else {
                posTop = heightFrac * (date__value.begin - (Store.data.hourBegin - 1));
                posBottom = 100 - heightFrac * (date__value.end - (Store.data.hourBegin - 1));
            }

            let width,
                posLeft,
                fraction =
                    100 /
                    ((Store.data.shiftingView
                        ? Store.data.shiftingViewPrevDays + Store.data.weeksInViewport * 7
                        : Store.data.weeksInViewport * 7) +
                        1);
            if (!('conflict' in date__value)) {
                width = fraction;
                posLeft = fraction * date__value.day;
            } else {
                width = fraction / conflicts[date__value.conflict].count;
                posLeft =
                    fraction * date__value.day +
                    (fraction / conflicts[date__value.conflict].count) * conflicts[date__value.conflict].painted;
                conflicts[date__value.conflict].painted++;
            }

            date__value.posLeft = Math.round(posLeft * 100) / 100;
            date__value.posTop = Math.round(posTop * 100) / 100;
            date__value.posBottom = Math.round(posBottom * 100) / 100;
            date__value.padding = width > 1 ? '0 3rem' : '0';
            date__value.width = 'calc(' + Math.round(width * 100) / 100 + '% - 4rem)';
        });

        return generatedDates;
    }

    static determineNextFreeSlot(str) {
        let d = Dates.parseDateString(str, 'scheduler')[0],
            dates = [];
        Store.data.tickets.forEach((tickets__value) => {
            let parsed_values = Dates.parseDateString(tickets__value.date, 'scheduler');
            if (parsed_values !== false && parsed_values.length > 0) {
                parsed_values.forEach((parsed_values__value) => {
                    dates.push({
                        date: parsed_values__value.date,
                        begin: parsed_values__value.begin,
                        end: parsed_values__value.end,
                    });
                });
            }
        });
        let conflict = true;
        while (conflict === true) {
            conflict = false;
            dates.forEach((dates__value) => {
                if (dates__value.begin === null || dates__value.end === null || d.begin === null || d.end === null) {
                    return;
                }
                if (Dates.compareDates(d.date, dates__value.date) !== 0) {
                    return;
                }
                if (d.end <= dates__value.begin || dates__value.end <= d.begin) {
                    return;
                }
                d.begin += 0.5;
                d.end += 0.5;
                if (d.begin >= 21) {
                    d.date.setDate(d.date.getDate() + 1);
                    d.date.setHours(9);
                    d.begin = 9;
                    d.end = 9.5;
                }
                conflict = true;
            });
        }
        return Dates.dateFormat(d.date, 'd.m.y') + ' ' + Dates.timeFormat(d.begin) + '-' + Dates.timeFormat(d.end);
    }

    static determineNextFreeSlotAdvanced(priority, time) {
        time = parseFloat(time.split(',').join('.'));

        let t_begin = new Date().getHours(),
            t_end = t_begin + time;

        let str = '';
        str += Dates.dateFormat(new Date(), 'd.m.y');
        str += ' ';
        str += Dates.timeFormat(t_begin);
        str += '-';
        str += Dates.timeFormat(t_end);

        let d = Dates.parseDateString(str, 'all')[0];

        // move to next free slot and check if slot fulfils certain criteria (priority, weekend, holidays)
        let conflict = true;
        while (1 === 1) {
            if (conflict === true) {
                d.begin += 0.5;
                d.end += 0.5;
                if (d.end > 18) {
                    let d_shift = 1;
                    if (d.date.getDay() === 5) {
                        d_shift = 3;
                    } else if (d.date.getDay() === 6) {
                        d_shift = 2;
                    }
                    d.date.setDate(d.date.getDate() + d_shift);
                    d.date.setHours(9);
                    d.begin = 9;
                    d.end = d.begin + time;
                } else if (d.begin < 9) {
                    d.date.setHours(9);
                    d.begin = 9;
                    d.end = d.begin + time;
                }
            }
            conflict = false;

            // we have to calculate the dates in the context of this day
            let dates = [];
            Store.data.session.activeDay = d.date;
            Store.data.tickets.forEach((tickets__value) => {
                let parsed_values = Dates.parseDateString(tickets__value.date, 'tickets');
                if (parsed_values !== false && parsed_values.length > 0) {
                    parsed_values.forEach((parsed_values__value) => {
                        dates.push({
                            project: tickets__value.project,
                            description: tickets__value.description,
                            date: parsed_values__value.date,
                            begin: parsed_values__value.begin,
                            end: parsed_values__value.end,
                        });
                    });
                }
            });
            dates.forEach((dates__value) => {
                if (conflict === true) {
                    return;
                }
                if (dates__value.begin === null || dates__value.end === null || d.begin === null || d.end === null) {
                    return;
                }
                if (Dates.compareDates(d.date, dates__value.date) !== 0) {
                    return;
                }
                if (d.end <= dates__value.begin || d.begin >= dates__value.end) {
                    return;
                }

                conflict = true;
            });
            if (conflict === false) {
                let differenceInWeeks = Dates.dateDiffInWeeks(d.date, new Date());
                if (priority !== undefined && priority !== null && priority !== '') {
                    if (
                        (priority === 'A' && differenceInWeeks <= -1) ||
                        (priority === 'B' && differenceInWeeks <= 0) ||
                        (priority === 'C' && differenceInWeeks <= 1) ||
                        (priority === 'D' && differenceInWeeks <= 2)
                    ) {
                        conflict = true;
                    }
                }
            }
            if (conflict === false) {
                break;
            }
        }

        return Dates.dateFormat(d.date, 'd.m.y') + ' ' + Dates.timeFormat(d.begin) + '-' + Dates.timeFormat(d.end);
    }

    static getStoreProperty(property, status, project = null, defValue = null) {
        // allow wildcards
        if (
            project !== undefined &&
            project !== null &&
            project !== '' &&
            !Store.data.colors.project.hasOwnProperty(project)
        ) {
            let project_wildcard = hlp.emojiSplit(project);
            project_wildcard = project_wildcard[0] + '*' + project_wildcard.at(-1);
            if (Store.data.colors.project.hasOwnProperty(project_wildcard)) {
                project = project_wildcard;
            }
        }
        if (
            project !== undefined &&
            project !== null &&
            project !== '' &&
            Store.data.colors.project.hasOwnProperty(project) &&
            typeof Store.data.colors.project[project] === 'object' &&
            property in Store.data.colors.project[project]
        ) {
            return Store.data.colors.project[project][property];
        }
        if (
            status !== undefined &&
            status !== null &&
            status !== '' &&
            Store.data.colors.status.hasOwnProperty(status) &&
            typeof Store.data.colors.status[status] === 'object' &&
            property in Store.data.colors.status[status]
        ) {
            return Store.data.colors.status[status][property];
        }
        return defValue;
    }

    static updateColors() {
        Store.data.tickets.forEach((tickets__value) => {
            if (tickets__value.visible === true) {
                let borderColor = Scheduler.getStoreProperty(
                        'border',
                        tickets__value.status,
                        tickets__value.project,
                        '#9E9E9E'
                    ),
                    backgroundColor = Scheduler.getStoreProperty(
                        'background',
                        tickets__value.status,
                        tickets__value.project,
                        null
                    ),
                    opacity = Scheduler.getStoreProperty('opacity', tickets__value.status, tickets__value.project, 1),
                    el = document.querySelector('.tickets .tickets__entry[data-id="' + tickets__value.id + '"]');
                if (borderColor) {
                    el.style.borderLeftColor = borderColor;
                } else {
                    el.style.borderLeftColor = 'transparent';
                }
                if (backgroundColor) {
                    el.style.background = backgroundColor;
                } else {
                    el.style.background = 'none';
                }
                if (opacity) {
                    el.style.opacity = opacity;
                } else {
                    el.style.opacity = 1;
                }
            }
        });
    }

    static changeView() {
        if (
            Store.data.shiftingView === false &&
            Store.data.shiftingViewPrevDays === 0 &&
            Store.data.weeksInViewport === 4
        ) {
            Store.data.shiftingView = false;
            Store.data.shiftingViewPrevDays = 0;
            Store.data.weeksInViewport = 3;
        } else if (
            Store.data.shiftingView === false &&
            Store.data.shiftingViewPrevDays === 0 &&
            Store.data.weeksInViewport === 3
        ) {
            Store.data.shiftingView = true;
            Store.data.shiftingViewPrevDays = 1;
            Store.data.weeksInViewport = 2;
        } else if (
            Store.data.shiftingView === true &&
            Store.data.shiftingViewPrevDays === 1 &&
            Store.data.weeksInViewport === 2
        ) {
            Store.data.shiftingView = false;
            Store.data.shiftingViewPrevDays = 0;
            Store.data.weeksInViewport = 1;
        } else if (
            Store.data.shiftingView === false &&
            Store.data.shiftingViewPrevDays === 0 &&
            Store.data.weeksInViewport === 1
        ) {
            Store.data.shiftingView = false;
            Store.data.shiftingViewPrevDays = 0;
            Store.data.weeksInViewport = 4;
        }
        Html.setViewClass();

        Filter.doFilter();
        Scheduler.initScheduler();
        Quickbox.initToday();
    }

    static indicatorInterval() {
        setInterval(() => {
            Scheduler.indicatorIntervalFn();
        }, 1000 * 60);
        Scheduler.indicatorIntervalFn();
    }

    static indicatorIntervalValue() {
        let $el_indicator = document.querySelector('.scheduler__cell--indicator'),
            $el_container = document.querySelector('.scheduler__cell--indicator-container'),
            $el_appointments = document.querySelector('.scheduler__appointments'),
            $el_row = document.querySelector('.scheduler__table-body .scheduler__row:first-child');

        if ($el_indicator !== null && $el_container !== null && $el_appointments !== null && $el_row !== null) {
            let now = new Date(),
                hour_start = Store.data.hourBegin,
                hour_end = 24,
                sec_total = (hour_end - hour_start) * 60 * 60,
                sec_cur = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds(),
                sec_start = sec_cur - hour_start * 60 * 60,
                percentage = 0;
            if (sec_start <= 0) {
                percentage = 0;
            } else if (sec_start >= sec_total) {
                percentage = 1;
            } else {
                percentage = sec_start / sec_total;
            }
            let h_container = $el_container.offsetHeight,
                h_appointments = $el_appointments.offsetHeight,
                h_row = $el_row.offsetHeight;

            return h_container + h_row + percentage * (h_appointments - h_row);
        }

        return 0;
    }

    static indicatorIntervalFn() {
        let $el_indicator = document.querySelector('.scheduler__cell--indicator');
        if ($el_indicator !== null) {
            $el_indicator.style.top = Scheduler.indicatorIntervalValue() + 'px';
            tippy($el_indicator, {
                content:
                    '⏳' +
                    ('0' + new Date().getHours()).slice(-2) +
                    ':' +
                    ('0' + new Date().getMinutes()).slice(-2) +
                    '⏳',
                interactive: false,
            });
        }
    }

    static generateLinkToEmptyDatesSum() {
        let linkToEmptyDatesSum = 0;
        Store.data.tickets.forEach((tickets__value) => {
            if (tickets__value.date === '') {
                linkToEmptyDatesSum += 1;
            }
        });
        return (
            (linkToEmptyDatesSum === 0 ? '✅' : '❗') +
            linkToEmptyDatesSum +
            'x' +
            (linkToEmptyDatesSum === 0 ? '✅' : '❗')
        );
    }
}

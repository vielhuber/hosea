import Store from './Store';
import Dates from './Dates';
import Filter from './Filter';
import hlp from 'hlp';
import Quickbox from './Quickbox';
import Weather from './Weather';
import tippy from 'tippy.js';

export default class Scheduler {
    static hourBegin = 6;

    static initScheduler() {
        document.querySelector('.scheduler').innerHTML = `
            <div class="scheduler__navigation">
                <span class="scheduler__navigation-week"></span>
                <a href="#" class="scheduler__navigation-button scheduler__navigation-button--next-month" title="_next_month">&gt;&gt;&gt;</a>
                <a href="#" class="scheduler__navigation-button scheduler__navigation-button--next-week" title="_next_week">&gt;&gt;</a>
                <a href="#" class="scheduler__navigation-button scheduler__navigation-button--next-day" title="_next_day">&gt;</a>
                <a href="#" class="scheduler__navigation-button scheduler__navigation-button--today" title="_next_today">_</a>
                <a href="#" class="scheduler__navigation-button scheduler__navigation-button--prev-day" title="_prev_day">&lt;</a>
                <a href="#" class="scheduler__navigation-button scheduler__navigation-button--prev-week" title="_prev_week">&lt;&lt;</a>
                <a href="#" class="scheduler__navigation-button scheduler__navigation-button--prev-month" title="_prev_month">&lt;&lt;&lt;</a>
            </div>

            <table class="scheduler__table">
                <thead class="scheduler__table-head">
                    <tr class="scheduler__row">
                        <td class="scheduler__cell"></td>   
                        ${Array(7)
                            .join(0)
                            .split(0)
                            .map(
                                (item, i) => `
                            <td class="
                                scheduler__cell
                                ${
                                    Dates.sameDay(Dates.getDayOfActiveWeek(i + 1), Dates.getCurrentDate())
                                        ? ' scheduler__cell--curday'
                                        : ''
                                }
                                ${
                                    Dates.sameDay(Dates.getDayOfActiveWeek(i + 1), Dates.getActiveDate())
                                        ? ' scheduler__cell--activeday'
                                        : ''
                                }
                            ">
                                ${Dates.dateFormat(Dates.getDayOfActiveWeek(i + 1), 'D d.m.')}
                            </td>
                        `
                            )
                            .join('')}
                    </tr>
                    <tr class="scheduler__row">
                        <td class="scheduler__cell"></td>
                        ${Array(7)
                            .join(0)
                            .split(0)
                            .map(
                                (item, i) => `
                                    <td class="
                                        scheduler__cell
                                        ${
                                            Dates.sameDay(Dates.getDayOfActiveWeek(i + 1), Dates.getCurrentDate())
                                                ? ' scheduler__cell--curday'
                                                : ''
                                        }
                                        ${
                                            Dates.sameDay(Dates.getDayOfActiveWeek(i + 1), Dates.getActiveDate())
                                                ? ' scheduler__cell--activeday'
                                                : ''
                                        }
                                    ">
                                        ${Weather.outputWeather(Dates.getDayOfActiveWeek(i + 1))}
                                    </td>
                                `
                            )
                            .join('')}
                    </tr>
                </thead>
                <tbody class="scheduler__table-body">
                    <tr class="scheduler__row">
                        <td class="scheduler__cell"></td>   
                        ${Array(7)
                            .join(0)
                            .split(0)
                            .map(
                                (item, i) => `
                            <td class="
                                scheduler__cell
                                ${
                                    Dates.sameDay(Dates.getDayOfActiveWeek(i + 1), Dates.getCurrentDate())
                                        ? ' scheduler__cell--curday'
                                        : ''
                                }
                                ${
                                    Dates.sameDay(Dates.getDayOfActiveWeek(i + 1), Dates.getActiveDate())
                                        ? ' scheduler__cell--activeday'
                                        : ''
                                }
                            "></td>
                        `
                            )
                            .join('')}
                    </tr>
                    ${Array(24 - Scheduler.hourBegin)
                        .join(0)
                        .split(0)
                        .map((item, j) => {
                            j = j + Scheduler.hourBegin;
                            return `
                            <tr class="scheduler__row">
                                <td class="scheduler__cell">${('0' + j).slice(-2)}&ndash;${('0' + (j + 1)).slice(
                                -2
                            )}</td>
                                ${Array(7)
                                    .join(0)
                                    .split(0)
                                    .map(
                                        (item, i) => `
                                    <td class="
                                        scheduler__cell
                                        ${
                                            Dates.sameDay(Dates.getDayOfActiveWeek(i + 1), Dates.getCurrentDate())
                                                ? ' scheduler__cell--curday'
                                                : ''
                                        }
                                        ${
                                            Dates.sameDay(Dates.getDayOfActiveWeek(i + 1), Dates.getActiveDate())
                                                ? ' scheduler__cell--activeday'
                                                : ''
                                        }
                                        ${
                                            i < 5 && ((j >= 9 && j < 13) || (j >= 14 && j < 18))
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

        let generatedDates = Scheduler.generateDates();

        let weeklySum = 0;

        generatedDates.forEach((date__value) => {
            document.querySelector('.scheduler__appointments').insertAdjacentHTML(
                'beforeend',
                `
                    <div class="scheduler__appointment" title="${date__value.title}" style="
                        left:${date__value.posLeft}%;
                        top:${date__value.posTop}%;
                        bottom:${date__value.posBottom}%;
                        background:${date__value.background};
                        animation:${date__value.animation};
                        opacity:${date__value.opacity};
                        width:${date__value.width};
                    ">
                        ${date__value.name}
                    </div>
                `
            );
            if (date__value.time != '') {
                weeklySum += date__value.time;
            }
        });

        // custom tooltips instead of basic titles
        tippy('.scheduler__appointment', {
            content(reference) {
                let title = reference.getAttribute('title');
                title = title.split('\n').join('<br/>');
                reference.removeAttribute('title');
                return title;
            },
            allowHTML: true,
            interactive: false,
        });

        weeklySum = (Math.round(weeklySum * 100) / 100).toString().replace('.', ',');

        document.querySelector('.scheduler__navigation-week').innerHTML = `
            ${Dates.dateFormat(Dates.getDayOfActiveWeek(1), 'd.m.')} &ndash; ${Dates.dateFormat(
            Dates.getDayOfActiveWeek(7),
            'd.m.Y'
        )} /// _kw ${Dates.weekNumber(Dates.getDayOfActiveWeek(1))} /// ${weeklySum} hours
        `;
    }

    static bindScheduler() {
        document.querySelector('.scheduler').addEventListener('click', (e) => {
            if (e.target.closest('.scheduler__navigation-button')) {
                if (e.target.closest('.scheduler__navigation-button--today')) {
                    Store.data.session.activeDay = new Date();
                }
                if (e.target.closest('.scheduler__navigation-button--prev-day')) {
                    Store.data.session.activeDay.setDate(Store.data.session.activeDay.getDate() - 1);
                }
                if (e.target.closest('.scheduler__navigation-button--next-day')) {
                    Store.data.session.activeDay.setDate(Store.data.session.activeDay.getDate() + 1);
                }
                if (e.target.closest('.scheduler__navigation-button--prev-week')) {
                    Store.data.session.activeDay.setDate(Store.data.session.activeDay.getDate() - 7);
                }
                if (e.target.closest('.scheduler__navigation-button--next-week')) {
                    Store.data.session.activeDay.setDate(Store.data.session.activeDay.getDate() + 7);
                }
                if (e.target.closest('.scheduler__navigation-button--prev-month')) {
                    Store.data.session.activeDay.setDate(Store.data.session.activeDay.getDate() - 28);
                }
                if (e.target.closest('.scheduler__navigation-button--next-month')) {
                    Store.data.session.activeDay.setDate(Store.data.session.activeDay.getDate() + 28);
                }
                document.querySelector('.metabar__select--filter[name="date"]').value = Dates.dateFormat(
                    Store.data.session.activeDay,
                    'Y-m-d'
                );
                Scheduler.initScheduler();
                Quickbox.initToday();
                Filter.doFilter();
                e.preventDefault();
            }
        });
    }

    static generateDates() {
        let generatedDates = [];
        Store.data.tickets.forEach((tickets__value) => {
            let name = tickets__value.project,
                title = hlp.htmlEncode(
                    tickets__value.project +
                        '\n' +
                        (tickets__value.description || '')
                            .split('\n')
                            .map((i) => hlp.truncate_string(i, 100))
                            .join('\n')
                ),
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
                        opacity: Scheduler.getStoreProperty(
                            'opacity',
                            tickets__value.status,
                            tickets__value.project,
                            1
                        ),
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
                heightFrac = 100 / (24 + 1 - Scheduler.hourBegin);
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
                posTop = heightFrac * (date__value.begin - (Scheduler.hourBegin - 1));
                posBottom = 100 - heightFrac * (date__value.end - (Scheduler.hourBegin - 1));
            }

            let width, posLeft;
            if (!('conflict' in date__value)) {
                width = 'calc(12.5% - 4rem)';
                posLeft = 12.5 * date__value.day;
            } else {
                width = 'calc(' + 12.5 / conflicts[date__value.conflict].count + '% - 4rem)';
                posLeft =
                    12.5 * date__value.day +
                    (12.5 / conflicts[date__value.conflict].count) * conflicts[date__value.conflict].painted;
                conflicts[date__value.conflict].painted++;
            }

            date__value.posLeft = posLeft;
            date__value.posTop = posTop;
            date__value.posBottom = posBottom;
            date__value.width = width;
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

    static getStoreProperty(property, status, project = null, defValue = null) {
        if (
            project !== null &&
            project !== '' &&
            Store.data.colors.project.hasOwnProperty(project) &&
            typeof Store.data.colors.project[project] === 'object' &&
            property in Store.data.colors.project[project]
        ) {
            return Store.data.colors.project[project][property];
        }
        if (
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
}

import Store from './Store';
import Dates from './Dates';
import Filter from './Filter';
import hlp from 'hlp';

export default class Scheduler {
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
                                    Dates.sameDay(
                                        Dates.getDayOfActiveWeek(i + 1),
                                        Dates.getCurrentDate()
                                    )
                                        ? ' scheduler__cell--curday'
                                        : ''
                                }
                                ${
                                    Dates.sameDay(
                                        Dates.getDayOfActiveWeek(i + 1),
                                        Dates.getActiveDate()
                                    )
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
                                    Dates.sameDay(
                                        Dates.getDayOfActiveWeek(i + 1),
                                        Dates.getCurrentDate()
                                    )
                                        ? ' scheduler__cell--curday'
                                        : ''
                                }
                                ${
                                    Dates.sameDay(
                                        Dates.getDayOfActiveWeek(i + 1),
                                        Dates.getActiveDate()
                                    )
                                        ? ' scheduler__cell--activeday'
                                        : ''
                                }
                            "></td>
                        `
                            )
                            .join('')}
                    </tr>
                    ${Array(15)
                        .join(0)
                        .split(0)
                        .map((item, j) => {
                            j = j + 9;
                            return `
                            <tr class="scheduler__row">
                                <td class="scheduler__cell">${('0' + j).slice(-2)}&ndash;${(
                                '0' +
                                (j + 1)
                            ).slice(-2)}</td>
                                ${Array(7)
                                    .join(0)
                                    .split(0)
                                    .map(
                                        (item, i) => `
                                    <td class="
                                        scheduler__cell
                                        ${
                                            Dates.sameDay(
                                                Dates.getDayOfActiveWeek(i + 1),
                                                Dates.getCurrentDate()
                                            )
                                                ? ' scheduler__cell--curday'
                                                : ''
                                        }
                                        ${
                                            Dates.sameDay(
                                                Dates.getDayOfActiveWeek(i + 1),
                                                Dates.getActiveDate()
                                            )
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

        generatedDates.forEach(date__value => {
            document.querySelector('.scheduler__appointments').insertAdjacentHTML(
                'beforeend',
                `
                <div class="scheduler__appointment" title="${date__value.title}" style="
                    left:${date__value.posLeft}%;
                    top:${date__value.posTop}%;
                    bottom:${date__value.posBottom}%;
                    background:${date__value.background};
                    opacity:${date__value.opacity};
                    width:${date__value.width};
                ">
                    ${date__value.name}
                </div>
            `
            );
        });

        document.querySelector('.scheduler__navigation-week').innerHTML = `
            ${Dates.dateFormat(Dates.getDayOfActiveWeek(1), 'd.m.')} &ndash; ${Dates.dateFormat(
            Dates.getDayOfActiveWeek(7),
            'd.m.Y'
        )} /// _kw ${Dates.weekNumber(Dates.getDayOfActiveWeek(1))}
        `;
    }

    static bindScheduler() {
        document.querySelector('.scheduler').addEventListener('click', e => {
            if (e.target.closest('.scheduler__navigation-button')) {
                if (e.target.closest('.scheduler__navigation-button--today')) {
                    Store.data.session.activeDay = new Date();
                }
                if (e.target.closest('.scheduler__navigation-button--prev-day')) {
                    Store.data.session.activeDay.setDate(
                        Store.data.session.activeDay.getDate() - 1
                    );
                }
                if (e.target.closest('.scheduler__navigation-button--next-day')) {
                    Store.data.session.activeDay.setDate(
                        Store.data.session.activeDay.getDate() + 1
                    );
                }
                if (e.target.closest('.scheduler__navigation-button--prev-week')) {
                    Store.data.session.activeDay.setDate(
                        Store.data.session.activeDay.getDate() - 7
                    );
                }
                if (e.target.closest('.scheduler__navigation-button--next-week')) {
                    Store.data.session.activeDay.setDate(
                        Store.data.session.activeDay.getDate() + 7
                    );
                }
                if (e.target.closest('.scheduler__navigation-button--prev-month')) {
                    Store.data.session.activeDay.setDate(
                        Store.data.session.activeDay.getDate() - 28
                    );
                }
                if (e.target.closest('.scheduler__navigation-button--next-month')) {
                    Store.data.session.activeDay.setDate(
                        Store.data.session.activeDay.getDate() + 28
                    );
                }
                document.querySelector(
                    '.metabar__select--filter[name="date"]'
                ).value = Dates.dateFormat(Store.data.session.activeDay, 'Y-m-d');
                Scheduler.initScheduler();
                Filter.doFilter();
                e.preventDefault();
            }
        });
    }

    static generateDates() {
        let generatedDates = [];
        Store.data.tickets.forEach(tickets__value => {
            let name = tickets__value.project,
                title =
                    tickets__value.project +
                    '\n' +
                    (tickets__value.description || '').substring(0, 100),
                parsed_values = Dates.parseDateString(tickets__value.date, 'scheduler');
            let background =
                Scheduler.getBackgroundColor(tickets__value.status, tickets__value.project) ||
                Scheduler.getBorderColor(tickets__value.status, tickets__value.project);
            if (parsed_values !== false && parsed_values.length > 0) {
                parsed_values.forEach(parsed_values__value => {
                    generatedDates.push({
                        day: parsed_values__value.day,
                        begin: parsed_values__value.begin,
                        end: parsed_values__value.end,
                        name: name,
                        title: title,
                        background: background,
                        opacity: tickets__value.status === 'allday' ? 0.75 : 1
                    });
                });
            }
        });

        /* visual compression of all day events */
        let generatedDatesUndefinedMax = [],
            generatedDatesUndefinedCur = [];
        generatedDates.forEach(generatedDates__value => {
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

        /* finalize */
        generatedDates.forEach(date__value => {
            let posTop, posBottom;
            if (date__value.begin === null) {
                posTop =
                    (generatedDatesUndefinedCur[date__value.day] /
                        generatedDatesUndefinedMax[date__value.day]) *
                    6.25;
                posBottom =
                    100 -
                    ((generatedDatesUndefinedCur[date__value.day] + 1) /
                        generatedDatesUndefinedMax[date__value.day]) *
                        6.25;
                generatedDatesUndefinedCur[date__value.day]++;
            } else {
                posTop = 6.25 * (date__value.begin - 8);
                posBottom = 100 - 6.25 * (date__value.end - 8);
            }

            let width, posLeft;
            if (!('conflict' in date__value)) {
                width = 'calc(12.5% - 4rem)';
                posLeft = 12.5 * date__value.day;
            } else {
                width = 'calc(' + 12.5 / conflicts[date__value.conflict].count + '% - 4rem)';
                posLeft =
                    12.5 * date__value.day +
                    (12.5 / conflicts[date__value.conflict].count) *
                        conflicts[date__value.conflict].painted;
                conflicts[date__value.conflict].painted++;
            }

            date__value.posLeft = posLeft;
            date__value.posTop = posTop;
            date__value.posBottom = posBottom;
            date__value.width = width;
        });

        return generatedDates;
    }

    static getColor(status, project = null) {
        if (
            project !== null &&
            project !== '' &&
            Store.data.colors.project.hasOwnProperty(project)
        ) {
            return Store.data.colors.project[project];
        }
        if (status !== null && status !== '' && Store.data.colors.status.hasOwnProperty(status)) {
            return Store.data.colors.status[status];
        }
        return {
            border: '#9E9E9E'
        };
    }

    static getBackgroundColor(status, project = null) {
        let color = Scheduler.getColor(status, project);
        if (typeof color === 'object' && 'background' in color) {
            return color.background;
        }
        return null;
    }

    static getBorderColor(status, project = null) {
        let color = Scheduler.getColor(status, project);
        if (typeof color === 'object' && 'border' in color) {
            return color.border;
        }
        return color;
    }

    static updateColors() {
        Store.data.tickets.forEach(tickets__value => {
            if (tickets__value.visible === true) {
                let borderColor = Scheduler.getBorderColor(
                        tickets__value.status,
                        tickets__value.project
                    ),
                    backgroundColor = Scheduler.getBackgroundColor(
                        tickets__value.status,
                        tickets__value.project
                    ),
                    el = document.querySelector(
                        '.tickets .tickets__entry[data-id="' + tickets__value.id + '"]'
                    );
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
                el.style.opacity = tickets__value.status === 'allday' ? 0.65 : 1;
            }
        });
    }
}

import Store from './Store';
import Dates from './Dates';
import Filter from './Filter';

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
                                ${Dates.sameDay(Dates.getDayOfActiveWeek(i + 1), Dates.getCurrentDate()) ? ' scheduler__cell--curday' : ''}
                                ${Dates.sameDay(Dates.getDayOfActiveWeek(i + 1), Dates.getActiveDate()) ? ' scheduler__cell--activeday' : ''}
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
                                ${Dates.sameDay(Dates.getDayOfActiveWeek(i + 1), Dates.getCurrentDate()) ? ' scheduler__cell--curday' : ''}
                                ${Dates.sameDay(Dates.getDayOfActiveWeek(i + 1), Dates.getActiveDate()) ? ' scheduler__cell--activeday' : ''}
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
                                <td class="scheduler__cell">${('0' + j).slice(-2)}&ndash;${('0' + (j + 1)).slice(-2)}</td>
                                ${Array(7)
                                    .join(0)
                                    .split(0)
                                    .map(
                                        (item, i) => `
                                    <td class="
                                        scheduler__cell
                                        ${Dates.sameDay(Dates.getDayOfActiveWeek(i + 1), Dates.getCurrentDate()) ? ' scheduler__cell--curday' : ''}
                                        ${Dates.sameDay(Dates.getDayOfActiveWeek(i + 1), Dates.getActiveDate()) ? ' scheduler__cell--activeday' : ''}
                                        ${i < 5 && ((j >= 9 && j < 13) || (j >= 14 && j < 18)) ? ' scheduler__cell--main' : ''}
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

        let generatedDates = Scheduler.generateDates(),
            generatedDatesUndefinedMax = [],
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
        generatedDates.forEach(date__value => {
            let posLeft = 12.5 * date__value.day,
                posTop,
                posBottom;
            if (date__value.begin === null) {
                posTop = (generatedDatesUndefinedCur[date__value.day] / generatedDatesUndefinedMax[date__value.day]) * 6.25;
                posBottom = 100 - ((generatedDatesUndefinedCur[date__value.day] + 1) / generatedDatesUndefinedMax[date__value.day]) * 6.25;
                generatedDatesUndefinedCur[date__value.day]++;
            } else {
                posTop = 6.25 * (date__value.begin - 8);
                posBottom = 100 - 6.25 * (date__value.end - 8);
            }
            document.querySelector('.scheduler__appointments').insertAdjacentHTML(
                'beforeend',
                `
                <div class="scheduler__appointment" title="${date__value.title}" style="
                    left:${posLeft}%;
                    top:${posTop}%;
                    bottom:${posBottom}%;
                    background-color:${date__value.backgroundColor};
                ">
                    ${date__value.name}
                </div>
            `
            );
        });

        document.querySelector('.scheduler__navigation-week').innerHTML = `
            ${Dates.dateFormat(Dates.getDayOfActiveWeek(1), 'd.m.')} &ndash; ${Dates.dateFormat(Dates.getDayOfActiveWeek(7), 'd.m.Y')} /// _kw ${Dates.weekNumber(Dates.getDayOfActiveWeek(1))}
        `;
    }

    static bindScheduler() {
        document.querySelector('.scheduler').addEventListener('click', e => {
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
                document.querySelector('.metabar__select--filter[name="date"]').value = Dates.dateFormat(Store.data.session.activeDay, 'Y-m-d');
                Scheduler.initScheduler();
                Filter.doFilter();
                e.preventDefault();
            }
        });
    }

    static generateDates() {
        let dates = [];
        Store.data.tickets.forEach(tickets__value => {
            let name = tickets__value.project,
                title = tickets__value.project + '\n' + (tickets__value.description || '').substring(0, 100),
                backgroundColor = Scheduler.getColor(tickets__value.status),
                parsed_values = Dates.parseDateString(tickets__value.date, 'scheduler');
            if (parsed_values !== false && parsed_values.length > 0) {
                parsed_values.forEach(parsed_values__value => {
                    dates.push({
                        day: parsed_values__value.day,
                        begin: parsed_values__value.begin,
                        end: parsed_values__value.end,
                        name: name,
                        title: title,
                        backgroundColor: backgroundColor
                    });
                });
            }
        });
        return dates;
    }

    static getColor(status) {
        let color = '#9E9E9E';
        if (status !== null && status != '' && Store.data.colors.hasOwnProperty(status)) {
            color = Store.data.colors[status];
        }
        return color;
    }

    static updateColors() {
        Store.data.tickets.forEach(tickets__value => {
            document.querySelector('.tickets .tickets__entry[data-id="' + tickets__value.id + '"]').style.borderLeftColor = Scheduler.getColor(tickets__value.status);
        });
    }
}

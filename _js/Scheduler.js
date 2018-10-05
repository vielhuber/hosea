import Store from './Store';
import Dates from './Dates';
import Filter from './Filter';

export default class Scheduler {
    static initScheduler() {
        document.querySelector('.scheduler').innerHTML = `
            <div class="scheduler__navigation">
                <span class="scheduler__navigation-week"></span>
                <a href="#" class="scheduler__navigation-next">_next</a>
                <a href="#" class="scheduler__navigation-prev">_prev</a>
                <a href="#" class="scheduler__navigation-today">_today</a>
            </div>

            <table class="scheduler__table">
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
                            ">
                                ${Dates.dateFormat(Dates.getDayOfActiveWeek(i + 1), 'D d.m.')}
                            </td>
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

        Scheduler.generateDates().forEach(date__value => {
            document.querySelector('.scheduler__appointments').insertAdjacentHTML(
                'beforeend',
                `
                <div class="scheduler__appointment" title="${date__value.title}" style="
                    left:${12.5 * date__value.day}%;
                    top:${6.25 * (date__value.begin - 8)}%;
                    bottom:${100 - 6.25 * (date__value.end - 8)}%;
                    background-color:${date__value.backgroundColor}80;
                ">
                    ${date__value.title}
                </div>
            `
            );
        });

        document.querySelector('.scheduler__navigation-week').innerHTML = `
            ${Dates.dateFormat(Dates.getDayOfActiveWeek(1), 'd.m.')}&ndash;${Dates.dateFormat(Dates.getDayOfActiveWeek(7), 'd.m.Y')} /// _kw ${Dates.weekNumber(Dates.getDayOfActiveWeek(1))}
        `;
    }

    static bindScheduler() {
        document.querySelector('.scheduler').addEventListener('click', e => {
            if (e.target.closest('.scheduler__navigation-today')) {
                Store.data.session.activeDay = new Date();
                document.querySelector('.metabar__select--filter[name="date"]').value = Dates.dateFormat(Store.data.session.activeDay, 'Y-m-d');
                Scheduler.initScheduler();
                Filter.doFilter();
                e.preventDefault();
            }
        });
        document.querySelector('.scheduler').addEventListener('click', e => {
            if (e.target.closest('.scheduler__navigation-prev')) {
                Store.data.session.activeDay.setDate(Store.data.session.activeDay.getDate() - 1);
                document.querySelector('.metabar__select--filter[name="date"]').value = Dates.dateFormat(Store.data.session.activeDay, 'Y-m-d');
                Scheduler.initScheduler();
                Filter.doFilter();
                e.preventDefault();
            }
        });
        document.querySelector('.scheduler').addEventListener('click', e => {
            if (e.target.closest('.scheduler__navigation-next')) {
                Store.data.session.activeDay.setDate(Store.data.session.activeDay.getDate() + 1);
                document.querySelector('.metabar__select--filter[name="date"]').value = Dates.dateFormat(Store.data.session.activeDay, 'Y-m-d');
                Filter.doFilter();
                Scheduler.initScheduler();
                e.preventDefault();
            }
        });
    }

    static generateDates() {
        let dates = [];
        Store.data.tickets.forEach(tickets__value => {
            let title = tickets__value.project + '\n' + (tickets__value.description || '').substring(0, 100),
                backgroundColor = Scheduler.getColor(tickets__value.status),
                parsed_values = Dates.parseDateString(tickets__value.date, 'scheduler');
            if (parsed_values !== false && parsed_values.length > 0) {
                parsed_values.forEach(parsed_values__value => {
                    dates.push({
                        day: parsed_values__value.day,
                        begin: parsed_values__value.begin,
                        end: parsed_values__value.end,
                        title: title,
                        backgroundColor: backgroundColor
                    });
                });
            }
        });
        return dates;
    }

    static getColor(status) {
        let color = '#f2f2f2';
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

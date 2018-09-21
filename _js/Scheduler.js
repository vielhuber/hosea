import Store from './Store';
import Dates from './Dates';

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
                            <td class="scheduler__cell${Dates.sameDay(Dates.getDayOfActiveWeek(i + 1), Dates.getCurrentDate()) ? ' scheduler__cell--curday' : ''}">
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
                Scheduler.initScheduler();
                e.preventDefault();
            }
        });
        document.querySelector('.scheduler').addEventListener('click', e => {
            if (e.target.closest('.scheduler__navigation-prev')) {
                Store.data.session.activeDay.setDate(Store.data.session.activeDay.getDate() - 7);
                Scheduler.initScheduler();
                e.preventDefault();
            }
        });
        document.querySelector('.scheduler').addEventListener('click', e => {
            if (e.target.closest('.scheduler__navigation-next')) {
                Store.data.session.activeDay.setDate(Store.data.session.activeDay.getDate() + 7);
                Scheduler.initScheduler();
                e.preventDefault();
            }
        });
    }

    static generateDates() {
        let dates = [];
        Store.data.tickets.forEach(tickets__value => {
            let title = tickets__value.project + '\n' + (tickets__value.description || '').substring(0, 100),
                ticket_dates = tickets__value.date.split('\n'),
                cur = 0;

            while (ticket_dates[cur] !== undefined) {
                // format: 01.01.18 10:00-11:00
                if (ticket_dates[cur].length === 20) {
                    let d = Dates.germanToEnglishString(ticket_dates[cur]);
                    if (Dates.dateIsInActiveWeek(d)) {
                        let d1 = new Date(d + ' ' + ticket_dates[cur].substring(9, 14) + ':00'),
                            d2 = new Date(d + ' ' + ticket_dates[cur].substring(15, 20) + ':00');
                        dates.push({
                            day: ((d1.getDay() + 6) % 7) + 1,
                            begin: d1.getHours() + d1.getMinutes() / 60 || 24,
                            end: d2.getHours() + d2.getMinutes() / 60 || 24,
                            title: title,
                            backgroundColor: Scheduler.getColor(tickets__value.status)
                        });
                    }
                }

                // format: MO 10:00-11:00 -05.10.18 -12.10.18
                else {
                    let day = Dates.getDayFromString(ticket_dates[cur].substring(0, 2)),
                        d = Dates.getDayOfActiveWeek(day),
                        show = true;
                    if (Dates.dateIsInPast(d)) {
                        show = false;
                    }
                    // exclusions
                    ticket_dates[cur].split(' ').forEach(value => {
                        if (value.indexOf('-') === 0) {
                            if (Dates.sameDay(Dates.germanToEnglishString(value.substring(1)), d)) {
                                show = false;
                            }
                        }
                    });
                    if (show === true) {
                        dates.push({
                            day: day === 7 ? 0 : day,
                            begin: parseInt(ticket_dates[cur].substring(3, 5)) + parseInt(ticket_dates[cur].substring(6, 8)) / 60 || 24,
                            end: parseInt(ticket_dates[cur].substring(9, 11)) + parseInt(ticket_dates[cur].substring(12, 14)) / 60 || 24,
                            title: title,
                            backgroundColor: Scheduler.getColor(tickets__value.status)
                        });
                    }
                }

                cur += 1;
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

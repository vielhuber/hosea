import Store from './Store';
import Dates from './Dates';

export default class Scheduler {
    static initScheduler() {
        document.querySelector('.scheduler').innerHTML = `
            <div class="scheduler__navigation">
                <span class="scheduler__navigation-week"></span>
                <a href="#" class="scheduler__navigation-next">next</a>
                <a href="#" class="scheduler__navigation-prev">prev</a>
                <a href="#" class="scheduler__navigation-today">today</a>
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
                            <td class="scheduler__cell${
                                Dates.sameDay(
                                    Dates.getDayOfActiveWeek(i + 1),
                                    Dates.getCurrentDate()
                                )
                                    ? ' scheduler__cell--curday'
                                    : ''
                            }">
                                ${Dates.dateFormat(
                                    Dates.getDayOfActiveWeek(i + 1),
                                    'D d.m.'
                                )}
                                <br/>
                                KW ${Dates.weekNumber(
                                    Dates.getDayOfActiveWeek(i + 1)
                                )}
                            </td>
                        `
                            )
                            .join('')}
                    </tr>
                    <tr class="scheduler__row">
                        <td class="scheduler__cell">Ganztätig</td>
                        ${Array(7)
                            .join(0)
                            .split(0)
                            .map(
                                (item, i) =>
                                    `<td class="scheduler__cell${
                                        Dates.sameDay(
                                            Dates.getDayOfActiveWeek(i + 1),
                                            Dates.getCurrentDate()
                                        )
                                            ? ' scheduler__cell--curday'
                                            : ''
                                    }"></td>`
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
                                <td class="scheduler__cell">${('0' + j).slice(
                                    -2
                                )}&ndash;${('0' + (j + 1)).slice(-2)}</td>
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
                                            i < 5 &&
                                            ((j >= 9 && j < 13) ||
                                                (j >= 14 && j < 18))
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

        Scheduler.generateDates().forEach(date__value => {
            document
                .querySelector('.scheduler__appointments')
                .insertAdjacentHTML(
                    'beforeend',
                    `
                <div class="scheduler__appointment" title="${
                    date__value.title
                }" style="
                    left:${12.5 * date__value.day}%;
                    top:${6.25 * (date__value.begin - 8)}%;
                    bottom:${100 - 6.25 * (date__value.end - 8)}%;
                    background-color:${date__value.backgroundColor};
                ">
                    ${date__value.title}
                </div>
            `
                );
        });

        document.querySelector('.scheduler__navigation-week').innerHTML = `
            ${Dates.dateFormat(
                Dates.getDayOfActiveWeek(1),
                'd. F Y'
            )} &ndash;  ${Dates.dateFormat(
            Dates.getDayOfActiveWeek(7),
            'd. F Y'
        )}
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
                Store.data.session.activeDay.setDate(
                    Store.data.session.activeDay.getDate() - 7
                );
                Scheduler.initScheduler();
                e.preventDefault();
            }
        });
        document.querySelector('.scheduler').addEventListener('click', e => {
            if (e.target.closest('.scheduler__navigation-next')) {
                Store.data.session.activeDay.setDate(
                    Store.data.session.activeDay.getDate() + 7
                );
                Scheduler.initScheduler();
                e.preventDefault();
            }
        });
    }

    static generateDates() {
        let dates = [];
        Store.data.tickets.forEach(tickets__value => {
            if (Dates.dateIsInActiveWeek(tickets__value.date.split('\n')[0])) {
                let title =
                        tickets__value.project +
                        '\n' +
                        (tickets__value.description || '').substring(0, 100),
                    ticket_dates = tickets__value.date.split('\n'),
                    cur = 0;
                while (ticket_dates[cur] !== undefined) {
                    let d1 = new Date(ticket_dates[cur]),
                        d2 = new Date(ticket_dates[cur + 1]);
                    dates.push({
                        day: ((d1.getDay() + 6) % 7) + 1,
                        begin: d1.getHours() + d1.getMinutes() / 60 || 24,
                        end: d2.getHours() + d2.getMinutes() / 60 || 24,
                        title: title,
                        backgroundColor: Scheduler.getColor(
                            tickets__value.status
                        )
                    });
                    cur += 2;
                }
            }
        });
        return dates;
    }

    static getColor(status) {
        let color = '#f2f2f2';
        if (
            status !== null &&
            status != '' &&
            Store.data.colors.hasOwnProperty(status)
        ) {
            color = Store.data.colors[status];
        }
        return color;
    }

    static updateColors() {
        Store.data.tickets.forEach(tickets__value => {
            document.querySelector(
                '.tickets .tickets__entry[data-id="' + tickets__value.id + '"]'
            ).style.backgroundColor = Scheduler.getColor(tickets__value.status);
        });
    }
}

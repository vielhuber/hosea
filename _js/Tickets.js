import Dates from './Dates';
import Filter from './Filter';
import Helper from './Helper';
import Html from './Html';
import Lock from './Lock';
import Scheduler from './Scheduler';
import Quickbox from './Quickbox';
import Store from './Store';
import Textarea from './Textarea';
import Footer from './Footer';
import Attachments from './Attachments';
import hlp from 'hlp';

export default class Tickets {
    static updateLocalTicket(ticket_id) {
        return new Promise((resolve, reject) => {
            Store.data.busy = true;
            Store.data.api
                .fetch('_api/tickets/' + ticket_id, {
                    method: 'GET',
                    cache: 'no-cache',
                    headers: { 'content-type': 'application/json' },
                })
                .then((res) => res.json())
                .catch((err) => {
                    reject(err);
                })
                .then((response) => {
                    Store.data.busy = false;
                    Tickets.setTicketData(ticket_id, response.data);
                    resolve();
                });
        });
    }
    static setTicketData(ticket_id, property, value = null) {
        Store.data.tickets.forEach((tickets__value) => {
            if (tickets__value.id == ticket_id) {
                if (Helper.isObject(property)) {
                    Object.entries(property).forEach(([property__key, property__value]) => {
                        tickets__value[property__key] = property__value;
                    });
                } else {
                    tickets__value[property] = value;
                }
            }
        });
    }
    static fetchAndRenderTicketsInterval() {
        if (hlp.isDesktop()) {
            setInterval(() => {
                if (Store.data.busy === true) {
                    return;
                }
                if (document.querySelector(':focus') !== null) {
                    return;
                }
                Tickets.fetchAndRenderTicketsAndUpdateApp();
                Footer.updateStatus('successfully synced tasks.', 'success');
            }, 1 * 60 * 1000);
        }
    }

    static async fetchAndRenderTicketsAndUpdateApp() {
        await Tickets.fetchAndRenderTickets();
        Scheduler.initScheduler();
        Scheduler.updateColors();
        Quickbox.initToday();
        Tickets.updateSum();
        Filter.updateFilter();
    }

    static fetchAndRenderTickets() {
        return new Promise((resolve, reject) => {
            Store.data.busy = true;
            Store.data.api
                .fetch('_api/tickets', {
                    method: 'GET',
                    cache: 'no-cache',
                    headers: { 'content-type': 'application/json' },
                })
                .then((res) => res.json())
                .catch((err) => {
                    reject(err);
                })
                .then((response) => {
                    Store.data.busy = false;
                    if (Store.data.tickets === null) {
                        Store.data.tickets = [];
                    }

                    // remove
                    Store.data.tickets = Store.data.tickets.filter((tickets__value) => {
                        let exists =
                            response.data.filter((el) => {
                                return el.id == tickets__value.id;
                            }).length > 0;
                        if (exists === false) {
                            document.querySelector('.tickets__entry[data-id="' + tickets__value.id + '"]').remove();
                            //console.log('removing ticket ' + tickets__value.id);
                        }
                        return exists;
                    });

                    // edit
                    response.data.forEach((tickets__value) => {
                        Store.data.tickets.forEach((store__value, store__key) => {
                            if (
                                store__value.id == tickets__value.id &&
                                store__value.updated_at != tickets__value.updated_at
                            ) {
                                tickets__value.visible = false;
                                Store.data.tickets[store__key] = tickets__value;
                                document.querySelector(
                                    '.tickets__entry[data-id="' + tickets__value.id + '"]'
                                ).outerHTML = Html.createHtmlLine(tickets__value, false);
                                //console.log('editing ticket ' + tickets__value.id);
                            }
                        });
                    });

                    // add
                    response.data.forEach((tickets__value) => {
                        if (
                            Store.data.tickets.filter((el) => {
                                return el.id == tickets__value.id;
                            }).length === 0
                        ) {
                            tickets__value.visible = false;
                            Store.data.tickets.push(tickets__value);
                            document
                                .querySelector('.tickets__table-body')
                                .insertAdjacentHTML('beforeend', Html.createHtmlLine(tickets__value, false));
                            //console.log('adding ticket ' + tickets__value.id);
                        }
                    });

                    resolve();
                });
        });
    }

    static getTicketData(ticket_id) {
        let data = null;
        Store.data.tickets.forEach((tickets__value) => {
            if (tickets__value.id == ticket_id) {
                data = tickets__value;
            }
        });
        return hlp.deepCopy(data);
    }

    static deleteTicket(ticket_id) {
        return new Promise((resolve, reject) => {
            Store.data.busy = true;
            Store.data.api
                .fetch('_api/tickets/' + ticket_id, {
                    method: 'DELETE',
                    cache: 'no-cache',
                    headers: { 'content-type': 'application/json' },
                })
                .then((res) => res.json())
                .catch((err) => {
                    console.error(err);
                })
                .then((response) => {
                    Store.data.busy = false;
                    Store.data.tickets.forEach((tickets__value, tickets__key) => {
                        if (tickets__value.id == ticket_id) {
                            Store.data.tickets.splice(tickets__key, 1);
                        }
                    });
                    resolve();
                });
        });
    }

    static saveTickets() {
        return new Promise((resolve, reject) => {
            if (
                document.querySelector('.tickets .tickets__table-body').querySelector('.tickets__textarea:invalid') !==
                null
            ) {
                reject('not saved - invalid fields!');
                return;
            }

            let changed = [];

            document
                .querySelector('.tickets .tickets__table-body')
                .querySelectorAll('.tickets__entry--changed')
                .forEach((el) => {
                    let data = {};
                    Store.data.cols.forEach((cols__value) => {
                        data[cols__value] = el.querySelector('[name="' + cols__value + '"]').value;
                    });
                    data['updated_at'] = Dates.time().toString();
                    Tickets.setTicketData(el.getAttribute('data-id'), data);
                    Lock.lockTicket(el.getAttribute('data-id'));
                    changed.push(Tickets.getTicketData(el.getAttribute('data-id')));
                });

            Store.data.busy = true;
            Store.data.api
                .fetch('_api/tickets', {
                    method: 'PUT',
                    body: JSON.stringify({
                        tickets: changed,
                    }),
                    cache: 'no-cache',
                    headers: { 'content-type': 'application/json' },
                })
                .then((res) => res.json())
                .catch((err) => {
                    console.error(err);
                })
                .then((response) => {
                    Store.data.busy = false;
                    response.data.ids.forEach((value) => {
                        Lock.unlockTicket(value);
                    });
                    Scheduler.initScheduler();
                    Scheduler.updateColors();
                    Quickbox.initToday();
                    Tickets.updateSum();
                    Filter.updateFilter();
                    resolve();
                });
        });
    }

    static createTicket(data = {}) {
        return new Promise((resolve, reject) => {
            let ticket = {};
            Store.data.cols.forEach((cols__value) => {
                ticket[cols__value] = cols__value in data ? data[cols__value] : '';
            });
            ticket['updated_at'] = Dates.time().toString();
            Store.data.busy = true;
            Store.data.api
                .fetch('_api/tickets', {
                    method: 'POST',
                    body: JSON.stringify(ticket),
                    cache: 'no-cache',
                    headers: { 'content-type': 'application/json' },
                })
                .then((res) => res.json())
                .catch((err) => {
                    reject(err);
                })
                .then((response) => {
                    Store.data.busy = false;
                    ticket.id = response.data.id;
                    ticket.visible = true;
                    Store.data.tickets.push(ticket);
                    resolve(ticket);
                });
        });
    }

    static bindSave() {
        // ctrl+s
        document.addEventListener('keydown', (event) => {
            let focus = document.activeElement;
            if (event.ctrlKey || event.metaKey) {
                if (String.fromCharCode(event.which).toLowerCase() === 's') {
                    Footer.updateStatus('saving...', 'warning');
                    Tickets.saveTickets()
                        .then(() => {
                            Footer.updateStatus('saved!', 'success');
                            if (focus !== null) {
                                focus.focus();
                            }
                        })
                        .catch((error) => {
                            Footer.updateStatus(error, 'error');
                        });
                    event.preventDefault();
                }
            }
        });
    }

    static bindCreate() {
        // ctrl+d
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey || event.metaKey) {
                if (String.fromCharCode(event.which).toLowerCase() === 'd') {
                    Tickets.prepareCreateTicket();
                    event.preventDefault();
                }
            }
        });
    }

    static prepareCreateTicket() {
        let visibleAll = document
                .querySelector('.tickets .tickets__table-body')
                .querySelectorAll('.tickets__entry--visible'),
            current = null,
            currentCol = 1,
            duplicateData = {};
        if (visibleAll.length > 0) {
            if (document.activeElement.closest('.tickets__entry') !== null) {
                current = document.activeElement.closest('.tickets__entry');
                currentCol = Helper.prevAll(document.activeElement.closest('td')).length + 1;
            } else {
                current = visibleAll[visibleAll.length - 1];
                currentCol = 1;
            }
            duplicateData = Tickets.getTicketData(current.getAttribute('data-id'));
            delete duplicateData['attachments'];
        }
        /* if source is a recurring ticket, do some magic */
        if (
            current !== null &&
            duplicateData.status === 'recurring' &&
            confirm('should the copy be a scheduled ticket and the recurring ticket automatically be postponed?')
        ) {
            let newDates = [];
            duplicateData.date.split('\n').forEach((duplicateData__value) => {
                let newDate = Dates.dateFormat(Dates.getActiveDate(), 'd.m.y'),
                    extractedTime = Dates.extractTimeFromDate(duplicateData__value);
                if (extractedTime) {
                    newDate += ' ' + extractedTime;
                }
                newDates.push(newDate);
            });
            current.querySelector('.tickets__textarea--date').value = Dates.includeNewLowerBoundInDate(
                duplicateData.date,
                Dates.getActiveDate()
            );
            current.querySelector('.tickets__textarea--date').dispatchEvent(new Event('input', { bubbles: true }));
            duplicateData.date = newDates.join('\n');
            duplicateData.status = 'scheduled';
        }
        Tickets.createAndAppendTicket(duplicateData, current, currentCol, true, false);
    }

    static createAndAppendTicket(data, current = null, currentCol = 1, withSelect = true, doFilter = false) {
        if (['tonight', 'weekend', 'next'].includes(data.date)) {
            let d = new Date();
            if (d.getHours() >= 21) {
                d.setDate(d.getDate() + 1);
                d.setHours(9);
            }
            if (data.date === 'weekend') {
                while (d.getDay() % 6 !== 0) {
                    d.setDate(d.getDate() + 1);
                }
            }
            if (data.date === 'next') {
                data.date = Scheduler.determineNextFreeSlot(
                    ('0' + d.getDate()).slice(-2) +
                        '.' +
                        ('0' + (d.getMonth() + 1)).slice(-2) +
                        '.' +
                        d.getFullYear().toString().substr(-2) +
                        ' ' +
                        Dates.timeFormat(d.getHours() + 1) +
                        '-' +
                        Dates.timeFormat(d.getHours() + 1.5)
                );
            } else {
                data.date =
                    ('0' + d.getDate()).slice(-2) +
                    '.' +
                    ('0' + (d.getMonth() + 1)).slice(-2) +
                    '.' +
                    d.getFullYear().toString().substr(-2) +
                    ' 21:00-21:30';
            }
        }

        Tickets.createTicket(data)
            .then((ticket) => {
                let next;
                if (current !== null) {
                    current.insertAdjacentHTML('afterend', Html.createHtmlLine(ticket, true));
                    next = current.nextElementSibling;
                } else {
                    document
                        .querySelector('.tickets .tickets__table-body')
                        .insertAdjacentHTML('beforeend', Html.createHtmlLine(ticket, true));
                    next = document
                        .querySelector('.tickets .tickets__table-body')
                        .querySelector('.tickets__entry--visible[data-id="' + ticket.id + '"]');
                }
                if (withSelect === true) {
                    let input = next.querySelector('td:nth-child(' + currentCol + ')').querySelector('input, textarea');
                    input.select();
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
                Scheduler.initScheduler();
                Scheduler.updateColors();
                Quickbox.initToday();
                Tickets.updateSum();
                Filter.updateFilter();
                Textarea.textareaSetVisibleHeights();
                if (doFilter === true) {
                    Filter.doFilter();
                }
                if ('attachments' in data && data.attachments.length > 0) {
                    Attachments.startUploadsAndBuildHtml(ticket.id, data.attachments);
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    static bindChangeTracking() {
        document.querySelector('.tickets').addEventListener('input', (e) => {
            if (e.target.closest('.tickets__entry input, .tickets__entry textarea')) {
                if (e.target.hasAttribute('type') && e.target.getAttribute('type') === 'file') {
                    return;
                }
                e.target.closest('.tickets__entry').classList.add('tickets__entry--changed');
            }
        });
    }

    static bindValidation() {
        document.querySelector('.tickets').addEventListener('input', (e) => {
            if (e.target.value !== '') {
                if (e.target.closest('.tickets__textarea--date')) {
                    if (Dates.parseDateString(e.target.value, 'tickets') === false) {
                        e.target.setCustomValidity('wrong format');
                    } else {
                        e.target.setCustomValidity('');
                    }
                }
                if (e.target.closest('.tickets__textarea--time')) {
                    if (
                        !new RegExp('^[0-9]$|^[0-9],[0-9]$|^[0-9],[0-9][0-9]$').test(e.target.value) ||
                        e.target.value < 0 ||
                        e.target.value > 24
                    ) {
                        e.target.setCustomValidity('wrong format');
                    } else {
                        e.target.setCustomValidity('');
                    }
                }
                if (e.target.closest('.tickets__textarea--project')) {
                    if (new RegExp('[^a-zA-Z0-9äÄöÖüÜß .]').test(e.target.value)) {
                        e.target.setCustomValidity('wrong format');
                    } else {
                        e.target.setCustomValidity('');
                    }
                }
                if (e.target.closest('.tickets__textarea--priority')) {
                    if (!['A', 'B', 'C', 'D'].includes(e.target.value)) {
                        e.target.setCustomValidity('wrong format');
                    } else {
                        e.target.setCustomValidity('');
                    }
                }
                if (e.target.closest('.tickets__textarea--status')) {
                    if (
                        ![
                            'scheduled',
                            'idle',
                            'allday',
                            'roaming',
                            'fixed',
                            'done',
                            'billed',
                            'recurring',
                            'working',
                        ].includes(e.target.value)
                    ) {
                        e.target.setCustomValidity('wrong format');
                    } else {
                        e.target.setCustomValidity('');
                    }
                }
            } else {
                e.target.setCustomValidity('');
            }
        });
    }

    static bindAutoTime() {
        document.querySelector('.tickets').addEventListener('input', (e) => {
            if (e.target.closest('.tickets__entry [name="date"]')) {
                if (e.target.value != '') {
                    let parsed_values = Dates.parseDateString(e.target.value, 'all');
                    if (parsed_values !== false) {
                        let time = 0;
                        parsed_values.forEach((parses_values__value) => {
                            if (parses_values__value.begin !== undefined && parses_values__value.end !== undefined) {
                                time += Math.abs(parses_values__value.end - parses_values__value.begin);
                            }
                        });
                        if (!Number.isInteger(time)) {
                            time = time.toFixed(2);
                        }
                        time = time.toString().replace('.', ',');
                        e.target.closest('.tickets__entry').querySelector('[name="time"]').value = time;
                    }
                }
            }
        });
    }

    static bindDelete() {
        document.querySelector('.tickets').addEventListener('click', (e) => {
            if (e.target.closest('.tickets__entry__delete')) {
                let ticket_id = e.target.closest('.tickets__entry').getAttribute('data-id');
                if (Lock.ticketIsLocked(ticket_id)) {
                    e.preventDefault();
                }
                let result = confirm('Sind Sie sicher?');
                if (result) {
                    Tickets.deleteTicket(ticket_id)
                        .then((result) => {
                            e.target.closest('.tickets__entry').remove();
                            Scheduler.initScheduler();
                            Quickbox.initToday();
                            Tickets.updateSum();
                            Filter.updateFilter();
                        })
                        .catch((error) => {});
                    e.preventDefault();
                }
                e.preventDefault();
            }
        });
    }

    static updateSum() {
        let sum = 0;
        Store.data.tickets.forEach((tickets__value) => {
            if (
                tickets__value.visible !== false &&
                tickets__value.time !== null &&
                tickets__value.time != '' &&
                !['idle', 'allday', 'done', 'billed'].includes(tickets__value.status)
            ) {
                sum += parseFloat(tickets__value.time.replace(',', '.'));
            }
        });
        sum = Math.round(sum * 100) / 100;
        sum = sum.toString().replace('.', ',');
        document.querySelector('.tickets__table-foot').querySelector('.tickets__sum').textContent = sum;
    }
}

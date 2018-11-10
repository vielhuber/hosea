import Dates from './Dates';
import Filter from './Filter';
import Helper from './Helper';
import Html from './Html';
import Lock from './Lock';
import Scheduler from './Scheduler';
import Store from './Store';
import Textarea from './Textarea';
import Footer from './Footer';
import hlp from 'hlp';

export default class Tickets {
    static updateLocalTicket(ticket_id) {
        return new Promise((resolve, reject) => {
            Store.data.api
                .fetch('_api/tickets/' + ticket_id, {
                    method: 'GET',
                    cache: 'no-cache',
                    headers: { 'content-type': 'application/json' }
                })
                .then(res => res.json())
                .catch(err => {
                    reject(err);
                })
                .then(response => {
                    Tickets.setTicketData(ticket_id, response.data);
                    resolve();
                });
        });
    }
    static setTicketData(ticket_id, property, value = null) {
        Store.data.tickets.forEach(tickets__value => {
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
    static fetchTickets() {
        return new Promise((resolve, reject) => {
            Store.data.api
                .fetch('_api/tickets', {
                    method: 'GET',
                    cache: 'no-cache',
                    headers: { 'content-type': 'application/json' }
                })
                .then(res => res.json())
                .catch(err => {
                    reject(err);
                })
                .then(response => {
                    Store.data.tickets = [];
                    response.data.forEach(tickets__value => {
                        tickets__value.visible = false;
                        Store.data.tickets.push(tickets__value);
                    });
                    resolve();
                });
        });
    }

    static getTicketData(ticket_id) {
        let data = null;
        Store.data.tickets.forEach(tickets__value => {
            if (tickets__value.id == ticket_id) {
                data = tickets__value;
            }
        });
        return hlp.deepCopy(data);
    }

    static deleteTicket(ticket_id) {
        return new Promise((resolve, reject) => {
            Store.data.api
                .fetch('_api/tickets/' + ticket_id, {
                    method: 'DELETE',
                    cache: 'no-cache',
                    headers: { 'content-type': 'application/json' }
                })
                .then(res => res.json())
                .catch(err => {
                    console.error(err);
                })
                .then(response => {
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
            if (document.querySelector('.tickets .tickets__table-body').querySelector('.tickets__textarea:invalid') !== null) {
                reject('not saved - invalid fields!');
                return;
            }

            let changed = [];

            document
                .querySelector('.tickets .tickets__table-body')
                .querySelectorAll('.tickets__entry--changed')
                .forEach(el => {
                    let data = {};
                    Store.data.cols.forEach(cols__value => {
                        data[cols__value] = el.querySelector('[name="' + cols__value + '"]').value;
                    });
                    Tickets.setTicketData(el.getAttribute('data-id'), data);
                    Lock.lockTicket(el.getAttribute('data-id'));
                    changed.push(Tickets.getTicketData(el.getAttribute('data-id')));
                });

            Store.data.api
                .fetch('_api/tickets', {
                    method: 'PUT',
                    body: JSON.stringify({
                        tickets: changed
                    }),
                    cache: 'no-cache',
                    headers: { 'content-type': 'application/json' }
                })
                .then(res => res.json())
                .catch(err => {
                    console.error(err);
                })
                .then(response => {
                    response.data.ids.forEach(value => {
                        Lock.unlockTicket(value);
                    });
                    Scheduler.initScheduler();
                    Scheduler.updateColors();
                    Tickets.updateSum();
                    Filter.updateFilter();
                    resolve();
                });
        });
    }

    static createTicket(data = {}) {
        return new Promise((resolve, reject) => {
            let ticket = {};
            Store.data.cols.forEach(cols__value => {
                ticket[cols__value] = cols__value in data ? data[cols__value] : '';
            });
            Store.data.api
                .fetch('_api/tickets', {
                    method: 'POST',
                    body: JSON.stringify(ticket),
                    cache: 'no-cache',
                    headers: { 'content-type': 'application/json' }
                })
                .then(res => res.json())
                .catch(err => {
                    reject(err);
                })
                .then(response => {
                    ticket.id = response.data.id;
                    ticket.visible = true;
                    Store.data.tickets.push(ticket);
                    resolve(ticket);
                });
        });
    }

    static bindSave() {
        // ctrl+s
        document.addEventListener('keydown', event => {
            let focus = document.activeElement;
            if (event.ctrlKey || event.metaKey) {
                if (String.fromCharCode(event.which).toLowerCase() === 's') {
                    Footer.updateStatus('saving...');
                    Tickets.saveTickets()
                        .then(() => {
                            Footer.updateStatus('saved!');
                            if (focus !== null) {
                                focus.focus();
                            }
                        })
                        .catch(error => {
                            Footer.updateStatus(error);
                        });
                    event.preventDefault();
                }
            }
        });
    }

    static bindCreate() {
        // ctrl+d
        document.addEventListener('keydown', event => {
            if (event.ctrlKey || event.metaKey) {
                if (String.fromCharCode(event.which).toLowerCase() === 'd') {
                    Tickets.prepareCreation();
                    event.preventDefault();
                }
            }
        });
    }

    static prepareCreation() {
        let visibleAll = document.querySelector('.tickets .tickets__table-body').querySelectorAll('.tickets__entry--visible'),
            current = null,
            currentIndex = 1,
            duplicateData = {};
        if (visibleAll.length > 0) {
            if (document.activeElement.closest('.tickets__entry') !== null) {
                current = document.activeElement.closest('.tickets__entry');
                currentIndex = Helper.prevAll(document.activeElement.closest('td')).length + 1;
            } else {
                current = visibleAll[visibleAll.length - 1];
                currentIndex = 1;
            }
            duplicateData = Tickets.getTicketData(current.getAttribute('data-id'));
        }
        /* if source is a recurring ticket, do some magic */
        if (current !== null && duplicateData.status === 'recurring') {
            let newDates = [];
            duplicateData.date.split('\n').forEach(duplicateData__value => {
                let newDate = Dates.dateFormat(Dates.getActiveDate(), 'd.m.y'),
                    extractedTime = Dates.extractTimeFromDate(duplicateData__value);
                if (extractedTime) {
                    newDate += ' ' + extractedTime;
                }
                newDates.push(newDate);
            });
            current.querySelector('.tickets__textarea--date').value = Dates.includeNewLowerBoundInDate(duplicateData.date, Dates.getActiveDate());
            current.querySelector('.tickets__textarea--date').dispatchEvent(new Event('input', { bubbles: true }));
            duplicateData.date = newDates.join('\n');
            duplicateData.status = 'scheduled';
        }
        Tickets.createTicket(duplicateData)
            .then(ticket => {
                let next;
                if (current !== null) {
                    current.insertAdjacentHTML('afterend', Html.createHtmlLine(ticket, true));
                    next = current.nextElementSibling;
                } else {
                    document.querySelector('.tickets .tickets__table-body').insertAdjacentHTML('beforeend', Html.createHtmlLine(ticket, true));
                    next = document.querySelector('.tickets .tickets__table-body').querySelector('.tickets__entry--visible');
                }
                let input = next.querySelector('td:nth-child(' + currentIndex + ')').querySelector('input, textarea');
                input.select();
                input.dispatchEvent(new Event('input', { bubbles: true }));
                Scheduler.initScheduler();
                Scheduler.updateColors();
                Tickets.updateSum();
                Filter.updateFilter();
                Textarea.textareaSetVisibleHeights();
            })
            .catch(error => {
                console.error(error);
            });
    }

    static bindChangeTracking() {
        document.querySelector('.tickets').addEventListener('input', e => {
            if (e.target.closest('.tickets__entry input, .tickets__entry textarea')) {
                if (e.target.hasAttribute('type') && e.target.getAttribute('type') === 'file') {
                    return;
                }
                e.target.closest('.tickets__entry').classList.add('tickets__entry--changed');
            }
        });
    }

    static bindValidation() {
        document.querySelector('.tickets').addEventListener('input', e => {
            if (e.target.value !== '') {
                if (e.target.closest('.tickets__textarea--date')) {
                    if (Dates.parseDateString(e.target.value, 'tickets') === false) {
                        e.target.setCustomValidity('wrong format');
                    } else {
                        e.target.setCustomValidity('');
                    }
                }
                if (e.target.closest('.tickets__textarea--time')) {
                    if (!new RegExp('^[0-9]$|^[0-9],[0-9]$|^[0-9],[0-9][0-9]$').test(e.target.value) || e.target.value < 0 || e.target.value > 24) {
                        e.target.setCustomValidity('wrong format');
                    } else {
                        e.target.setCustomValidity('');
                    }
                }
                if (e.target.closest('.tickets__textarea--project')) {
                    if (new RegExp('[^a-zA-Z0-9 ]').test(e.target.value)) {
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
                    if (!['scheduled', 'idle', 'allday', 'roaming', 'done', 'billed', 'recurring', 'working'].includes(e.target.value)) {
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
        document.querySelector('.tickets').addEventListener('input', e => {
            if (e.target.closest('.tickets__entry [name="date"]')) {
                if (e.target.value != '') {
                    let parsed_values = Dates.parseDateString(e.target.value, 'tickets');
                    console.log(parsed_values);
                    if (parsed_values !== false) {
                        let time = 0;
                        parsed_values.forEach(parses_values__value => {
                            if (parses_values__value.begin !== undefined && parses_values__value.end !== undefined) {
                                time += Math.abs(parses_values__value.end - parses_values__value.begin);
                            }
                        });
                        e.target.closest('.tickets__entry').querySelector('[name="time"]').value = time.toString().replace('.', ',');
                    }
                }
            }
        });
    }

    static bindDelete() {
        document.querySelector('.tickets').addEventListener('click', e => {
            if (e.target.closest('.tickets__entry__delete')) {
                let ticket_id = e.target.closest('.tickets__entry').getAttribute('data-id');
                if (Lock.ticketIsLocked(ticket_id)) {
                    e.preventDefault();
                }
                let result = confirm('Sind Sie sicher?');
                if (result) {
                    Tickets.deleteTicket(ticket_id)
                        .then(result => {
                            e.target.closest('.tickets__entry').remove();
                            Scheduler.initScheduler();
                            Tickets.updateSum();
                            Filter.updateFilter();
                        })
                        .catch(error => {});
                    e.preventDefault();
                }
                e.preventDefault();
            }
        });
    }

    static updateSum() {
        let sum = 0;
        Store.data.tickets.forEach(tickets__value => {
            if (tickets__value.visible !== false && tickets__value.time !== null && tickets__value.time != '' && !['idle', 'allday', 'done', 'billed'].includes(tickets__value.status)) {
                sum += parseFloat(tickets__value.time.replace(',', '.'));
            }
        });
        sum = Math.round(sum * 100) / 100;
        sum = sum.toString().replace('.', ',');
        document.querySelector('.tickets__table-foot').querySelector('.tickets__sum').textContent = sum;
    }
}

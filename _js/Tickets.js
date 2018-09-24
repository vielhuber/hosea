import Dates from './Dates';
import Filter from './Filter';
import Helper from './Helper';
import Html from './Html';
import Lock from './Lock';
import Scheduler from './Scheduler';
import Store from './Store';
import Textarea from './Textarea';

export default class Tickets {
    static updateLocalTicket(ticket_id) {
        return new Promise((resolve, reject) => {
            Store.data.api
                .fetch('/_api/tickets/' + ticket_id, {
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
                .fetch('/_api/tickets', {
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
        return data;
    }

    static deleteTicket(ticket_id) {
        return new Promise((resolve, reject) => {
            Store.data.api
                .fetch('/_api/tickets/' + ticket_id, {
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
                .fetch('/_api/tickets', {
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
                ticket[cols__value] = data[cols__value] || null;
            });
            Store.data.api
                .fetch('/_api/tickets', {
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
                    Tickets.saveTickets()
                        .then(() => {
                            if (focus !== null) {
                                focus.focus();
                            }
                        })
                        .catch(error => {
                            console.error(error);
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
                    let visibleAll = document.querySelector('.tickets .tickets__table-body').querySelectorAll('.tickets__entry--visible'),
                        current = visibleAll[visibleAll.length - 1],
                        currentIndex = 1;
                    if (document.activeElement.closest('.tickets__entry') !== null) {
                        (current = document.activeElement.closest('.tickets__entry')), (currentIndex = Helper.prevAll(document.activeElement.closest('td')).length + 1);
                    }
                    Tickets.createTicket(Tickets.getTicketData(current.getAttribute('data-id')))
                        .then(ticket => {
                            current.insertAdjacentHTML('afterend', Html.createHtmlLine(ticket, true));
                            current.nextElementSibling
                                .querySelector('td:nth-child(' + currentIndex + ')')
                                .querySelector('input, textarea')
                                .select();
                            Scheduler.initScheduler();
                            Scheduler.updateColors();
                            Tickets.updateSum();
                            Filter.updateFilter();
                            //Textarea.textareaSetVisibleHeights();
                        })
                        .catch(error => {
                            console.error(error);
                        });
                    event.preventDefault();
                }
            }
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

    static bindAutoTime() {
        document.querySelector('.tickets').addEventListener('change', e => {
            if (e.target.closest('.tickets__entry [name="date"]')) {
                if (e.target.value != '') {
                    let ticket_dates = e.target.value.split('\n'),
                        begin = null,
                        end = null;
                    ticket_dates.forEach((ticket_dates__value, ticket_dates__key) => {
                        if (ticket_dates__key % 2 === 0) {
                            begin = ticket_dates__value;
                        } else {
                            end = ticket_dates__value;
                            if (Dates.isDate(begin) && Dates.isDate(end)) {
                                e.target.closest('.tickets__entry').querySelector('[name="time"]').value = (Math.round((Math.abs(new Date(end) - new Date(begin)) / (1000 * 60 * 60)) * 100) / 100)
                                    .toString()
                                    .replace('.', ',');
                            }
                        }
                    });
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
                if (document.querySelector('.tickets .tickets__table-body').querySelectorAll('.tickets__entry').length === 1) {
                    alert("don't delete the genesis block!");
                    e.preventDefault();
                }
                var result = confirm('Sind Sie sicher?');
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
            if (tickets__value.visible !== false && tickets__value.time !== null && tickets__value.time != '' && !['idle', 'done', 'billed'].includes(tickets__value.status)) {
                sum += parseFloat(tickets__value.time.replace(',', '.'));
            }
        });
        sum = Math.round(sum * 100) / 100;
        sum = sum.toString().replace('.', ',');
        document.querySelector('.tickets__table-foot').querySelector('.tickets__sum').textContent = sum;
    }
}

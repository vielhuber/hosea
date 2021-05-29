import Tickets from './Tickets';
import Store from './Store';
import hlp from 'hlp';
import 'hammerjs';

export default class Quickbox {
    static initQuickbox() {
        Quickbox.buildHtml();
        Quickbox.initMails();
        Quickbox.initToday();
        Quickbox.initNew();
    }

    static bindQuickbox() {
        Quickbox.bindMails();
        Quickbox.allowUnselectRadio();
        Quickbox.bindNav();
        Quickbox.bindNew();
    }

    static buildHtml() {
        document.querySelector('.quickbox').innerHTML = `
            <div class="quickbox__content">
                <div class="quickbox__mails"></div>
                <div class="quickbox__today"></div>
                <div class="quickbox__new"></div>
            </div>
            <div class="quickbox__nav">
                <a href="#mails" class="quickbox__navitem">_mails<span class="quickbox__navitem-count"></span></a>
                <a href="#today" class="quickbox__navitem">_today<span class="quickbox__navitem-count"></span></a>
                <a href="#new" class="quickbox__navitem">_new</a>
            </div>
        `;
    }

    static initMails() {
        Quickbox.fetchMails();
        if (hlp.isDesktop()) {
            setInterval(() => {
                Quickbox.fetchMails();
            }, 60000);
        }
    }

    static fetchMails() {
        if (document.querySelector('.quickbox__mails').classList.contains('quickbox__mails--loading')) {
            return;
        }
        document.querySelector('.quickbox__mails').classList.add('quickbox__mails--loading');
        document.querySelector('.quickbox__mails').classList.remove('quickbox__mails--finished');
        Store.data.api
            .fetch('_api/mails', {
                method: 'GET',
                cache: 'no-cache',
                headers: { 'content-type': 'application/json' },
            })
            .then((res) => res.json())
            .catch(() => {})
            .then((response) => {
                Store.data.mails = [];
                response.data.forEach((mails__value) => {
                    Store.data.mails.push(mails__value);
                });
                Quickbox.renderMails();
                Quickbox.updateMailCount();
            });
    }

    static updateMailCount() {
        document.querySelector('.quickbox__navitem-count').innerText = Store.data.mails.length;
    }

    static renderMails() {
        // add new
        Store.data.mails.forEach((mails__value) => {
            if (document.querySelector('.quickbox__mail[data-id="' + mails__value.id + '"]') === null) {
                let content = mails__value.content;
                document.querySelector('.quickbox__mails').insertAdjacentHTML(
                    'beforeend',
                    `
                    <div class="quickbox__mail quickbox__mail--unread" data-id="${mails__value.id}">
                        <a href="#" class="quickbox__mail-toggle">
                            <div class="quickbox__mail-meta quickbox__mail-meta--from">
                                ${mails__value.from_name + ' (' + mails__value.from_email + ')'}
                            </div>
                            <div class="quickbox__mail-meta quickbox__mail-meta--subject">
                                ${mails__value.subject}
                            </div>
                        </a>
                        <iframe src="about:blank" class="quickbox__mail-content">
                            ${content}
                        </iframe>
                        <div class="quickbox__mail-actions">
                            <form class="quickbox__mail-form">
                                <input type="hidden" name="id" value="${mails__value.id}" />
                                <input type="hidden" name="mailbox" value="${mails__value.mailbox}" />
                                <ul class="quickbox__mail-inputrows">
                                    <li class="quickbox__mail-inputrow quickbox__mail-inputrow--1/3"><label class="quickbox__mail-label"><input class="quickbox__mail-input quickbox__mail-input--radio" type="radio" name="action_ticket_time" value="tonight" uncheckable data-checked checked /><span class="quickbox__mail-label-text">tonight</span></label></li>
                                    <li class="quickbox__mail-inputrow quickbox__mail-inputrow--1/3"><label class="quickbox__mail-label"><input class="quickbox__mail-input quickbox__mail-input--radio" type="radio" name="action_ticket_time" value="weekend" uncheckable /><span class="quickbox__mail-label-text">weekend</span></label></li>
                                    <li class="quickbox__mail-inputrow quickbox__mail-inputrow--1/3"><label class="quickbox__mail-label"><input class="quickbox__mail-input quickbox__mail-input--radio" type="radio" name="action_ticket_time" value="next" uncheckable /><span class="quickbox__mail-label-text">next</span></label></li>
                                    <li class="quickbox__mail-inputrow quickbox__mail-inputrow--1/${
                                        mails__value.editors.length + 2
                                    }"><label class="quickbox__mail-label"><input type="checkbox" class="quickbox__mail-input quickbox__mail-input--checkbox" name="action_send[]" value="sender" /><span class="quickbox__mail-label-text">sender</span></label></li>
                                ${mails__value.editors
                                    .map(
                                        (editors__value) => `
                                            <li class="quickbox__mail-inputrow quickbox__mail-inputrow--1/${
                                                mails__value.editors.length + 2
                                            }"><label class="quickbox__mail-label"><input type="checkbox" class="quickbox__mail-input quickbox__mail-input--checkbox" name="action_send[]" value="${editors__value}" /><span class="quickbox__mail-label-text">${editors__value}</span></label></li>
                                        `
                                    )
                                    .join('')}
                                    <li class="quickbox__mail-inputrow quickbox__mail-inputrow--1/${
                                        mails__value.editors.length + 2
                                    }">
                                        <input
                                            class="quickbox__mail-input quickbox__mail-input--text"
                                            autocomplete="off"
                                            value=""
                                            maxlength="255"
                                            type="text"
                                            placeholder="mailtext"
                                            name="action_send_text"
                                        />
                                    </li>
                                    <li class="quickbox__mail-inputrow quickbox__mail-inputrow--1/2">
                                        <input class="quickbox__new-submit quickbox__new-submit--discard" type="submit" name="discard" value="_discard" />
                                    </li>
                                    <li class="quickbox__mail-inputrow quickbox__mail-inputrow--1/2">
                                        <input class="quickbox__new-submit quickbox__new-submit--create" type="submit" name="create" value="_create" />
                                    </li>
                                </ul>
        	                </form>
                        </div>
                    </div>
                `
                );
                let iframe = document.querySelector(
                    '.quickbox__mail[data-id="' + mails__value.id + '"] .quickbox__mail-content'
                );
                iframe.onload = () => {
                    let style = document.createElement('style');
                    style.textContent = `
                        body {
                            font-family: Verdana, Geneva, sans-serif;
                            zoom:0.5;
                            background-color:#fff;
                            color:#000;
                        }
                        body::-webkit-scrollbar {
                            width: 16px;
                        }
                        body::-webkit-scrollbar-track {
                            background-color: #000000;
                        }
                        body::-webkit-scrollbar-thumb {
                            background-color: #ffffff;
                            box-shadow: -1px 0 0 0 #ffffff;
                        }
                    `;
                    iframe.contentDocument.head.appendChild(style);
                    if (iframe.contentDocument.querySelector('a') !== null) {
                        iframe.contentDocument.querySelectorAll('a').forEach((el) => {
                            el.setAttribute('target', '_blank');
                        });
                    }
                };
                iframe.setAttribute('srcdoc', content);
            }
        });

        // remove existing
        if (document.querySelector('.quickbox__mail') !== null) {
            document.querySelectorAll('.quickbox__mail').forEach((el) => {
                if (
                    Store.data.mails.filter((mails__value) => mails__value.id === el.getAttribute('data-id')).length ===
                    0
                ) {
                    el.remove();
                }
            });
        }

        if (document.querySelector('.quickbox__mails--loading') !== null) {
            document.querySelector('.quickbox__mails--loading').classList.remove('quickbox__mails--loading');
        }
        if (document.querySelector('.quickbox__mail') === null) {
            document.querySelector('.quickbox__mails').classList.add('quickbox__mails--finished');
        }
    }

    static bindMails() {
        document.addEventListener('click', (e) => {
            let el = e.target.closest('.quickbox__mail-toggle');
            if (el) {
                if (el.closest('.quickbox__mail').classList.contains('quickbox__mail--expanded')) {
                    el.closest('.quickbox__mail').classList.remove('quickbox__mail--expanded');
                } else {
                    if (el.closest('.quickbox__mail').classList.contains('quickbox__mail--unread')) {
                        el.closest('.quickbox__mail').classList.remove('quickbox__mail--unread');
                    }
                    el.closest('.quickbox__mail').classList.add('quickbox__mail--expanded');
                }
                e.preventDefault();
            }
        });

        document.addEventListener('click', (e) => {
            let el = e.target.closest('.quickbox__new-submit');
            if (el) {
                let form = el.closest('.quickbox__mail-form'),
                    id = form.closest('.quickbox__mail').getAttribute('data-id'),
                    mail = Store.data.mails.filter((mails__value) => mails__value.id === id)[0],
                    action = el.classList.contains('quickbox__new-submit--create') ? 'create' : 'discard';

                form.closest('.quickbox__mail').classList.add(
                    'quickbox__mail--move-' + (action === 'discard' ? 'left' : 'right')
                );

                if (action === 'create' && form.querySelector('[name="action_ticket_time"]:checked') !== null) {
                    let date = form.querySelector('[name="action_ticket_time"]:checked').value;
                    Tickets.createAndAppendTicket(
                        {
                            date: date,
                            description: mail.subject,
                            priority: 'A',
                            project: 'mail',
                            status: 'scheduled',
                            time: '0,50',
                            visible: true,
                            attachments: [
                                hlp.base64tofile(mail.eml, null, hlp.slugify(mail.subject + ' ' + mail.date) + '.eml'),
                            ],
                        },
                        null,
                        1,
                        false,
                        true
                    );
                }

                Store.data.api
                    .fetch('_api/mails', {
                        method: 'PUT',
                        body: new URLSearchParams(new FormData(form)),
                        cache: 'no-cache',
                        headers: { 'content-type': 'application/json' },
                    })
                    .then((res) => res.json())
                    .catch(() => {})
                    .then((response) => {});
                e.preventDefault();

                setTimeout(() => {
                    Store.data.mails = Store.data.mails.filter(
                        (mails__value) => mails__value.id != form.closest('.quickbox__mail').getAttribute('data-id')
                    );
                    Quickbox.renderMails();
                    Quickbox.updateMailCount();
                }, 500);
            }
        });

        if (!hlp.isDesktop()) {
            let hammer = new Hammer(document.querySelector('.quickbox__mails')).on('swipedown', (ev) => {
                if (document.querySelector('.quickbox__mail--expanded') !== null) {
                    return;
                }
                Quickbox.fetchMails();
            });
            hammer.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });
        }
    }

    static allowUnselectRadio() {
        document.addEventListener('click', (e) => {
            let el = e.target.closest('input[type="radio"][uncheckable]');
            if (el) {
                if (el.hasAttribute('data-checked')) {
                    el.removeAttribute('data-checked');
                    el.checked = false;
                } else {
                    el.checked = true;
                    if (document.querySelector('input[type="radio"][uncheckable][data-checked]') !== null) {
                        document.querySelectorAll('input[type="radio"][uncheckable][data-checked]').forEach((el) => {
                            el.removeAttribute('data-checked');
                        });
                    }
                    el.setAttribute('data-checked', '');
                }
            }
        });
    }

    static bindNav() {
        if (document.querySelector('.quickbox__content') !== null) {
            document.querySelector('.quickbox__content').setAttribute('data-view', 'mails');
            document.querySelector('.quickbox__navitem[href="#mails"]').classList.add('quickbox__navitem--active');
        }
        document.addEventListener('click', (e) => {
            let el = e.target.closest('.quickbox__navitem');
            if (el) {
                if (!el.classList.contains('quickbox__navitem--active')) {
                    if (document.querySelector('.quickbox__navitem--active') !== null) {
                        document.querySelectorAll('.quickbox__navitem--active').forEach((navitem__value) => {
                            navitem__value.classList.remove('quickbox__navitem--active');
                        });
                    }
                    el.classList.add('quickbox__navitem--active');
                    document
                        .querySelector('.quickbox__content')
                        .setAttribute('data-view', el.getAttribute('href').replace('#', ''));
                }
                e.preventDefault();
            }
        });
    }

    static initToday() {
        document.querySelector('.quickbox__today').innerHTML = `
            <ul class="quickbox__today-tickets"></ul>
        `;
        let tickets = hlp.deepCopy(Store.data.tickets),
            count = 0;
        tickets.sort((a, b) => {
            return hlp.spaceship(
                Dates.germanDateTimeToEnglishString(a.date),
                Dates.germanDateTimeToEnglishString(b.date)
            );
        });
        tickets.forEach((tickets__value) => {
            let parsed_values = Dates.parseDateString(tickets__value.date, 'today');
            if (parsed_values !== false && parsed_values.length > 0) {
                parsed_values.forEach((parsed_values__value) => {
                    document.querySelector('.quickbox__today-tickets').insertAdjacentHTML(
                        'beforeend',
                        `
                            <li class="quickbox__today-ticket">
                                <div class="quickbox__today-ticket-project">${tickets__value.project}</div>
                                <div class="quickbox__today-ticket-date">${tickets__value.date}</div>
                                <div class="quickbox__today-ticket-description">${hlp.nl2br(
                                    tickets__value.description
                                )}</div>
                            </li>
                        `
                    );
                });
                count++;
            }
        });
        document.querySelector('.quickbox__navitem[href="#today"] .quickbox__navitem-count').innerText = count;
    }

    static initNew() {
        document.querySelector('.quickbox__new').innerHTML = `
            <form class="quickbox__new-form">
                <ul class="quickbox__new-inputrows">
                    <li class="quickbox__new-inputrow quickbox__new-inputrow--1/4"><label class="quickbox__new-label"><input class="quickbox__new-input quickbox__new-input--radio" type="radio" name="date" value="tonight" checked /><span class="quickbox__new-label-text">tonight</span></label></li>
                    <li class="quickbox__new-inputrow quickbox__new-inputrow--1/4"><label class="quickbox__new-label"><input class="quickbox__new-input quickbox__new-input--radio" type="radio" name="date" value="weekend" /><span class="quickbox__new-label-text">weekend</span></label></li>
                    <li class="quickbox__new-inputrow quickbox__new-inputrow--1/4"><label class="quickbox__new-label"><input class="quickbox__new-input quickbox__new-input--radio" type="radio" name="date" value="next" /><span class="quickbox__new-label-text">next</span></label></li>
                    <li class="quickbox__new-inputrow quickbox__new-inputrow--1/4"><input class="quickbox__new-input quickbox__new-input--text" type="text" name="date" placeholder="date" value="" /></li>
                    <li class="quickbox__new-inputrow"><input class="quickbox__new-input quickbox__new-input--text" type="text" required="required" name="project" placeholder="project" value="" /></li>
                    <li class="quickbox__new-inputrow quickbox__new-inputrow--rheight">
                        <textarea
                            class="quickbox__new-input quickbox__new-input--textarea"
                            autocorrect="off"
                            autocapitalize="off"
                            spellcheck="false"
                            required="required"
                            name="description"
                            placeholder="description"></textarea>
                    </li>
                    <li class="quickbox__new-inputrow"><input class="quickbox__new-submit" type="submit" value="_create" /></li>
                </ul>
            </form>
        `;
    }

    static bindNew() {
        document.querySelector('.quickbox__new-form [name="date"][type="text"]').addEventListener('keyup', (e) => {
            if (
                e.target.value != '' &&
                document.querySelector('.quickbox__new-form [name="date"][type="radio"]:checked') !== null
            ) {
                document.querySelector('.quickbox__new-form [name="date"][type="radio"]:checked').checked = false;
            }
        });
        document.querySelectorAll('.quickbox__new-form [name="date"][type="radio"]').forEach((el) => {
            el.addEventListener('change', (e) => {
                if (e.target.checked === true) {
                    document.querySelector('.quickbox__new-form [name="date"][type="text"]').value = '';
                }
            });
        });
        document.querySelector('.quickbox__new-form').addEventListener('submit', (e) => {
            Tickets.createAndAppendTicket(
                {
                    date:
                        document.querySelector('.quickbox__new-form [type="radio"][name="date"]:checked') !== null
                            ? document.querySelector('.quickbox__new-form [type="radio"][name="date"]:checked').value
                            : document.querySelector('.quickbox__new-form [type="text"][name="date"]').value,
                    description: document.querySelector('.quickbox__new-form [name="description"]').value,
                    priority: 'A',
                    project: document.querySelector('.quickbox__new-form [name="project"]').value,
                    status: 'scheduled',
                    time: '0,50',
                    visible: true,
                },
                null,
                1,
                false,
                true
            );
            e.preventDefault();
        });
    }
}

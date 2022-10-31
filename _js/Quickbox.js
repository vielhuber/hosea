import Tickets from './Tickets';
import Store from './Store';
import Scheduler from './Scheduler';
import Filter from './Filter';
import Footer from './Footer';
import hlp from 'hlp';
import PullToRefresh from 'pulltorefreshjs';

export default class Quickbox {
    lastScrollPos = 0;

    static initQuickbox() {
        Quickbox.buildHtml();
        Quickbox.initMails();
        Quickbox.initToday();
        Quickbox.initNew();
    }

    static bindQuickbox() {
        Quickbox.bindMails();
        Quickbox.allowUnselectRadio();
        Quickbox.bindToday();
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
        Quickbox.fetchMails(true);
        if (hlp.isDesktop()) {
            setInterval(() => {
                if (Store.data.busy === true) {
                    return;
                }
                Quickbox.fetchMails(false);
                Footer.updateStatus('successfully synced mails.', 'success');
            }, 70 * 1000); // must be non divisible by 60 (otherwise it blocks others)
        }
    }

    static fetchMails(firstInit = false) {
        if (document.querySelector('.quickbox__mails').classList.contains('quickbox__mails--loading')) {
            return;
        }
        if (firstInit === true || !hlp.isDesktop()) {
            document.querySelector('.quickbox__mails').classList.add('quickbox__mails--loading');
            document.querySelector('.quickbox__mails').classList.remove('quickbox__mails--finished');
        }
        Store.data.busy = true;
        Store.data.api
            .fetch('_api/mails', {
                method: 'GET',
                cache: 'no-cache',
                headers: { 'content-type': 'application/json' },
            })
            .then((res) => res.json())
            .catch(() => {})
            .then((response) => {
                Store.data.busy = false;
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
                                ${
                                    (mails__value.from_name !== undefined && mails__value.from_name !== null && mails__value.from_name !== false && mails__value.from_name !== '') ?
                                    (mails__value.from_name + ' (' + mails__value.from_email + ')') :
                                    (mails__value.from_email)
                                }
                            </div>
                            <div class="quickbox__mail-meta quickbox__mail-meta--date">
                                ${Dates.dateFormat(new Date(mails__value.date), 'D H:i')}
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
                                        <input class="quickbox__mail-submit quickbox__mail-submit--discard" type="submit" name="discard" value="_discard" />
                                    </li>
                                    <li class="quickbox__mail-inputrow quickbox__mail-inputrow--1/2">
                                        <input class="quickbox__mail-submit quickbox__mail-submit--create" type="submit" name="create" value="_create" />
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
                            zoom:0.75;
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
        } else {
            document.querySelector('.quickbox__mails').classList.remove('quickbox__mails--finished');
        }
    }

    static bindMails() {
        document.addEventListener('click', (e) => {
            let el = e.target.closest('.quickbox__mail-toggle');
            if (el) {
                if (el.closest('.quickbox__mail').classList.contains('quickbox__mail--expanded')) {
                    el.closest('.quickbox__mails').style.overflowY = 'auto';
                    el.closest('.quickbox__mail').classList.remove('quickbox__mail--expanded');
                    el.closest('.quickbox__mails').scrollTop = this.lastScrollPos;
                } else {
                    if (el.closest('.quickbox__mail').classList.contains('quickbox__mail--unread')) {
                        el.closest('.quickbox__mail').classList.remove('quickbox__mail--unread');
                    }
                    this.lastScrollPos = el.closest('.quickbox__mails').scrollTop;
                    el.closest('.quickbox__mails').scrollTop = 0;
                    el.closest('.quickbox__mails').style.overflowY = 'hidden';
                    el.closest('.quickbox__mail').classList.add('quickbox__mail--expanded');
                }
                e.preventDefault();
            }
        });

        document.addEventListener('click', (e) => {
            let el = e.target.closest('.quickbox__mail-submit');
            if (el) {
                let form = el.closest('.quickbox__mail-form'),
                    id = form.closest('.quickbox__mail').getAttribute('data-id'),
                    mail = Store.data.mails.filter((mails__value) => mails__value.id === id)[0],
                    action = el.classList.contains('quickbox__mail-submit--create') ? 'create' : 'discard';

                form.closest('.quickbox__mail').classList.add(
                    'quickbox__mail--move-' + (action === 'discard' ? 'left' : 'right')
                );
                document.querySelector('.quickbox__mails').style.overflowY = 'auto';
                document.querySelector('.quickbox__mails').scrollTop = this.lastScrollPos;

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

                Store.data.busy = true;
                Store.data.api
                    .fetch('_api/mails', {
                        method: 'PUT',
                        body: new URLSearchParams(new FormData(form)),
                        cache: 'no-cache',
                        headers: { 'content-type': 'application/json' },
                    })
                    .then((res) => res.json())
                    .catch(() => {})
                    .then((response) => {
                        Store.data.busy = false;
                    });
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
            PullToRefresh.init({
                mainElement: '.quickbox__mails',
                triggerElement: '.quickbox__mails',
                classPrefix: 'quickbox__pull-to-refresh--',
                distThreshold: 80,
                distMax: 140,
                distIgnore: 10,
                instructionsPullToRefresh: '_swipe down to refresh',
                instructionsReleaseToRefresh: '_release to refresh',
                instructionsRefreshing: '_refreshing',
                shouldPullToRefresh: function () {
                    return (
                        !this.mainElement.scrollTop &&
                        document.querySelector('.quickbox__mails--loading') === null &&
                        document.querySelector('.quickbox__mail--expanded') === null
                    );
                },
                onRefresh() {
                    if (document.querySelector('.quickbox__mail--expanded') !== null) {
                        return;
                    }
                    Quickbox.fetchMails(false);
                },
            });
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
            this.bindNavToggle('mails');
        }
        document.addEventListener('click', (e) => {
            let el = e.target.closest('.quickbox__navitem');
            if (el) {
                if (!el.classList.contains('quickbox__navitem--active')) {
                    this.bindNavToggle(el.getAttribute('href').replace('#', ''));
                }
                e.preventDefault();
            }
        });
    }

    static bindNavToggle(view) {
        if (document.querySelector('.quickbox__content').classList.contains('quickbox__content--disabled')) {
            return;
        }
        document.querySelector('.quickbox__content').classList.add('quickbox__content--disabled');
        /* in chrome we want ctrl+f to not find hidden elements (so we must apply display:none) */
        /* the following lines ensure to do exactly that */
        document.querySelectorAll('.quickbox__content > *').forEach((el2) => {
            el2.style.display = 'block';
        });
        requestAnimationFrame(() => {
            setTimeout(() => {
                document.querySelectorAll('.quickbox__content > *:not(.quickbox__' + view + ')').forEach((el2) => {
                    el2.style.display = 'none';
                });
                document.querySelector('.quickbox__content').classList.remove('quickbox__content--disabled');
            }, 250);
            document.querySelector('.quickbox__content').setAttribute('data-view', view);
            if (document.querySelector('.quickbox__navitem--active') !== null) {
                document.querySelectorAll('.quickbox__navitem--active').forEach((navitem__value) => {
                    navitem__value.classList.remove('quickbox__navitem--active');
                });
            }
            document
                .querySelector('.quickbox__navitem[href="#' + view + '"]')
                .classList.add('quickbox__navitem--active');
        });
    }

    static initToday() {
        document.querySelector('.quickbox__today').innerHTML = `
            <div class="quickbox__today-nav">
                <a class="quickbox__today-navitem quickbox__today-navitem--prev-day" href="#">&lt;</a>
                <a class="quickbox__today-navitem quickbox__today-navitem--cur-day" href="#">${Dates.dateFormat(
                    Dates.getActiveDate(),
                    'd.m.y'
                )}</a>
                <a class="quickbox__today-navitem quickbox__today-navitem--next-day" href="#">&gt;</a>
            </div>
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
            if (['done', 'billed'].includes(tickets__value.status)) {
                return;
            }
            let parsed_values = Dates.parseDateString(tickets__value.date, 'tickets');
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

    static bindToday() {
        document.addEventListener('click', (e) => {
            let el = e.target.closest('.quickbox__today-nav');
            if (el) {
                if (e.target.closest('.quickbox__today-navitem--prev-day')) {
                    Store.data.session.activeDay.setDate(Store.data.session.activeDay.getDate() - 1);
                }
                if (e.target.closest('.quickbox__today-navitem--cur-day')) {
                    Store.data.session.activeDay = new Date();
                }
                if (e.target.closest('.quickbox__today-navitem--next-day')) {
                    Store.data.session.activeDay.setDate(Store.data.session.activeDay.getDate() + 1);
                }
                Quickbox.initToday();
                Scheduler.initScheduler();
                Filter.doFilter();
                e.preventDefault();
            }
        });

        if (!hlp.isDesktop()) {
            PullToRefresh.init({
                mainElement: '.quickbox__today',
                triggerElement: '.quickbox__today',
                classPrefix: 'quickbox__pull-to-refresh--',
                distThreshold: 80,
                distMax: 140,
                distIgnore: 10,
                instructionsPullToRefresh: '_swipe down to refresh',
                instructionsReleaseToRefresh: '_release to refresh',
                instructionsRefreshing: '_refreshing',
                shouldPullToRefresh: function () {
                    return (
                        this.mainElement.querySelector('.quickbox__today-tickets') !== null &&
                        !this.mainElement.querySelector('.quickbox__today-tickets').scrollTop
                    );
                },
                onRefresh() {
                    Tickets.fetchAndRenderTicketsAndUpdateApp();
                },
            });
        }
    }

    static initNew() {
        document.querySelector('.quickbox__new').innerHTML = `
            <form class="quickbox__new-form">
                <ul class="quickbox__new-inputrows">
                    <li class="quickbox__new-inputrow quickbox__new-inputrow--1/4"><label class="quickbox__new-label"><input class="quickbox__new-input quickbox__new-input--radio" type="radio" name="date" value="tonight" checked /><span class="quickbox__new-label-text">tonight</span></label></li>
                    <li class="quickbox__new-inputrow quickbox__new-inputrow--1/4"><label class="quickbox__new-label"><input class="quickbox__new-input quickbox__new-input--radio" type="radio" name="date" value="weekend" /><span class="quickbox__new-label-text">weekend</span></label></li>
                    <li class="quickbox__new-inputrow quickbox__new-inputrow--1/4"><label class="quickbox__new-label"><input class="quickbox__new-input quickbox__new-input--radio" type="radio" name="date" value="next" /><span class="quickbox__new-label-text">next</span></label></li>
                    <li class="quickbox__new-inputrow quickbox__new-inputrow--1/4"><input class="quickbox__new-input quickbox__new-input--text" type="text" name="date" placeholder="date" value="" /></li>
                    <li class="quickbox__new-inputrow"><input class="quickbox__new-input quickbox__new-input--text" type="text" required="required" name="project" placeholder="project" value="private" /></li>
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
            document.querySelector('.quickbox__new-form').reset();
            document.querySelector('.quickbox__navitem[href="#today"]').click();
            e.preventDefault();
        });
    }
}

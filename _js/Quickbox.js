import Tickets from './Tickets';
import Store from './Store';
import Dates from './Dates';
import Scheduler from './Scheduler';
import Filter from './Filter';
import Footer from './Footer';
import hlp from 'hlp';
import PullToRefresh from 'pulltorefreshjs';
import Swal from 'sweetalert2';
import Chart from 'chart.js/auto';

export default class Quickbox {
    lastScrollPos = 0;
    moneyChart = null;
    chartData = null;

    static initQuickbox() {
        Quickbox.buildHtml();
        Quickbox.initMails();
        Quickbox.initMoney();
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
                <div class="quickbox__week"></div>
                <div class="quickbox__mails"></div>
                <div class="quickbox__money"></div>
                <div class="quickbox__today"></div>
                <div class="quickbox__new"></div>
            </div>
            <div class="quickbox__nav quickbox__nav--count-${!hlp.isMobile() ? '2' : '4'}">
                <a href="#week" class="quickbox__navitem${
                    !hlp.isMobile() ? ' quickbox__navitem--hidden' : ''
                }">_week</a>
                <a href="#today" class="quickbox__navitem${
                    !hlp.isMobile() ? ' quickbox__navitem--hidden' : ''
                }">_today<span class="quickbox__navitem-count"></span></a>
                <a href="#mails" class="quickbox__navitem">_mails<span class="quickbox__navitem-count"></span></a>
                <a href="#money" class="quickbox__navitem">_money</a>
                <a href="#new" class="quickbox__navitem">_new</a>
            </div>
        `;
    }

    static initMoney() {
        Store.data.api
            .fetch('_api/money/' + Store.data.user.api_key, {
                method: 'GET',
                cache: 'no-cache',
                headers: { 'content-type': 'application/json' },
            })
            .then((res) => res.json())
            .catch(() => {})
            .then((response) => {
                document.querySelector('.quickbox__money').innerHTML = '';
                document.querySelector('.quickbox__money').insertAdjacentHTML(
                    'beforeend',
                    `
                    <div class="quickbox__money-container">
                        <div class="quickbox__money-stats"></div>
                        <div class="quickbox__money-chart"></div>
                    </div>
                    `
                );
                document.querySelector('.quickbox__money-stats').insertAdjacentHTML(
                    'beforeend',
                    `
                    <ul class="quickbox__money-stats-entries">
                        <li class="quickbox__money-stats-entry">
                            <div class="quickbox__money-stats-entry-inner">
                                <h3 class="quickbox__money-stats-entry-heading">budget/month:</h3>
                                ${response.data.stats.monthly_budget.toLocaleString('de-DE', {
                                    minimumFractionDigits: 2,
                                })}&euro;
                            </div>
                        </li>
                        <li class="quickbox__money-stats-entry">
                            <div class="quickbox__money-stats-entry-inner">
                                <h3 class="quickbox__money-stats-entry-heading">budget/left:</h3>
                                ${response.data.stats.budget_left_in_month.toLocaleString('de-DE', {
                                    minimumFractionDigits: 2,
                                })}&euro;
                            </div>
                        </li>
                        <li class="quickbox__money-stats-entry">
                            <div class="quickbox__money-stats-entry-inner">
                                <h3 class="quickbox__money-stats-entry-heading">budget/day:</h3>
                                ${response.data.stats.budget_left_per_day.toLocaleString('de-DE', {
                                    minimumFractionDigits: 2,
                                })}&euro;
                            </div>
                        </li>
                        <li class="quickbox__money-stats-entry">
                            <div class="quickbox__money-stats-entry-inner">
                                <h3 class="quickbox__money-stats-entry-heading">dist/day:</h3>
                                ${response.data.car.km_per_day.toString().replace('.', ',')}km
                            </div>
                        </li>
                    </ul>
                    `
                );
                document
                    .querySelector('.quickbox__money-chart')
                    .insertAdjacentHTML('beforeend', '<canvas class="quickbox__money-chart-canvas"></canvas>');
                this.chartData = {
                    type: 'bar',
                    data: {
                        labels: Object.keys(response.data.diagrams),
                        datasets: [
                            {
                                label: ' einmalig in €',
                                data: Object.values(response.data.diagrams).map((val) => val[0]),
                                backgroundColor: ['#E91E63', '#FFB300', '#F44336', '#ba68c8', '#2196F3', '#4527a0'],
                                borderColor: '#ffffff',
                                borderWidth: 2,
                            },
                            {
                                label: ' laufend in €',
                                data: Object.values(response.data.diagrams).map((val) => val[1]),
                                backgroundColor: '#8d8d8d',
                                borderColor: '#ffffff',
                                borderWidth: 2,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 250,
                                    callback: (value) => {
                                        return value + '€';
                                    },
                                    font: {
                                        weight: 'bold', // X-Achse fett
                                        family: 'Inconsolata, monospace',
                                        size: 10,
                                    },
                                    color: '#ffffff', // Y-Achsentitel in Weiß
                                },
                                grid: {
                                    display: true, // Aktiviert horizontale Linien
                                    color: 'rgba(255, 255, 255, 0.9)', // Leichte graue Linien
                                    lineWidth: 2,
                                },
                                border: {
                                    display: false, // Versteckt die y-Achsenlinie
                                },
                            },
                            x: {
                                grid: {
                                    display: false, // Deaktiviert vertikale Linien
                                },
                                ticks: {
                                    font: {
                                        weight: 'bold', // Y-Achse fett
                                        family: 'Inconsolata, monospace',
                                        size: 10,
                                    },
                                    color: '#ffffff', // Y-Achsentitel in Weiß
                                },
                            },
                        },
                        plugins: {
                            legend: {
                                display: false,
                            },
                            tooltip: {
                                bodyFont: {
                                    size: 11, // Größe des Tooltip-Texts
                                    family: 'Inconsolata, monospace',
                                },
                                titleFont: {
                                    size: 13, // Größe des Tooltip-Titels
                                    family: 'Inconsolata, monospace',
                                },
                            },
                        },
                        animation: {
                            duration: 3500, // Animation dauert 2 Sekunden
                            easing: 'easeOutBounce', // Bouncy-Effekt
                        },
                    },
                };
                if (document.querySelector('.quickbox__content').getAttribute('data-view') === 'money') {
                    this.initializeMoneyChart();
                }
            });
    }

    static initMails() {
        Quickbox.fetchMails(true);
        if (!hlp.isMobile()) {
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
        if (firstInit === true || hlp.isMobile()) {
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
                if (response.success === true) {
                    response.data.forEach((mails__value) => {
                        Store.data.mails.push(mails__value);
                    });
                } else {
                    Swal.fire({
                        text: 'error syncing mails!',
                        icon: 'error',
                        timer: 10000,
                        timerProgressBar: true,
                        showConfirmButton: false,
                    });
                }
                Quickbox.renderMails();
                Quickbox.updateMailCount();
            });
    }

    static updateMailCount() {
        document.querySelector('.quickbox__navitem[href="#mails"] .quickbox__navitem-count').innerText =
            Store.data.mails.length;
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
                                    mails__value.from_name !== undefined &&
                                    mails__value.from_name !== null &&
                                    mails__value.from_name !== false &&
                                    mails__value.from_name !== ''
                                        ? mails__value.from_name + ' (' + mails__value.from_email + ')'
                                        : mails__value.from_email
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

        if (hlp.isMobile()) {
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
            this.bindNavToggle(!hlp.isMobile() ? 'mails' : 'week');
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
        /* reinitialize chart to init animation */
        if (view === 'money') {
            this.initializeMoneyChart();
        }
        if (view === 'new') {
            setTimeout(() => {
                if (document.querySelector('.quickbox__new-input--focus') !== null) {
                    document.querySelector('.quickbox__new-input--focus').focus();
                }
            }, 250);
        }
        requestAnimationFrame(() => {
            setTimeout(() => {
                document.querySelectorAll('.quickbox__content > *:not(.quickbox__' + view + ')').forEach((el2) => {
                    el2.style.display = 'none';
                });
                document.querySelector('.quickbox__content').classList.remove('quickbox__content--disabled');
            }, 250);

            document.querySelector('.quickbox__content').setAttribute('data-view', view);

            if (view === 'week') {
                document.querySelector('.scheduler').classList.add('scheduler--mobile-active');
            } else {
                document.querySelector('.scheduler').classList.remove('scheduler--mobile-active');
            }

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

    static initializeMoneyChart() {
        if (this.chartData === null || this.chartData === undefined) {
            return;
        }
        if (this.moneyChart) {
            this.moneyChart.destroy();
        }
        this.moneyChart = new Chart(document.querySelector('.quickbox__money-chart-canvas'), this.chartData);
    }

    static initToday() {
        document.querySelector('.quickbox__today').innerHTML = `
            <div class="quickbox__today-nav">
                <a class="quickbox__today-navitem quickbox__today-navitem--prev-day" href="#">&lt;</a>
                <a class="quickbox__today-navitem quickbox__today-navitem--empty" href="#">${Scheduler.generateLinkToEmptyDatesSum()}</a>
                <a class="quickbox__today-navitem quickbox__today-navitem--cur-day" href="#">${
                    Dates.dateFormat(Dates.getActiveDate(), 'd.m.') +
                    '/#' +
                    Dates.weekNumber(Dates.getActiveDate()) +
                    ''
                }</a>
                <a class="quickbox__today-navitem quickbox__today-navitem--next-day" href="#">&gt;</a>
            </div>
            <ul class="quickbox__today-tickets"></ul>
        `;
        let tickets = hlp.deepCopy(Store.data.tickets),
            count = 0;
        tickets.sort((a, b) => {
            let sort_list = [
                    'allday',
                    'working',
                    'fixed',
                    /*
                    'scheduled',
                    'fixed',
                    'idle',
                    'roaming',
                    'recurring',
                    'done',
                    'billed',
                    */
                ],
                a_pos = Infinity,
                b_pos = Infinity;
            sort_list.forEach((sort_list__value, sort_list__key) => {
                if (sort_list__value === a.status) {
                    a_pos = sort_list__key;
                }
                if (sort_list__value === b.status) {
                    b_pos = sort_list__key;
                }
            });
            if (a_pos < b_pos) {
                return -1;
            }
            if (a_pos > b_pos) {
                return 1;
            }
            for (let [val_a, val_b] of [
                a.status == 'recurring' && b.status == 'recurring'
                    ? [a.date, b.date]
                    : [Dates.germanDateTimeToEnglishString(a.date), Dates.germanDateTimeToEnglishString(b.date)],
                [a.priority, b.priority],
                [a.project, b.project],
                //[a.description, b.description],
                [a.id, b.id],
            ]) {
                if (val_a < val_b) {
                    return -1;
                }
                if (val_a > val_b) {
                    return 1;
                }
            }
            return 0;
        });
        tickets.forEach((tickets__value) => {
            if (['done', 'billed'].includes(tickets__value.status)) {
                return;
            }
            if (tickets__value.visible === false) {
                return;
            }
            let parsed_values;
            if (document.querySelector('.metabar__select--filter[name="date"]').value !== '') {
                parsed_values = Dates.parseDateString(tickets__value.date, 'tickets');
            } else {
                parsed_values = [
                    {
                        minutes_left: null,
                    },
                ];
            }

            if (parsed_values !== false && parsed_values.length > 0) {
                parsed_values.forEach((parsed_values__value) => {
                    document.querySelector('.quickbox__today-tickets').insertAdjacentHTML(
                        'beforeend',
                        `
                            <li data-id="${tickets__value.id}" class="quickbox__today-ticket" style="
                                    ${
                                        ['fixed'].includes(tickets__value.status) ? 'border-color' : 'border-left-color'
                                    }: ${Scheduler.getStoreProperty(
                            'border',
                            tickets__value.status,
                            tickets__value.project,
                            'transparent'
                        )}; opacity: ${Scheduler.getStoreProperty(
                            'opacity',
                            tickets__value.status,
                            tickets__value.project,
                            1
                        )}; ${['fixed'].includes(tickets__value.status) ? 'border-width: 5rem;' : ''}">
                                <div class="quickbox__today-ticket-project">${
                                    tickets__value.project
                                }<small class="quickbox__today-ticket-project-status">[${
                            tickets__value.status
                        }]</small></div>
                                <div class="quickbox__today-ticket-date">
                                    ${
                                        tickets__value.status === 'fixed'
                                            ? (parsed_values__value.minutes_left !== null &&
                                              parsed_values__value.minutes_left < 8 * 60
                                                  ? '<span class="quickbox__today-ticket-date-countdown">'
                                                  : '') +
                                              (parsed_values__value.minutes_left !== null &&
                                              parsed_values__value.minutes_left < 0
                                                  ? '⌛⌛⌛'
                                                  : parsed_values__value.minutes_left !== null &&
                                                    parsed_values__value.minutes_left < 8 * 60
                                                  ? '⌛' + parsed_values__value.minutes_left + 'min⌛'
                                                  : '') +
                                              (parsed_values__value.minutes_left !== null &&
                                              parsed_values__value.minutes_left < 8 * 60
                                                  ? '</span>'
                                                  : '')
                                            : ''
                                    }
                                    ${
                                        parsed_values__value.begin !== undefined &&
                                        parsed_values__value.begin !== null &&
                                        parsed_values__value.begin !== '' &&
                                        parsed_values__value.end !== undefined &&
                                        parsed_values__value.end !== null &&
                                        parsed_values__value.end !== ''
                                            ? Math.floor(parsed_values__value.begin).toString().padStart(2, '0') +
                                              ':' +
                                              ((parsed_values__value.begin % 1) * 60).toString().padStart(2, '0') +
                                              '–' +
                                              Math.floor(parsed_values__value.end).toString().padStart(2, '0') +
                                              ':' +
                                              ((parsed_values__value.end % 1) * 60).toString().padStart(2, '0')
                                            : ''
                                    }
                                </div>
                                ${
                                    tickets__value.description !== null && tickets__value.description !== ''
                                        ? `<div class="quickbox__today-ticket-description">${tickets__value.description
                                              .split('\n')
                                              .map((description__value) =>
                                                  hlp
                                                      .rtrim(description__value)
                                                      .replace(/^ +/, (match) => '&nbsp;'.repeat(match.length))
                                              )
                                              .join('<br/>')}</div>`
                                        : ''
                                }

                                <div class="quickbox__today-edit-delete-container">

                                    <div class="quickbox__today-edit-delete-container-top">

                                        <a href="#" class="quickbox__today-edit">
                                            ✏️
                                        </a>

                                        <a href="#" class="quickbox__today-delete">
                                            🗑️
                                        </a>

                                    </div>

                                    <div class="quickbox__today-edit-delete-container-bottom">

                                        <form class="quickbox__today-edit-form">
                                            <ul class="quickbox__today-edit-inputrows">
                                                <li class="quickbox__today-edit-inputrow">
                                                    <input class="quickbox__today-edit-input quickbox__today-edit-input--text validate-field validate-field--date" type="text" name="date" placeholder="date" value="${
                                                        tickets__value.date
                                                    }" />
                                                </li>
                                                <li class="quickbox__today-edit-inputrow">
                                                    <input class="quickbox__today-edit-input quickbox__today-edit-input--text validate-field validate-field--status" type="text" name="status" placeholder="status" value="${
                                                        tickets__value.status
                                                    }" />
                                                </li>
                                                <li class="quickbox__today-edit-inputrow">
                                                    <input class="quickbox__today-edit-input quickbox__today-edit-input--text validate-field validate-field--priority" type="text" name="priority" placeholder="priority" value="${
                                                        tickets__value.priority
                                                    }" />
                                                </li>
                                                <li class="quickbox__today-edit-inputrow">
                                                    <input class="quickbox__today-edit-input quickbox__today-edit-input--text validate-field validate-field--project" type="text" name="project" placeholder="project" value="${
                                                        tickets__value.project
                                                    }" />
                                                </li>
                                                <li class="quickbox__today-edit-inputrow quickbox__today-edit-inputrow--dheight">
                                                    <textarea
                                                        class="quickbox__today-edit-input quickbox__today-edit-input--textarea"
                                                        autocorrect="off"
                                                        autocapitalize="off"
                                                        spellcheck="false"
                                                        name="description"
                                                        placeholder="description">${
                                                            tickets__value.description
                                                        }</textarea>
                                                </li>
                                                <li class="quickbox__today-edit-inputrow">
                                                    <input class="quickbox__today-edit-submit" type="submit" value="_edit" />
                                                </li>
                                            </ul>
                                        </form>

                                    </div>

                                </div>

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
        document.addEventListener('click', async (e) => {
            let el = e.target.closest('.quickbox__today-nav');
            if (el) {
                if (
                    e.target.closest('.quickbox__today-navitem--prev-day') ||
                    e.target.closest('.quickbox__today-navitem--cur-day') ||
                    e.target.closest('.quickbox__today-navitem--next-day')
                ) {
                    if (e.target.closest('.quickbox__today-navitem--prev-day')) {
                        Store.data.session.activeDay.setDate(Store.data.session.activeDay.getDate() - 1);
                    } else if (e.target.closest('.quickbox__today-navitem--cur-day')) {
                        Store.data.session.activeDay = new Date();
                    } else if (e.target.closest('.quickbox__today-navitem--next-day')) {
                        Store.data.session.activeDay.setDate(Store.data.session.activeDay.getDate() + 1);
                    }
                    document.querySelector('.metabar__select--filter[name="date"]').value = Dates.dateFormat(
                        Store.data.session.activeDay,
                        'Y-m-d'
                    );
                    document.querySelector('.metabar__select--sort[name="sort_1"]').value = '';
                } else if (e.target.closest('.quickbox__today-navitem--empty')) {
                    document.querySelector('.metabar__select--filter[name="date"]').value = '';
                    document.querySelector('.metabar__select--sort[name="sort_1"]').value = 'priority';
                }

                await Filter.doFilter();
                await Scheduler.initScheduler();
                Quickbox.initToday();

                e.preventDefault();
            }
        });

        document.addEventListener('submit', (e) => {
            let $form = e.target.closest('.quickbox__today-edit-form');
            if ($form) {
                $form.querySelector('.quickbox__today-edit-submit').disabled = true;

                if ($form.querySelector('*:invalid') !== null) {
                    Swal.fire({
                        text: 'error creating new ticket',
                        icon: 'error',
                        timer: 2000,
                        timerProgressBar: true,
                        showConfirmButton: false,
                    });
                    return;
                }

                let changed = [];

                let data = {};
                Store.data.cols.forEach((cols__value) => {
                    if ($form.querySelector('[name="' + cols__value + '"]') !== null) {
                        data[cols__value] = $form.querySelector('[name="' + cols__value + '"]').value;
                    }
                });
                data['updated_at'] = Dates.time().toString();
                console.log(data);
                Tickets.setTicketData($form.closest('.quickbox__today-ticket').getAttribute('data-id'), data);
                changed.push(Tickets.getTicketData($form.closest('.quickbox__today-ticket').getAttribute('data-id')));

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
                    .then(async (response) => {
                        Store.data.busy = false;
                        await Scheduler.initScheduler();
                        Scheduler.updateColors();
                        Quickbox.initToday();
                        Tickets.updateSum();
                        Filter.updateFilter();
                        Swal.fire({
                            text: 'successfully updated ticket',
                            icon: 'success',
                            timer: 2000,
                            timerProgressBar: true,
                            showConfirmButton: false,
                        });
                    });

                e.preventDefault();
            }
        });

        document.addEventListener('click', (e) => {
            let $el = e.target.closest('.quickbox__today-delete');
            if ($el) {
                let result = confirm('Sind Sie sicher?');
                if (result) {
                    let ticket_id = $el.closest('.quickbox__today-ticket').getAttribute('data-id');

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
                        .then(async (response) => {
                            Store.data.busy = false;
                            Store.data.tickets.forEach((tickets__value, tickets__key) => {
                                if (tickets__value.id == ticket_id) {
                                    Store.data.tickets.splice(tickets__key, 1);
                                }
                            });
                            await Scheduler.initScheduler();
                            Scheduler.updateColors();
                            Quickbox.initToday();
                            Tickets.updateSum();
                            Filter.updateFilter();
                            Swal.fire({
                                text: 'successfully deleted ticket',
                                icon: 'success',
                                timer: 2000,
                                timerProgressBar: true,
                                showConfirmButton: false,
                            });
                        });
                }

                e.preventDefault();
            }
        });

        document.addEventListener('click', (e) => {
            let $el = e.target.closest('.quickbox__today-edit');
            if ($el) {
                let $container = $el
                    .closest('.quickbox__today-ticket')
                    .querySelector('.quickbox__today-edit-delete-container-bottom');
                if (!$container.classList.contains('quickbox__today-edit-delete-container-bottom--active')) {
                    $container.classList.add('quickbox__today-edit-delete-container-bottom--active');
                } else {
                    $container.classList.remove('quickbox__today-edit-delete-container-bottom--active');
                }
                e.preventDefault();
            }
        });

        if (hlp.isMobile()) {
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
                    <li class="quickbox__new-inputrow quickbox__new-inputrow--1/2"><input class="quickbox__new-input quickbox__new-input--text validate-field validate-field--date" type="text" name="date" placeholder="date" value="${Quickbox.proposeNewDate()}" /></li>
                    <li class="quickbox__new-inputrow quickbox__new-inputrow--1/6"><label class="quickbox__new-label"><input class="quickbox__new-input quickbox__new-input--radio" type="radio" name="date" value="tonight" /><span class="quickbox__new-label-text">tonight</span></label></li>
                    <li class="quickbox__new-inputrow quickbox__new-inputrow--1/6"><label class="quickbox__new-label"><input class="quickbox__new-input quickbox__new-input--radio" type="radio" name="date" value="weekend" /><span class="quickbox__new-label-text">weekend</span></label></li>
                    <li class="quickbox__new-inputrow quickbox__new-inputrow--1/6"><label class="quickbox__new-label"><input class="quickbox__new-input quickbox__new-input--radio" type="radio" name="date" value="next" /><span class="quickbox__new-label-text">next</span></label></li>
                    <li class="quickbox__new-inputrow"><input class="quickbox__new-input quickbox__new-input--text validate-field validate-field--project autocaps" type="text" required="required" name="project" placeholder="project" value="PRIVATE" /></li>
                    <li class="quickbox__new-inputrow quickbox__new-inputrow--rheight">
                        <textarea
                            class="quickbox__new-input quickbox__new-input--textarea quickbox__new-input--focus"
                            autocorrect="off"
                            autocapitalize="off"
                            spellcheck="false"
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
            document.querySelector('.quickbox__new-submit').disabled = true;
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
            )
                .then((response) => {
                    return response;
                })
                .catch((error) => {
                    return error;
                })
                .then((response) => {
                    document.querySelector('.quickbox__new-submit').disabled = false;
                    if (response.success === true) {
                        Swal.fire({
                            text: 'successfully created new ticket',
                            icon: 'success',
                            timer: 2000,
                            timerProgressBar: true,
                            showConfirmButton: false,
                        });
                        document.querySelector('.quickbox__new-form').reset();
                        document.querySelector('.quickbox__navitem[href="#today"]').click();
                    } else {
                        Swal.fire({
                            text: 'error creating new ticket',
                            icon: 'error',
                            timer: 2000,
                            timerProgressBar: true,
                            showConfirmButton: false,
                        });
                    }
                });
            e.preventDefault();
        });
    }

    static proposeNewDate() {
        /* calculate next monday */
        let proposedDate = new Date();
        proposedDate.setDate(proposedDate.getDate() + ((1 + 7 - proposedDate.getDay()) % 7));
        proposedDate = Dates.dateFormat(proposedDate, 'd.m.y');
        proposedDate += ' 09:00-11:00';
        return proposedDate;
    }
}

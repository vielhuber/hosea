import hlp from 'hlp';
export default class Store {
    static data = {};

    static initStore() {
        Store.data = {
            busy: false,
            api: null,
            user: null,
            tickets: null,
            mails: null,
            weather: null,

            hourBegin: 9,
            shiftingView: !hlp.isMobile() ? false : false,
            shiftingViewPrevDays: !hlp.isMobile() ? 0 : 0,
            weeksInViewport: !hlp.isMobile() ? 3 : 1,

            cols: ['status', 'priority', 'date', 'time', 'project', 'description'],
            colors: {
                status: {
                    idle: {
                        border: '#4527a0',
                    },
                    allday: {
                        border: '#868686',
                        opacity: 0.75,
                    },
                    roaming: {
                        border: '#ba68c8',
                    },
                    fixed: {
                        border: '#2196F3',
                    },
                    done: {
                        border: '#FFB300',
                    },
                    billed: {
                        border: '#4CAF50',
                    },
                    recurring: {
                        border: '#E91E63',
                    },
                    working: {
                        border: '#F44336',
                    },
                    scheduled: {
                        border: '#9E9E9E',
                    },
                },
                project: {
                    '🎂GEBURTSTAG🎂': {
                        border: '#ba68c8',
                        background: 'linear-gradient(178deg, #cb60b3 0%, #c146a1 50%, #a80077 51%, #db36a4 100%)',
                        animation: 'glow-animation-1 1s ease-in-out infinite alternate',
                    },
                    '❗*❗': {
                        animation: 'glow-animation-2 1s ease-in-out infinite alternate',
                    },
                    MAIL: {
                        opacity: 0.75,
                    },
                },
            },
            session: {
                activeDay: new Date(),
            },
        };
    }
}

window.Store = Store;

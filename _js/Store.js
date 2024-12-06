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
            shiftingView: true,
            shiftingDays: 21,
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
                    Geburtstag: {
                        border: '#ba68c8',
                        background: 'linear-gradient(178deg, #cb60b3 0%, #c146a1 50%, #a80077 51%, #db36a4 100%)',
                        animation: 'birthday-glow 1s ease-in-out infinite alternate',
                    },
                    mail: {
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

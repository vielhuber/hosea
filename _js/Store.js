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
                },
                project: {
                    Geburtstag: {
                        border: '#ba68c8',
                        background: 'linear-gradient(178deg, #cb60b3 0%, #c146a1 50%, #a80077 51%, #db36a4 100%)',
                    },
                    Olga: {
                        opacity: 0.75,
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

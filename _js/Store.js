export default class Store {
    static data = {};

    static initStore() {
        Store.data = {
            api: null,
            user: null,
            tickets: null,
            cols: ['status', 'priority', 'date', 'time', 'project', 'description'],
            colors: {
                status: {
                    idle: '#4527a0',
                    allday: '#868686',
                    roaming: '#ba68c8',
                    fixed: '#2196F3',
                    done: '#FFB300',
                    billed: '#4CAF50',
                    recurring: '#E91E63',
                    working: '#F44336'
                },
                project: {
                    Geburtstag: {
                        border: '#ba68c8',
                        background:
                            'linear-gradient(178deg, #cb60b3 0%, #c146a1 50%, #a80077 51%, #db36a4 100%)'
                    }
                }
            },
            session: {
                activeDay: new Date()
            }
        };
    }
}

window.Store = Store;

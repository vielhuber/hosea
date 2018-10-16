export default class Store {
    static data = {};

    static initStore() {
        Store.data = {
            api: null,
            tickets: null,
            cols: ['status', 'priority', 'date', 'time', 'project', 'description'],
            colors: {
                idle: '#2196F3',
                done: '#FFC107',
                billed: '#4CAF50',
                recurring: '#E91E63',
                working: '#F44336'
            },
            session: {
                activeDay: new Date()
            }
        };
    }
}

window.Store = Store;

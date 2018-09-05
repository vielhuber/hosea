export default class Store {
    static data = {};

    static initStore() {
        Store.data = {
            api: null,
            tickets: null,
            cols: [
                'status',
                'priority',
                'date',
                'time',
                'project',
                'description'
            ],
            colors: {
                idle: '#b3e5fc',
                done: '#fff59d',
                billed: '#81c784',
                recurring: '#ffeded',
                working: '#ef9a9a',
                delegated: '#ce93d8',
                weekend: '#bbdefb',
                big: '#e1bee7',
                windows: '#42A5F5',
                mac: '#8D6E63',
                linux: '#9CCC65'
            },
            session: {
                activeDay: new Date()
            }
        };
    }
}

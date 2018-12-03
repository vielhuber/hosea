import Store from './Store';

export default class User {
    static fetchUser() {
        return new Promise((resolve, reject) => {
            Store.data.api
                .fetch('_api/users', {
                    method: 'GET',
                    cache: 'no-cache',
                    headers: { 'content-type': 'application/json' }
                })
                .then(res => res.json())
                .catch(err => {
                    reject(err);
                })
                .then(response => {
                    Store.data.user = response.data;
                    resolve();
                });
        });
    }
}

import Store from './Store';
import jwtbutler from 'jwtbutler';

export default class Auth {
    static login() {
        Store.data.api = new jwtbutler({
            auth_server: '/_auth'
        });
        return Store.data.api.login();
    }
    static logout() {
        return Store.data.api.logout();
    }
}

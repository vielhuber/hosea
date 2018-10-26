import Tickets from './Tickets';
import Auth from './Auth';

export default class Footer {
    static blockStatusUpdate = false;
    static showTime = 3500;

    static initStatus() {
        if (document.querySelector('.footer__status') === null) {
            return;
        }
        if (Footer.blockStatusUpdate === false) {
            let d =
                ('0' + new Date().getDate()).slice(-2) +
                '.' +
                ('0' + (new Date().getMonth() + 1)).slice(-2) +
                '.' +
                new Date()
                    .getFullYear()
                    .toString()
                    .substring(2, 4) +
                ' ' +
                ('0' + new Date().getHours()).slice(-2) +
                ':' +
                ('0' + new Date().getMinutes()).slice(-2) +
                ':' +
                ('0' + new Date().getSeconds()).slice(-2);
            document.querySelector('.footer__status').textContent = d;
        }
        setTimeout(Footer.initStatus, 1000);
    }
    static updateStatus(status) {
        document.querySelector('.footer__status').textContent = status;
        Footer.blockStatusUpdate = true;
        setTimeout(() => {
            Footer.blockStatusUpdate = false;
        }, Footer.showTime);
    }
    static bindSave() {
        document.querySelector('.footer').addEventListener('click', e => {
            if (e.target.closest('.footer__save')) {
                Footer.updateStatus('saving...');
                Tickets.saveTickets()
                    .then(() => {
                        Footer.updateStatus('saved!');
                    })
                    .catch(error => {
                        Footer.updateStatus(error);
                    });
                e.preventDefault();
            }
        });
    }
    static bindCreate() {
        document.querySelector('.footer').addEventListener('click', e => {
            if (e.target.closest('.footer__create')) {
                Tickets.prepareCreation();
                e.preventDefault();
            }
        });
    }
    static bindLogout() {
        document.querySelector('.footer').addEventListener('click', e => {
            if (e.target.closest('.footer__logout')) {
                Auth.logout()
                    .then(() => {
                        // we simply overcome the issue of deleting event listeners on document by simply refreshing the app
                        location.reload();
                    })
                    .catch(error => {
                        console.error(error);
                    });
                e.preventDefault();
            }
        });
    }
}

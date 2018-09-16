import Tickets from './Tickets';

export default class Footer {
    static blockStatusUpdate = false;
    static showTime = 3000;

    static initStatus() {
        if (Footer.blockStatusUpdate === false) {
            let d =
                new Date().getFullYear() +
                '-' +
                ('0' + (new Date().getMonth() + 1)).slice(-2) +
                '-' +
                ('0' + new Date().getDate()).slice(-2) +
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
            let button = e.target.closest('.footer__save');
            if (button) {
                Footer.updateStatus('saving...');
                Tickets.saveTickets()
                    .then(() => {
                        Footer.updateStatus('saved!');
                    })
                    .catch(error => {
                        console.error(error);
                    });
                e.preventDefault();
            }
        });
    }
}

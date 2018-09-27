export default class Lock {
    static lockTicket(ticket_id) {
        document.querySelector('.tickets__entry[data-id="' + ticket_id + '"]').classList.add('tickets__entry--locked');
        document
            .querySelector('.tickets__entry[data-id="' + ticket_id + '"]')
            .querySelectorAll('input, textarea')
            .forEach(el => {
                // renable this if https://stackoverflow.com/questions/52546266/textarea-white-space-nowrap-in-combination-with-readonly is solved
                //el.setAttribute('disabled', 'disabled');
                //el.setAttribute('readonly', 'readonly');
            });
    }

    static unlockTicket(ticket_id, leave_changed = false) {
        if (leave_changed === false) {
            document.querySelector('.tickets__entry[data-id="' + ticket_id + '"]').classList.remove('tickets__entry--changed');
        }
        document.querySelector('.tickets__entry[data-id="' + ticket_id + '"]').classList.remove('tickets__entry--locked');
        document
            .querySelector('.tickets__entry[data-id="' + ticket_id + '"]')
            .querySelectorAll('input, textarea')
            .forEach(el => {
                el.removeAttribute('disabled');
                el.removeAttribute('readonly');
            });
    }

    static ticketIsLocked(ticket_id) {
        if (document.querySelector('.tickets__entry[data-id="' + ticket_id + '"] .tickets__entry--locked') !== null) {
            return true;
        }
        return false;
    }
}

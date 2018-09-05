export default class Lock {
    static lockTicket(ticket_id) {
        document
            .querySelector('.ticket_entry[data-id="' + ticket_id + '"]')
            .classList.add('ticket_entry--locked');
        document
            .querySelector('.ticket_entry[data-id="' + ticket_id + '"]')
            .querySelectorAll('input, textarea')
            .forEach(el => {
                el.setAttribute('disabled', 'disabled');
                el.setAttribute('readonly', 'readonly');
            });
    }

    static unlockTicket(ticket_id, leave_changed = false) {
        if (leave_changed === false) {
            document
                .querySelector('.ticket_entry[data-id="' + ticket_id + '"]')
                .classList.remove('ticket_entry--changed');
        }
        document
            .querySelector('.ticket_entry[data-id="' + ticket_id + '"]')
            .classList.remove('ticket_entry--locked');
        document
            .querySelector('.ticket_entry[data-id="' + ticket_id + '"]')
            .querySelectorAll('input, textarea')
            .forEach(el => {
                el.removeAttribute('disabled');
                el.removeAttribute('readonly');
            });
    }

    static ticketIsLocked(ticket_id) {
        if (
            document.querySelector(
                '.ticket_entry[data-id="' +
                    ticket_id +
                    '"] .ticket_entry--locked'
            ) !== null
        ) {
            return true;
        }
        return false;
    }
}

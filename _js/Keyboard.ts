import Filter from './Filter';
import Helper from './Helper';

export default class Keyboard {
    static initKeyboardNavigation() {
        Keyboard.initKeyboardNavigationTickets();
        Keyboard.initKeyboardNavigationScheduler();
    }

    static initKeyboardNavigationTickets() {
        // one more keyboard event is needed (so that jumps are not too early)
        // therefore we save the previous cursor pointer here
        let selectionEndBefore = 1;
        document.querySelector('.tickets').addEventListener('keyup', (e: KeyboardEvent) => {
            const target = e.target as HTMLInputElement;
            if (
                !target ||
                (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') ||
                target.closest('.metabar') !== null
            ) {
                return;
            }
            let left = target.closest('td').previousElementSibling,
                right = target.closest('td').nextElementSibling,
                top = Helper.prevAll(target.closest('tr'), '.tickets__entry--visible')[0],
                down = Helper.nextAll(target.closest('tr'), '.tickets__entry--visible')[0],
                index = Helper.prevAll(target.closest('td')).length + 1;

            // arrow right (switch)
            if (
                e.keyCode === 39 &&
                right !== null &&
                target.selectionEnd >= target.value.length &&
                selectionEndBefore >= target.value.length
            ) {
                right.querySelector('input, textarea').select();
                selectionEndBefore = 1;
                e.preventDefault();
            }
            // arrow left (switch)
            else if (e.keyCode === 37 && left !== null && target.selectionEnd <= 0 && selectionEndBefore <= 0) {
                left.querySelector('input, textarea').select();
                selectionEndBefore = 1;
                e.preventDefault();
            }
            // arrow top (switch)
            else if (e.keyCode === 38 && top !== undefined && target.selectionEnd <= 0 && selectionEndBefore <= 0) {
                top.querySelector('td:nth-child(' + index + ')')
                    .querySelector('input, textarea')
                    .select();
                selectionEndBefore = 1;
                e.preventDefault();
            }
            // arrow down (switch)
            else if (
                e.keyCode === 40 &&
                down !== undefined &&
                target.selectionEnd >= target.value.length &&
                selectionEndBefore >= target.value.length
            ) {
                down.querySelector('td:nth-child(' + index + ')')
                    .querySelector('input, textarea')
                    .select();
                selectionEndBefore = 1;
                e.preventDefault();
            } else {
                selectionEndBefore = target.selectionEnd;
            }
        });
    }

    static initKeyboardNavigationScheduler() {
        document.addEventListener('keydown', e => {
            if (e.target !== document.body) {
                return;
            }
            let assignedKeys = {
                37: 'prev-day', // arrow left
                39: 'next-day', // arrow right
                33: 'prev-week', // page up
                34: 'next-week' // page down
            };
            if (Object.keys(assignedKeys).includes(e.keyCode.toString())) {
                document.querySelector('.scheduler__navigation-button--' + assignedKeys[e.keyCode]).click();
                e.preventDefault();
            }
        });
    }

    static bindRefresh() {
        // f5...
        document.addEventListener('keydown', async e => {
            if (e.keyCode === 116) {
                e.preventDefault();
                await Filter.doFilter();
            }
        });
    }
}

import Filter from './Filter';
import Helper from './Helper';

export default class Keyboard {
    static initKeyboardNavigation() {
        document.querySelector('.tickets').addEventListener('keyup', e => {
            if (
                !e.target ||
                (e.target.tagName !== 'INPUT' &&
                    e.target.tagName !== 'TEXTAREA')
            ) {
                return;
            }
            let left = e.target.closest('td').previousElementSibling,
                right = e.target.closest('td').nextElementSibling,
                top = Helper.prevAll(
                    e.target.closest('tr'),
                    '.tickets__entry--visible'
                )[0],
                down = Helper.nextAll(
                    e.target.closest('tr'),
                    '.tickets__entry--visible'
                )[0],
                index = Helper.prevAll(e.target.closest('td')).length + 1;

            // arrow right (switch)
            if (
                e.keyCode === 39 &&
                right !== null &&
                e.target.selectionEnd >= e.target.value.length
            ) {
                right.querySelector('input, textarea').select();
                e.preventDefault();
            }
            // arrow left (switch)
            else if (
                e.keyCode === 37 &&
                left !== null &&
                e.target.selectionEnd <= 0
            ) {
                left.querySelector('input, textarea').select();
                e.preventDefault();
            }
            // arrow top (switch)
            else if (
                e.keyCode === 38 &&
                top !== undefined &&
                e.target.selectionEnd <= 0
            ) {
                top.querySelector('td:nth-child(' + index + ')')
                    .querySelector('input, textarea')
                    .select();
                e.preventDefault();
            }
            // arrow down (switch)
            else if (
                e.keyCode === 40 &&
                down !== undefined &&
                e.target.selectionEnd >= e.target.value.length
            ) {
                down.querySelector('td:nth-child(' + index + ')')
                    .querySelector('input, textarea')
                    .select();
                e.preventDefault();
            }
        });
    }

    static bindRefresh() {
        // f5
        document.addEventListener('keydown', event => {
            if (event.keyCode === 116) {
                Filter.doFilter();
                event.preventDefault();
            }
        });
    }
}

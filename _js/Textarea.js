import Helper from './Helper';

export default class Textarea {
    static textareaAutoHeight() {
        let debounce = Helper.debounce(e => {
            Textarea.textareaSetHeight(e.target);
        }, 100);
        document.querySelector('.tickets .tickets__table-body').addEventListener('input', e => {
            if (e.target && e.target.tagName === 'TEXTAREA') {
                /* immediately change height if enter is pressed */
                if (e.inputType === 'insertLineBreak') {
                    Textarea.textareaSetHeight(e.target);
                } else {
                    /* otherwise debounce */
                    debounce(e);
                }
            }
        });
    }

    static textareaSetVisibleHeights() {
        document
            .querySelector('.tickets .tickets__table-body')
            .querySelectorAll('.tickets__entry--visible textarea')
            .forEach((el, index) => {
                Textarea.textareaSetHeight(el);
            });
    }

    static textareaSetHeight(el) {
        let min = 3,
            max = 10,
            cur = (el.value.match(/\n/g) || []).length + 1;
        if (cur < min) {
            cur = min;
        } else if (cur > max) {
            cur = max;
        }
        el.style.height = 15 * cur + 'rem';
    }
}

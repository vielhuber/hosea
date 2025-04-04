import Helper from './Helper';

export default class Textarea {
    static textareaAutoHeight() {
        let debounce = Helper.debounce((e) => {
            Textarea.textareaSetHeight(e.target);
        }, 100);
        document.querySelector('.tickets .tickets__table-body').addEventListener('input', (e) => {
            if (e.target && e.target.tagName === 'TEXTAREA' && e.target.classList.contains('autoheight')) {
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
            .querySelectorAll('.tickets__entry--visible .autoheight')
            .forEach((el, index) => {
                Textarea.textareaSetHeight(el);
            });
    }

    static textareaGetLines(el) {
        let min = 3,
            max = 7,
            cur = (el.value.match(/\n/g) || []).length + 1;
        if (cur < min) {
            cur = min;
        } else if (cur > max) {
            cur = max;
        }
        return cur;
    }

    static textareaSetHeight(el) {
        // determine max height
        let maxLines = 0,
            parent = el.parentNode;
        [...parent.parentNode.children].forEach((i) => {
            if (i.querySelector('textarea') !== null) {
                let thisLines = Textarea.textareaGetLines(i.querySelector('textarea'));
                if (maxLines <= thisLines) {
                    maxLines = thisLines;
                }
            }
        });
        [...parent.parentNode.children].forEach((i) => {
            if (i.querySelector('textarea') !== null) {
                i.querySelector('textarea').style.height = 15 * maxLines + 'rem';
            }
        });
    }
}

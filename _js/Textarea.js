export default class Textarea {
    static textareaAutoHeight() {
        document.addEventListener('keyup', e => {
            if (e.target && e.target.tagName === 'TEXTAREA') {
                Textarea.textareaSetHeight(e.target);
            }
        });
        document
            .querySelector('.tickets .tickets__table-body')
            .querySelectorAll('.tickets__entry textarea')
            .forEach((el, index) => {
                el.addEventListener('focus', e => {
                    Textarea.textareaSetHeight(e.target);
                });
                el.addEventListener('blur', e => {
                    e.target.style.height = '15rem';
                });
            });
    }

    static textareaSetHeight(el) {
        //el.style.height = '5px';
        el.style.height = el.scrollHeight + 'px';
    }

    static textareaSetVisibleHeights() {
        document
            .querySelector('.tickets .tickets__table-body')
            .querySelectorAll('.tickets__entry--visible textarea')
            .forEach((el, index) => {
                setTimeout(() => {
                    Textarea.textareaSetHeight(el);
                }, Math.floor(index / 100) * index);
            });
    }
}

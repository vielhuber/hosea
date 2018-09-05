export default class Textarea {
    static textareaAutoHeight() {
        document.addEventListener('keyup', e => {
            if (e.target && e.target.tagName === 'TEXTAREA') {
                Textarea.textareaSetHeight(e.target);
            }
        });
    }

    static textareaSetHeight(el) {
        el.style.height = '5px';
        el.style.height = el.scrollHeight + 'px';
    }

    static textareaSetVisibleHeights() {
        document
            .querySelectorAll('.ticket_entry--visible textarea')
            .forEach(el => {
                Textarea.textareaSetHeight(el);
            });
    }
}

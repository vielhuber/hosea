import Helper from './Helper';

export default class Textarea {
    static textareaAutoHeight() {
        /*
        document
            .querySelector('.tickets .tickets__table-body')
            .querySelectorAll('.tickets__entry textarea')
            .forEach((el, index) => {
                el.addEventListener(
                    'input',
                    Helper.debounce(() => {
                        console.log('BAR');
                        Textarea.textareaSetHeight(el);
                    }, 1000)
                );
            });
        */

        /*
        document.querySelector('.tickets .tickets__table-body').addEventListener(
            'input',
            Helper.debounce(e => {
                console.log(e);
                if (e.target && e.target.tagName === 'TEXTAREA') {
                    Textarea.textareaSetHeight(e.target);
                }
            }, 1000)
        );
        */

        document.querySelector('.tickets .tickets__table-body').addEventListener(
            'input',
            Helper.debounce(e => {
                if (e.target && e.target.tagName === 'TEXTAREA') {
                    Textarea.textareaSetHeight(e.target);
                }
            }, 100)
        );

        /*
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
        */
    }

    static textareaSetHeight(el) {
        //console.log('set textarea height');
        el.style.height = 15 * ((el.value.match(/\n/g) || []).length + 1) + 'rem';
        /*
        //el.style.height = '5px';
        setTimeout(() => {
            el.style.height = el.scrollHeight + 'px';
        }, 1000);
        */
    }

    static textareaSetVisibleHeights() {
        document
            .querySelector('.tickets .tickets__table-body')
            .querySelectorAll('.tickets__entry--visible textarea')
            .forEach((el, index) => {
                Textarea.textareaSetHeight(el);
                /*
                setTimeout(() => {
                    Textarea.textareaSetHeight(el);
                }, Math.floor(index / 100) * index);
                */
            });
    }
}

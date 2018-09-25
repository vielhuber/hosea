export default class Helper {
    static prevAll(el, selector = null) {
        let prev = true;
        return [].filter
            .call(el.parentNode.children, htmlElement => {
                if (htmlElement === el) {
                    prev = false;
                    return false;
                }
                if (selector !== null && !htmlElement.classList.contains(selector.replace('.', ''))) {
                    return false;
                }
                return prev;
            })
            .reverse();
    }

    static nextAll(el, selector = null) {
        let next = false;
        return [].filter.call(el.parentNode.children, htmlElement => {
            if (htmlElement === el) {
                next = true;
                return false;
            }
            if (selector !== null && !htmlElement.classList.contains(selector.replace('.', ''))) {
                return false;
            }
            return next;
        });
    }

    static isObject(obj) {
        return obj !== null && typeof obj === 'object';
    }

    static fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }

    static debounce(func, wait, immediate) {
        let timeout;
        return () => {
            let context = this,
                args = arguments,
                later = () => {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                },
                callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) {
                func.apply(context, args);
            }
        };
    }
}

export default class Helper {
    static isProduction() {
        return window.location.hostname.indexOf('.dev') === -1 && window.location.hostname.indexOf('.test') === -1;
    }

    static prevAll(el, selector = null) {
        let prev = true;
        return [].filter
            .call(el.parentNode.children, (htmlElement) => {
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
        return [].filter.call(el.parentNode.children, (htmlElement) => {
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

    static isInteger(value) {
        return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
    }

    static fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = (error) => reject(error);
        });
    }

    static debounce(func, wait, immediate) {
        var timeout;
        return function () {
            var context = this,
                args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }
}

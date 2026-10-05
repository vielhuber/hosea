import Helper from './Helper';

export default class Textarea {
    static textareaSelectAtPoint($field: HTMLTextAreaElement, event: MouseEvent, anchor?: number): number | null {
        let bounds = $field.getBoundingClientRect();
        let left = bounds.left + $field.clientLeft;
        let top = bounds.top + $field.clientTop;
        let right = left + $field.clientWidth - 1;
        if (
            anchor === undefined &&
            event.target === $field &&
            $field.scrollHeight > $field.clientHeight &&
            event.clientX > right
        ) {
            return null;
        }
        let lineHeight = parseFloat(getComputedStyle($field).lineHeight);
        // Mac/Linux hit-testing drops the horizontal position below the last text line.
        let lastLine = top + lineHeight * ($field.value.split('\n').length - 0.5) - $field.scrollTop;
        let position = document.caretPositionFromPoint?.(
            Math.max(left + 1, Math.min(event.clientX, right)),
            Math.max(top + 1, Math.min(event.clientY, lastLine, top + $field.clientHeight - 1))
        );
        if (position?.offsetNode !== $field) {
            return null;
        }
        if (anchor === undefined && event.detail === 2) {
            let nativePosition = document.caretPositionFromPoint(event.clientX, event.clientY);
            if (nativePosition?.offsetNode === $field && nativePosition.offset === position.offset) {
                return null;
            }
            event.preventDefault();
            $field.setSelectionRange(position.offset, position.offset);
            $field.focus();
            // Word navigation skips whitespace, unlike native double-click selection.
            if (/[^\S\n]/.test($field.value[position.offset] ?? '')) {
                $field.setSelectionRange(
                    position.offset - $field.value.slice(0, position.offset).match(/[^\S\n]*$/)[0].length,
                    position.offset + $field.value.slice(position.offset).match(/^[^\S\n]*/)[0].length
                );
                return null;
            }
            let selection = document.getSelection();
            selection.modify('move', 'forward', 'word');
            selection.modify('extend', 'backward', 'word');
            return null;
        }
        anchor ??=
            event.shiftKey && document.activeElement === $field
                ? $field.selectionDirection === 'backward'
                    ? $field.selectionEnd
                    : $field.selectionStart
                : position.offset;
        event.preventDefault();
        $field.setSelectionRange(
            Math.min(anchor, position.offset),
            Math.max(anchor, position.offset),
            position.offset < anchor ? 'backward' : 'forward'
        );
        $field.focus();
        return anchor;
    }

    static textareaAutoHeight() {
        let debounce: any = Helper.debounce((e: InputEvent) => {
            Textarea.textareaSetHeight(e.target);
        }, 100);
        document.querySelector('.tickets .tickets__table-body').addEventListener('input', e => {
            const target = e.target as Element;
            if (target && target.tagName === 'TEXTAREA' && target.classList.contains('autoheight')) {
                /* immediately change height if enter is pressed */
                if ((e as InputEvent).inputType === 'insertLineBreak') {
                    Textarea.textareaSetHeight(target);
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
        [...parent.parentNode.children].forEach(i => {
            if (i.querySelector('textarea') !== null) {
                let thisLines = Textarea.textareaGetLines(i.querySelector('textarea'));
                if (maxLines <= thisLines) {
                    maxLines = thisLines;
                }
            }
        });
        [...parent.parentNode.children].forEach(i => {
            if (i.querySelector('textarea') !== null) {
                i.querySelector('textarea').style.height = 15 * maxLines + 'rem';
            }
        });
    }
}

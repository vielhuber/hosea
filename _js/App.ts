import Auth from './Auth';
import Attachments from './Attachments';
import Footer from './Footer';
import Filter from './Filter';
import Html from './Html';
import Keyboard from './Keyboard';
import Scheduler from './Scheduler';
import Quickbox from './Quickbox';
import Sort from './Sort';
import Store from './Store';
import Textarea from './Textarea';
import Tickets from './Tickets';
import User from './User';
import Weather from './Weather';

export default class App {
    static async init() {
        Store.initStore();
        Html.updateTitle();
        await Auth.login();
        await User.fetchUser();
        Html.buildHtml();
        await Tickets.fetchAndRenderTickets();
        await Weather.fetchWeather();
        Tickets.fetchAndRenderTicketsInterval();
        Keyboard.initKeyboardNavigation();
        await Scheduler.initScheduler();
        // currently disabled, because we use both columns independently
        //Tickets.bindAutoTime();
        Tickets.bindChangeTracking();
        document.querySelector('.tickets__table-body').addEventListener('click', e => {
            let $cell = (e.target as HTMLElement).closest('.tickets__table-cell');
            $cell?.querySelector<HTMLTextAreaElement>('.tickets__textarea--date')?.focus();
        });
        let dateSelection: { $field: HTMLTextAreaElement; anchor: number; event: MouseEvent } | null = null;
        let dateSelectionFrame = 0;
        let updateDateSelection = () => {
            if (dateSelection === null) {
                return;
            }
            let { $field, anchor, event } = dateSelection;
            let bounds = $field.getBoundingClientRect();
            let scrollLeft = $field.scrollLeft;
            let scrollTop = $field.scrollTop;
            $field.scrollLeft += Math.min(0, event.clientX - bounds.left) + Math.max(0, event.clientX - bounds.right);
            $field.scrollTop += Math.min(0, event.clientY - bounds.top) + Math.max(0, event.clientY - bounds.bottom);
            Textarea.textareaSelectAtPoint($field, event, anchor);
            if ($field.scrollLeft !== scrollLeft || $field.scrollTop !== scrollTop) {
                dateSelectionFrame = requestAnimationFrame(updateDateSelection);
            }
        };
        document.querySelector('.tickets__table-body').addEventListener('mousedown', event => {
            dateSelection = null;
            cancelAnimationFrame(dateSelectionFrame);
            if (event.button !== 0 || event.detail !== 1) {
                return;
            }
            let $field = (event.target as HTMLElement)
                .closest('.tickets__table-cell')
                ?.querySelector<HTMLTextAreaElement>('.tickets__textarea--date');
            if (!$field) {
                return;
            }
            let anchor = Textarea.textareaSelectAtPoint($field, event);
            if (anchor !== null) {
                dateSelection = { $field, anchor, event };
            }
        });
        document.addEventListener('mousemove', event => {
            if (dateSelection === null || (event.buttons & 1) === 0) {
                return;
            }
            dateSelection.event = event;
            cancelAnimationFrame(dateSelectionFrame);
            updateDateSelection();
        });
        ['mouseup', 'blur'].forEach(eventType => {
            window.addEventListener(eventType, () => {
                dateSelection = null;
                cancelAnimationFrame(dateSelectionFrame);
            });
        });
        Html.bindAutoCaps();
        Html.bindValidation();
        Attachments.bindUpload();
        Attachments.bindDownload();
        Attachments.bindDeleteAttachment();
        Tickets.bindDelete();
        Tickets.bindSave();
        Footer.bindSave();
        Footer.bindCreate();
        Footer.bindView();
        Footer.bindBulk();
        Footer.bindLogout();
        Footer.linkApiKey();
        Footer.initStatus();
        Keyboard.bindRefresh();
        Tickets.bindCreate();
        Scheduler.bindScheduler();
        Scheduler.indicatorInterval();
        Sort.initSort();
        await Filter.initFilter();
        Scheduler.updateColors();
        Tickets.updateSum();
        Textarea.textareaAutoHeight();
        Quickbox.initQuickbox();
        Quickbox.bindQuickbox();
    }
}

import Auth from './Auth';
import Attachments from './Attachments';
import Filter from './Filter';
import Html from './Html';
import Keyboard from './Keyboard';
import Scheduler from './Scheduler';
import Sort from './Sort';
import Store from './Store';
import Textarea from './Textarea';
import Tickets from './Tickets';
import Footer from './Footer';

export default class App {
    static async init() {
        Store.initStore();
        await Auth.login();
        await Tickets.fetchTickets();
        Html.buildHtml();
        Keyboard.initKeyboardNavigation();
        Scheduler.initScheduler();
        Tickets.bindAutoTime();
        Tickets.bindChangeTracking();
        Attachments.bindUpload();
        Attachments.bindDownload();
        Attachments.bindDeleteAttachment();
        Tickets.bindDelete();
        Tickets.bindSave();
        Footer.bindSave();
        Footer.bindLogout();
        Footer.initStatus();
        Keyboard.bindRefresh();
        Tickets.bindCreate();
        Scheduler.bindScheduler();
        Sort.initSort();
        Filter.initFilter();
        Scheduler.updateColors();
        Tickets.updateSum();
        Textarea.textareaAutoHeight();
    }
}
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
        await Auth.login();
        await User.fetchUser();
        Html.buildHtml();
        await Tickets.fetchAndRenderTickets();
        await Weather.fetchWeather();
        Tickets.fetchAndRenderTicketsInterval();
        Keyboard.initKeyboardNavigation();
        Scheduler.initScheduler();
        Quickbox.initQuickbox();
        Quickbox.bindQuickbox();
        // currently disabled, because we use both columns independently
        //Tickets.bindAutoTime();
        Tickets.bindChangeTracking();
        Tickets.bindValidation();
        Attachments.bindUpload();
        Attachments.bindDownload();
        Attachments.bindDeleteAttachment();
        Tickets.bindDelete();
        Tickets.bindSave();
        Footer.bindSave();
        Footer.bindCreate();
        Footer.bindLogout();
        Footer.linkApiKey();
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

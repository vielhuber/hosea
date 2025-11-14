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
        await Scheduler.initScheduler();
        // currently disabled, because we use both columns independently
        //Tickets.bindAutoTime();
        Tickets.bindChangeTracking();
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
        Footer.bindLogout();
        Footer.linkApiKey();
        Footer.initStatus();
        Keyboard.bindRefresh();
        Tickets.bindCreate();
        Scheduler.bindScheduler();
        Scheduler.indicatorInterval();
        Sort.initSort();
        Filter.initFilter();
        Scheduler.updateColors();
        Tickets.updateSum();
        Textarea.textareaAutoHeight();
        Quickbox.initQuickbox();
        Quickbox.bindQuickbox();
    }
}

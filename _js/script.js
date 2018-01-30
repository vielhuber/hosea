import Helpers from './_helpers';
import App from './_app';

document.addEventListener('DOMContentLoaded', function()
{
    const app = new App();
    app.init();
    /* make publically available to run from outside for debugging purposes */
    window.app = app;
});

window.onload = function()
{    

}
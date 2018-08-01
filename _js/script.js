import App from './_app';

document.addEventListener('DOMContentLoaded', () =>
{
    const app = new App();
    app.init();
    window.app = app;
});
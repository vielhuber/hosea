import Store from './Store';
import Dates from './Dates';

export default class Weather {
    static fetchWeather() {
        return new Promise((resolve, reject) => {
            Store.data.busy = true;
            Store.data.api
                .fetch('_api/weather', {
                    method: 'GET',
                    cache: 'no-cache',
                    headers: { 'content-type': 'application/json' },
                })
                .then((res) => res.json())
                .catch((err) => {
                    reject(err);
                })
                .then((response) => {
                    Store.data.busy = false;
                    Store.data.weather = response.data;
                    resolve();
                });
        });
    }
    static outputWeather(date) {
        if (!(Dates.dateFormat(date, 'Y-m-d') in Store.data.weather)) {
            return '';
        }
        let html = '',
            data = Store.data.weather[Dates.dateFormat(date, 'Y-m-d')];

        html += '🌡️' + data.temp + '°C☔' + data.rain + 'mm';
        return html;
    }
}

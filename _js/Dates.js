import Store from './Store';

export default class Dates {
    static getCurrentDate() {
        return new Date();
    }

    static getDayOfActiveWeek(shift) {
        return Dates.getDayOfWeek(shift, Store.data.session.activeDay);
    }

    static getDayOfWeek(shift, date) {
        let d = new Date(date),
            day = d.getDay(),
            diff = d.getDate() - day + (day == 0 ? -6 : 1) + (shift - 1);
        return new Date(d.setDate(diff));
    }

    static germanToEnglishString(str) {
        return '20' + str.substring(6, 8) + '-' + str.substring(3, 5) + '-' + str.substring(0, 2);
    }

    static dateFormat(d, format) {
        if (format === 'D d.m.') {
            return ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'][d.getDay()] + ' ' + ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.';
        }
        if (format === 'd. F Y') {
            return (
                ('0' + d.getDate()).slice(-2) +
                '. ' +
                ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][d.getMonth()] +
                ' ' +
                d.getFullYear()
            );
        }
        if (format === 'Y-m-d') {
            return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
        }
        if (format === 'd.m.Y') {
            return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + d.getFullYear();
        }
        if (format === 'd.m.') {
            return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.';
        }
        return (
            ('0' + d.getDate()).slice(-2) +
            '.' +
            ('0' + (d.getMonth() + 1)).slice(-2) +
            '.' +
            d.getFullYear() +
            ' ' +
            ('0' + d.getHours()).slice(-2) +
            ':' +
            ('0' + d.getMinutes()).slice(-2) +
            ':' +
            ('0' + d.getSeconds()).slice(-2)
        );
    }

    static dateIsInActiveWeek(d) {
        if (d === null || d === '') {
            return false;
        }
        d = new Date(d);
        return Dates.sameDay(Dates.getDayOfWeek(1, d), Dates.getDayOfActiveWeek(1));
    }

    static dateIsInFuture(d) {
        if (d === null || d === '') {
            return false;
        }
        let d1 = new Date(d),
            d2 = new Date();
        return d1 > d2;
    }

    static dateIsToday(d) {
        if (d === null || d === '') {
            return false;
        }
        let d1 = new Date(d),
            d2 = new Date();
        return d1.getDay() === d2.getDay() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
    }

    static dateIsInPast(d) {
        if (d === null || d === '') {
            return false;
        }
        let d1 = new Date(d),
            d2 = new Date();
        return d1 < d2;
    }

    static sameDay(d1, d2) {
        if (d1 === null || d1 === '') {
            return false;
        }
        d1 = new Date(d1);
        d2 = new Date(d2);
        return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    }

    static weekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        let dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        let yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    }

    static isDate(string) {
        return new Date(string) !== 'Invalid Date' && !isNaN(new Date(string));
    }

    static getDayFromString(string) {
        return { MO: 1, DI: 2, MI: 3, DO: 4, FR: 5, SA: 6, SO: 7 }[string];
    }

    static getStringFromDay(day) {
        return { 1: MO, 2: DI, 3: MI, 4: DO, 5: FR, 6: SA, 7: SO }[day];
    }
}

import Store from './Store';

export default class Dates {
    static getCurrentDate() {
        return new Date();
    }

    static getActiveDate() {
        return Store.data.session.activeDay;
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

    static parseDateString(string, view) {
        if (view !== 'tickets' && view !== 'scheduler') {
            return false;
        }
        if (string == '') {
            return [];
        }

        let ret = [],
            error = false,
            d;

        string.split('\n').forEach(string__value => {
            error = false;

            // 01.01.18
            // 01.01.18 09:00-10:00
            if (string__value.substring(2, 3) === '.' && string__value.substring(5, 6) === '.' && string__value.substring(6, 7).trim() != '') {
                d = new Date('20' + string__value.substring(6, 8) + '-' + string__value.substring(3, 5) + '-' + string__value.substring(0, 2));
                if ((view === 'tickets' && Dates.dateIsActiveDay(d)) || (view === 'scheduler' && Dates.dateIsInActiveWeek(d))) {
                    ret.push({
                        date: d,
                        day: ((d.getDay() + 6) % 7) + 1,
                        begin: string__value.length > 8 ? parseInt(string__value.substring(9, 11)) + parseInt(string__value.substring(12, 14)) / 60 : null,
                        end: string__value.length > 8 ? parseInt(string__value.substring(15, 17)) + parseInt(string__value.substring(18, 20)) / 60 : null
                    });
                }
            }

            // MO [-05.10.18 -12.10.18]
            // MO 10:00-11:00 [-05.10.18 -12.10.18]
            // MO#1 10:00-11:00 [-05.10.18 -12.10.18]
            else if (['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'].includes(string__value.substring(0, 2))) {
                d = Dates.getDayOfActiveWeek(Dates.getDayFromString(string__value.substring(0, 2)));
                if (Dates.dateIsExcluded(d, string__value)) {
                    return;
                }
                if (string__value.substring(2, 3) === '#' && Math.floor((d.getDate() - 1) / 7) + 1 != string__value.substring(3, 4)) {
                    return;
                }
                if ((view === 'tickets' && Dates.dateIsActiveDay(d) && !Dates.dateIsInPast(d)) || (view === 'scheduler' && Dates.dateIsInActiveWeek(d) && !Dates.dateIsInPast(d))) {
                    let begin = null,
                        end = null;
                    if (string__value.split(':').length === 3) {
                        let shift = string__value.indexOf(':') - 2;
                        begin = parseInt(string__value.substring(shift, shift + 2)) + parseInt(string__value.substring(shift + 3, shift + 5)) / 60;
                        end = parseInt(string__value.substring(shift + 6, shift + 8)) + parseInt(string__value.substring(shift + 9, shift + 11)) / 60;
                    }
                    ret.push({
                        date: d,
                        day: ((d.getDay() + 6) % 7) + 1,
                        begin: begin,
                        end: end
                    });
                }
            }

            // 01.01. [-05.10.18 -12.10.18]
            // 01.01. 09:00-10:00 [-05.10.18 -12.10.18]
            else if (string__value.substring(2, 3) === '.' && string__value.substring(5, 6) === '.' && string__value.substring(6, 7).trim() == '') {
                d = new Date(Dates.getActiveDate().getFullYear() + '-' + string__value.substring(3, 5) + '-' + string__value.substring(0, 2));
                if (Dates.dateIsExcluded(d, string__value)) {
                    return;
                }
                if ((view === 'tickets' && Dates.dateIsActiveDay(d)) || (view === 'scheduler' && Dates.dateIsInActiveWeek(d))) {
                    let begin = null,
                        end = null;
                    if (string__value.split(':').length === 3) {
                        let shift = string__value.indexOf(':') - 2;
                        begin = parseInt(string__value.substring(shift, shift + 2)) + parseInt(string__value.substring(shift + 3, shift + 5)) / 60;
                        end = parseInt(string__value.substring(shift + 6, shift + 8)) + parseInt(string__value.substring(shift + 9, shift + 11)) / 60;
                    }
                    ret.push({
                        date: d,
                        day: ((d.getDay() + 6) % 7) + 1,
                        begin: begin,
                        end: end
                    });
                }
            } else {
                error = true;
                return;
            }
        });

        if (error === true) {
            return false;
        }

        return ret;
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
        if (format === 'd.m.y') {
            return (
                ('0' + d.getDate()).slice(-2) +
                '.' +
                ('0' + (d.getMonth() + 1)).slice(-2) +
                '.' +
                d
                    .getFullYear()
                    .toString()
                    .substring(2, 4)
            );
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

    static dateIsActiveDay(d) {
        if (d === null || d === '') {
            return false;
        }
        d = new Date(d);
        return Dates.sameDay(d, Dates.getActiveDate());
    }

    static dateIsInFuture(d) {
        if (d === null || d === '') {
            return false;
        }
        let d1 = new Date(d),
            d2 = new Date();
        d1.setHours(0);
        d1.setMinutes(0);
        d1.setSeconds(0);
        d1.setMilliseconds(0);
        d2.setHours(0);
        d2.setMinutes(0);
        d2.setSeconds(0);
        d2.setMilliseconds(0);
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
        d1.setHours(0);
        d1.setMinutes(0);
        d1.setSeconds(0);
        d1.setMilliseconds(0);
        d2.setHours(0);
        d2.setMinutes(0);
        d2.setSeconds(0);
        d2.setMilliseconds(0);
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

    static dateIsExcluded(d, str) {
        let ret = false;
        str.split(' ').forEach(value => {
            if (value.indexOf('-') === 0) {
                if (Dates.sameDay(Dates.germanToEnglishString(value.substring(1)), d)) {
                    ret = true;
                }
            }
        });
        return ret;
    }
}

/* debug */
window.Dates = Dates;

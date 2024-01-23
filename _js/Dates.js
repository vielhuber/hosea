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

    static getDayOfCurrentWeek(shift) {
        return Dates.getDayOfWeek(shift, this.getCurrentDate());
    }

    static getDayOfWeek(shift, date) {
        let d = new Date(date),
            day = d.getDay(),
            diff = d.getDate() - day + (day == 0 ? -6 : 1) + (shift - 1);
        return new Date(d.setDate(diff));
    }

    static parseDateString(string, view) {
        if (!['tickets', 'scheduler', 'today', 'all'].includes(view)) {
            return false;
        }

        if (string == '') {
            return [];
        }

        let ret = [],
            error = false,
            d;

        string.split('\n').forEach((string__value) => {
            // 01.01.18
            // 01.01.18 09:00-10:00
            if (
                new RegExp('^[0-9][0-9].[0-9][0-9].[1-2][0-9]( [0-9][0-9]:[0-9][0-9]-[0-9][0-9]:[0-9][0-9])?$').test(
                    string__value
                )
            ) {
                d = new Date(
                    '20' +
                        string__value.substring(6, 8) +
                        '-' +
                        string__value.substring(3, 5) +
                        '-' +
                        string__value.substring(0, 2)
                );
                if (isNaN(d)) {
                    error = true;
                    return;
                }
                if (
                    (view === 'tickets' && Dates.dateIsActiveDay(d)) ||
                    (view === 'scheduler' && Dates.dateIsInActiveWeek(d)) ||
                    (view === 'today' && Dates.dateIsToday(d)) ||
                    view === 'all'
                ) {
                    let begin =
                            string__value.length > 8
                                ? parseInt(string__value.substring(9, 11)) +
                                  parseInt(string__value.substring(12, 14)) / 60
                                : null,
                        end =
                            string__value.length > 8
                                ? parseInt(string__value.substring(15, 17)) +
                                  parseInt(string__value.substring(18, 20)) / 60
                                : null;
                    if (end === 0) {
                        end = 24;
                    }
                    d.setHours(Math.floor(begin === null ? 0 : begin));
                    d.setMinutes(((begin === null ? 0 : begin) % 1) * 60);
                    d.setSeconds(0);
                    d.setMilliseconds(0);
                    ret.push({
                        date: d,
                        day: ((d.getDay() + 6) % 7) + 1,
                        begin: begin,
                        end: end,
                        time: end - begin,
                        minutes_left: this.dateDiffInMinutes(d, new Date()),
                    });
                }
            }

            // MO [-05.10.18 -12.10.18 >01.01.18 <01.01.19]
            // MO 10:00-11:00 [-05.10.18 -12.10.18 >01.01.18 <01.01.19]
            // MO#1 10:00-11:00 [-05.10.18 -12.10.18 >01.01.18 <01.01.19]
            // MO#12 10:00-11:00 [-05.10.18 -12.10.18 >01.01.18 <01.01.19]
            // MO~1 10:00-11:00 [-05.10.18 -12.10.18 >01.01.18 <01.01.19]
            // MO~12 10:00-11:00 [-05.10.18 -12.10.18 >01.01.18 <01.01.19]
            // MO%2 10:00-11:00 [-05.10.18 -12.10.18 >01.01.18 <01.01.19]
            else if (
                new RegExp(
                    '^(MO|DI|MI|DO|FR|SA|SO)((#|~|%)[1-9][0-9]?)?( [0-9][0-9]:[0-9][0-9]-[0-9][0-9]:[0-9][0-9])?( (-|>|<)[0-9][0-9].[0-9][0-9].[1-2][0-9])*$'
                ).test(string__value)
            ) {
                if (view === 'today') {
                    d = Dates.getDayOfCurrentWeek(Dates.getDayFromString(string__value.substring(0, 2)));
                } else {
                    d = Dates.getDayOfActiveWeek(Dates.getDayFromString(string__value.substring(0, 2)));
                }
                if (isNaN(d)) {
                    error = true;
                    return;
                }
                if (view !== 'all' && Dates.dateIsExcluded(d, string__value)) {
                    return;
                }

                if (view !== 'all' && string__value.substring(2, 3) === '#') {
                    let num = parseInt(string__value.substring(3, 5).trim()),
                        nthWeekdayOfMonth = this.nthWeekdayOfMonth(d);
                    if (num % 4 !== nthWeekdayOfMonth) {
                        return;
                    }
                    if ((d.getMonth() + 1) % (Math.floor((num - 1) / 4) + 1) !== 0) {
                        return;
                    }
                }

                if (view !== 'all' && string__value.substring(2, 3) === '~') {
                    let num = parseInt(string__value.substring(3, 5).trim()),
                        weekNumber = this.weekNumber(d);
                    if (num != weekNumber) {
                        return;
                    }
                }

                if (view !== 'all' && string__value.substring(2, 3) === '%') {
                    let num = parseInt(string__value.substring(3, 5).trim()),
                        weekNumber = this.weekNumber(d),
                        match = string__value.match(/>([0-9][0-9]\.[0-9][0-9]\.[0-9][0-9])/i);
                    if (match) {
                        weekNumber -= this.weekNumber(new Date(Dates.germanToEnglishString(match[1])));
                    }
                    if (weekNumber % num !== 0) {
                        return;
                    }
                }

                if (
                    (view === 'tickets' && Dates.dateIsActiveDay(d)) ||
                    (view === 'scheduler' && Dates.dateIsInActiveWeek(d)) ||
                    (view === 'today' && Dates.dateIsToday(d)) ||
                    view === 'all'
                ) {
                    let begin = null,
                        end = null;
                    if (string__value.split(':').length === 3) {
                        let shift = string__value.indexOf(':') - 2;
                        begin =
                            parseInt(string__value.substring(shift, shift + 2)) +
                            parseInt(string__value.substring(shift + 3, shift + 5)) / 60;
                        end =
                            parseInt(string__value.substring(shift + 6, shift + 8)) +
                            parseInt(string__value.substring(shift + 9, shift + 11)) / 60;
                    }
                    if (end === 0) {
                        end = 24;
                    }
                    d.setHours(Math.floor(begin));
                    d.setMinutes((begin % 1) * 60);
                    d.setSeconds(0);
                    d.setMilliseconds(0);
                    ret.push({
                        date: d,
                        day: ((d.getDay() + 6) % 7) + 1,
                        begin: begin,
                        end: end,
                        time: end - begin,
                        minutes_left: this.dateDiffInMinutes(d, new Date()),
                    });
                }
            }

            // 01.01. [-05.10.18 -12.10.18 >01.01.18 <01.01.19]
            // 01.01. 09:00-10:00 [-05.10.18 -12.10.18 >01.01.18 <01.01.19]
            else if (
                new RegExp(
                    '^[0-9][0-9].[0-9][0-9].( [0-9][0-9]:[0-9][0-9]-[0-9][0-9]:[0-9][0-9])?( (-|>|<)[0-9][0-9].[0-9][0-9].[1-2][0-9])*$'
                ).test(string__value)
            ) {
                let year = null;
                if (view === 'today') {
                    year = Dates.getCurrentDate().getFullYear();
                } else {
                    year = Dates.getActiveDate().getFullYear();
                }
                // exception on year change
                if (
                    Dates.weekNumber(Dates.getActiveDate()) === 1 &&
                    Dates.getActiveDate().getMonth() + 1 != string__value.substring(3, 5)
                ) {
                    year--;
                }
                d = new Date(year + '-' + string__value.substring(3, 5) + '-' + string__value.substring(0, 2));
                if (isNaN(d)) {
                    error = true;
                    return;
                }
                if (view !== 'all' && Dates.dateIsExcluded(d, string__value)) {
                    return;
                }
                if (
                    (view === 'tickets' && Dates.dateIsActiveDay(d)) ||
                    (view === 'scheduler' && Dates.dateIsInActiveWeek(d)) ||
                    (view === 'today' && Dates.dateIsToday(d)) ||
                    view === 'all'
                ) {
                    let begin = null,
                        end = null;
                    if (string__value.split(':').length === 3) {
                        let shift = string__value.indexOf(':') - 2;
                        begin =
                            parseInt(string__value.substring(shift, shift + 2)) +
                            parseInt(string__value.substring(shift + 3, shift + 5)) / 60;
                        end =
                            parseInt(string__value.substring(shift + 6, shift + 8)) +
                            parseInt(string__value.substring(shift + 9, shift + 11)) / 60;
                    }
                    if (end === 0) {
                        end = 24;
                    }
                    d.setHours(Math.floor(begin));
                    d.setMinutes((begin % 1) * 60);
                    d.setSeconds(0);
                    d.setMilliseconds(0);
                    ret.push({
                        date: d,
                        day: ((d.getDay() + 6) % 7) + 1,
                        begin: begin,
                        end: end,
                        time: end - begin,
                        minutes_left: this.dateDiffInMinutes(d, new Date()),
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

    static germanDateTimeToEnglishString(str) {
        return '20' + str.substring(6, 8) + '-' + str.substring(3, 5) + '-' + str.substring(0, 2) + str.substring(9);
    }

    static dateFormat(d, format) {
        if (format === 'D d.m.') {
            return (
                ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'][d.getDay()] +
                ' ' +
                ('0' + d.getDate()).slice(-2) +
                '.' +
                ('0' + (d.getMonth() + 1)).slice(-2) +
                '.'
            );
        }
        if (format === 'd. F Y') {
            return (
                ('0' + d.getDate()).slice(-2) +
                '. ' +
                [
                    'Januar',
                    'Februar',
                    'März',
                    'April',
                    'Mai',
                    'Juni',
                    'Juli',
                    'August',
                    'September',
                    'Oktober',
                    'November',
                    'Dezember',
                ][d.getMonth()] +
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
                d.getFullYear().toString().substring(2, 4)
            );
        }
        if (format === 'd.m.') {
            return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.';
        }
        if (format === 'D H:i') {
            return (
                ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'][d.getDay()] +
                ' ' +
                ('0' + d.getHours()).slice(-2) +
                ':' +
                ('0' + d.getMinutes()).slice(-2)
            );
        }
        if (format === 'H:i') {
            return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
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

    static timeFormat(float) {
        let hours = Math.floor(float),
            minutes = (float % 1) * 60;
        return ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2);
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
        return (
            d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()
        );
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
        return (
            d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
        );
    }

    static compareDates(d1, d2) {
        if (d1.getFullYear() < d2.getFullYear()) {
            return -1;
        }
        if (d1.getFullYear() > d2.getFullYear()) {
            return 1;
        }
        if (d1.getMonth() < d2.getMonth()) {
            return -1;
        }
        if (d1.getMonth() > d2.getMonth()) {
            return 1;
        }
        if (d1.getDate() < d2.getDate()) {
            return -1;
        }
        if (d1.getDate() > d2.getDate()) {
            return 1;
        }
        return 0;
    }

    static dateDiffInMinutes(d1, d2) {
        return Math.round((d1 - d2) / (1000 * 60));
    }

    static dateDiffInWeeks(d1, d2) {
        let weekNumber1 = this.weekNumber(d1),
            weekNumber2 = this.weekNumber(d2),
            year1 = d1.getFullYear(),
            year2 = d1.getFullYear();
        if (year1 > year2) {
            weekNumber1 += 52;
        }
        if (year1 < year2) {
            weekNumber2 += 52;
        }
        return weekNumber1 - weekNumber2;
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
        str.split(' ').forEach((value) => {
            let excludedDate = new Date(Dates.germanToEnglishString(value.substring(1)));
            if (value.indexOf('-') === 0) {
                if (Dates.sameDay(excludedDate, d)) {
                    ret = true;
                }
            }
            if (value.indexOf('>') === 0) {
                if (Dates.compareDates(excludedDate, d) !== -1) {
                    ret = true;
                }
            }
            if (value.indexOf('<') === 0) {
                if (Dates.compareDates(excludedDate, d) !== 1) {
                    ret = true;
                }
            }
        });
        return ret;
    }

    static extractTimeFromDate(d) {
        let match = d.match(new RegExp('[0-9][0-9]:[0-9][0-9]-[0-9][0-9]:[0-9][0-9]'));
        if (match !== null) {
            return match[0];
        }
        return '';
    }

    static dayOfYear(date) {
        return (
            (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) /
            24 /
            60 /
            60 /
            1000
        );
    }

    static nthWeekdayOfMonth(date) {
        let c = date.getDate();
        return Math.floor((c - 1) / 7) + 1;
    }

    static includeNewLowerBoundInDate(date, lowerBound) {
        date = date.split('\n');
        date.forEach((date__value, date__key) => {
            let match = date__value.match(new RegExp('>[0-9][0-9].[0-9][0-9].[1-2][0-9]', 'g')),
                isObsolete = false;
            if (match !== null) {
                match.forEach((match__value) => {
                    let curBound = new Date(Dates.germanToEnglishString(match__value.substring(1)));
                    if (Dates.compareDates(lowerBound, curBound) === 1) {
                        date__value = date__value.split(match__value).join('');
                    } else {
                        isObsolete = true;
                    }
                });
            }
            date__value = date__value.replace(/ +(?= )/g, ''); // remove double whitespaces
            date__value = date__value.trim();
            if (isObsolete === false) {
                date__value = date__value + ' >' + Dates.dateFormat(Dates.getActiveDate(), 'd.m.y');
            }
            date[date__key] = date__value;
        });
        date = date.join('\n');
        return date;
    }

    static time() {
        return Math.floor(new Date().getTime() / 1000);
    }
}

/* debug */
window.Dates = Dates;

import Store from './Store';

export default class Dates {
    static getCurrentDate() {
        return new Date();
    }

    static getActiveDate() {
        return Store.data.session.activeDay;
    }

    static getDayOfActiveViewport(shift) {
        return Dates.getDayOfViewport(shift, Store.data.session.activeDay);
    }

    static getDayOfCurrentViewport(shift) {
        return Dates.getDayOfViewport(shift, Dates.getCurrentDate());
    }

    static getDayOfViewport(shift, date) {
        let d = new Date(date);
        if (Store.data.shiftingView) {
            return Dates.addDays(d, shift - 1 - Store.data.shiftingViewPrevDays);
        } else {
            let wNow = Dates.weekNumber(new Date());
            let wD = Dates.weekNumber(d);
            if (wNow < wD && Dates.compareDates(new Date(), d) === 1) {
                wNow += 52;
            }
            if (wD < wNow && Dates.compareDates(d, new Date()) === 1) {
                wD += 52;
            }
            let day = d.getDay(),
                diff =
                    d.getDate() -
                    (day - 1) + // subtract day number (so we reach now monday)
                    (day == 0 ? -7 : 0) - // subtract 7 days if sunday (this fixes sunday)
                    ((wD -
                        wNow +
                        (wD < wNow
                            ? Math.ceil((wNow - wD) / Store.data.weeksInViewport) * Store.data.weeksInViewport
                            : 0)) % // correct weeks resulting in negative values
                        Store.data.weeksInViewport) *
                        7 + // subtract 7 days for each week in the viewport
                    (shift - 1); // add the shift
            return new Date(d.setDate(diff));
        }
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
                new RegExp('^[0-9][0-9].[0-9][0-9].[1-3][0-9]( [0-9][0-9]:[0-9][0-9]-[0-9][0-9]:[0-9][0-9])?$').test(
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

                    let day = null;
                    if (Store.data.shiftingView) {
                        day =
                            Dates.dateDiffInDays(d, Store.data.session.activeDay) + 1 + Store.data.shiftingViewPrevDays;
                    } else {
                        // map to 1-7
                        day = ((d.getDay() + 6) % 7) + 1;
                        // shift by weeks in viewport
                        day += Dates.shiftByDatesInViewport(d);
                    }

                    ret.push({
                        date: d,
                        day: day,
                        begin: begin,
                        end: end,
                        time: end - begin,
                        minutes_left: Dates.dateDiffInMinutes(d, new Date()),
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
                    '^(MO|DI|MI|DO|FR|SA|SO)((#|~|%)[1-9][0-9]?)?( [0-9][0-9]:[0-9][0-9]-[0-9][0-9]:[0-9][0-9])?( (-|>|<)[0-9][0-9].[0-9][0-9].[1-3][0-9])*$'
                ).test(string__value)
            ) {
                let d_all = [];

                if (view === 'today') {
                    d_all.push(Dates.getDayOfCurrentViewport(Dates.getDayFromString(string__value.substring(0, 2))));
                } else {
                    if (Store.data.shiftingView) {
                        let dayOfActiveWeek =
                                Dates.getDayOfActiveViewport(0 + Store.data.shiftingViewPrevDays).getDay() + 1,
                            dayOfDateToParse = Dates.getDayFromString(string__value.substring(0, 2)),
                            dayOfDateToParseShift = dayOfDateToParse - dayOfActiveWeek;
                        while (
                            dayOfDateToParseShift <=
                            Store.data.shiftingViewPrevDays + Store.data.weeksInViewport * 7 - 1
                        ) {
                            if (dayOfDateToParseShift >= 0 - Store.data.shiftingViewPrevDays) {
                                d_all.push(
                                    Dates.getDayOfActiveViewport(
                                        dayOfDateToParseShift + 1 + Store.data.shiftingViewPrevDays
                                    )
                                );
                            }
                            dayOfDateToParseShift += 7;
                        }
                    } else {
                        let dayOfDateToParse = Dates.getDayFromString(string__value.substring(0, 2)),
                            dayOfDateToParseShift = dayOfDateToParse - 1;
                        while (dayOfDateToParseShift <= Store.data.weeksInViewport * 7 - 1) {
                            d_all.push(Dates.getDayOfActiveViewport(dayOfDateToParseShift + 1));
                            dayOfDateToParseShift += 7;
                        }
                    }
                }

                for (let d of d_all) {
                    if (isNaN(d)) {
                        error = true;
                        continue;
                    }
                    if (view !== 'all' && Dates.dateIsExcluded(d, string__value)) {
                        continue;
                    }

                    if (view !== 'all' && string__value.substring(2, 3) === '#') {
                        let num = parseInt(string__value.substring(3, 5).trim()),
                            nthWeekdayOfMonth = Dates.nthWeekdayOfMonth(d);
                        if (num % 4 !== nthWeekdayOfMonth) {
                            continue;
                        }
                        if ((d.getMonth() + 1) % (Math.floor((num - 1) / 4) + 1) !== 0) {
                            continue;
                        }
                    }

                    if (view !== 'all' && string__value.substring(2, 3) === '~') {
                        let num = parseInt(string__value.substring(3, 5).trim()),
                            weekNumber = Dates.weekNumber(d);
                        if (num != weekNumber) {
                            continue;
                        }
                    }

                    if (view !== 'all' && string__value.substring(2, 3) === '%') {
                        let num = parseInt(string__value.substring(3, 5).trim()),
                            weekNumber = Dates.weekNumber(d),
                            match = string__value.match(/>([0-9][0-9]\.[0-9][0-9]\.[0-9][0-9])/i);
                        if (match) {
                            weekNumber -= Dates.weekNumber(new Date(Dates.germanToEnglishString(match[1])));
                        }
                        if (weekNumber % num !== 0) {
                            continue;
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

                        let day = null;
                        if (Store.data.shiftingView) {
                            day =
                                Dates.dateDiffInDays(d, Store.data.session.activeDay) +
                                1 +
                                Store.data.shiftingViewPrevDays;
                        } else {
                            // map to 1-7
                            day = ((d.getDay() + 6) % 7) + 1;
                            // shift by weeks in viewport
                            day += Dates.shiftByDatesInViewport(d);
                        }

                        ret.push({
                            date: d,
                            day: day,
                            begin: begin,
                            end: end,
                            time: end - begin,
                            minutes_left: Dates.dateDiffInMinutes(d, new Date()),
                        });
                    }
                }
            }

            // 01.01. [-05.10.18 -12.10.18 >01.01.18 <01.01.19]
            // 01.01. 09:00-10:00 [-05.10.18 -12.10.18 >01.01.18 <01.01.19]
            else if (
                new RegExp(
                    '^[0-9][0-9].[0-9][0-9].( [0-9][0-9]:[0-9][0-9]-[0-9][0-9]:[0-9][0-9])?( (-|>|<)[0-9][0-9].[0-9][0-9].[1-3][0-9])*$'
                ).test(string__value)
            ) {
                // determine proper year
                let year = null;
                if (view === 'today') {
                    year = Dates.getCurrentDate().getFullYear();
                } else {
                    year = Dates.getActiveDate().getFullYear();
                }
                year--;
                while (
                    Math.abs(
                        Dates.dateDiffInDays(
                            new Date(year + '-' + string__value.substring(3, 5) + '-' + string__value.substring(0, 2)),
                            Dates.getActiveDate()
                        )
                    ) >
                    365 / 2
                ) {
                    year++;
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

                    let day = null;
                    if (Store.data.shiftingView) {
                        day =
                            Dates.dateDiffInDays(d, Store.data.session.activeDay) + 1 + Store.data.shiftingViewPrevDays;
                    } else {
                        // map to 1-7
                        day = ((d.getDay() + 6) % 7) + 1;
                        // shift by weeks in viewport
                        day += Dates.shiftByDatesInViewport(d);
                    }

                    ret.push({
                        date: d,
                        day: day,
                        begin: begin,
                        end: end,
                        time: end - begin,
                        minutes_left: Dates.dateDiffInMinutes(d, new Date()),
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

    static getWeekdayOfString(str) {
        if (str.indexOf('MO') === 0) {
            return 0;
        }
        if (str.indexOf('DI') === 0) {
            return 1;
        }
        if (str.indexOf('MI') === 0) {
            return 2;
        }
        if (str.indexOf('DO') === 0) {
            return 3;
        }
        if (str.indexOf('FR') === 0) {
            return 4;
        }
        if (str.indexOf('SA') === 0) {
            return 5;
        }
        if (str.indexOf('SO') === 0) {
            return 6;
        }
        return -1;
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

    static shiftByDatesInViewport(d) {
        let dW = Dates.weekNumber(d);
        let dC = Dates.weekNumber(new Date());
        if (dW > dC && Dates.compareDates(new Date(), d) === 1) {
            dC += 52;
        } else if (dC > dW && Dates.compareDates(d, new Date()) === 1) {
            dW += 52;
        }
        return (
            ((dW -
                dC +
                (dW < dC ? Math.ceil((dC - dW) / Store.data.weeksInViewport) * Store.data.weeksInViewport : 0)) % // correct weeks resulting in negative values
                Store.data.weeksInViewport) *
            7
        );
    }

    static dateIsInActiveWeek(d) {
        if (d === null || d === '') {
            return false;
        }
        d = new Date(d);

        if (Store.data.shiftingView) {
            return (
                Dates.dateDiffInDays(d, Store.data.session.activeDay) < Store.data.weeksInViewport * 7 &&
                Dates.dateDiffInDays(d, Store.data.session.activeDay) >= 0 - Store.data.shiftingViewPrevDays
            );
        } else {
            return Dates.sameDay(Dates.getDayOfViewport(1, d), Dates.getDayOfActiveViewport(1));
        }
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

    static dateDiffInDays(d1, d2) {
        d1.setHours(0);
        d1.setMinutes(0);
        d1.setSeconds(0);
        d1.setMilliseconds(0);
        d2.setHours(0);
        d2.setMinutes(0);
        d2.setSeconds(0);
        d2.setMilliseconds(0);
        return Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
    }

    static dateDiffInWeeks(d1, d2) {
        let weekNumber1 = Dates.weekNumber(d1),
            weekNumber2 = Dates.weekNumber(d2),
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

    static addDays(date, days) {
        let result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
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
            let match = date__value.match(new RegExp('>[0-9][0-9].[0-9][0-9].[1-3][0-9]', 'g')),
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

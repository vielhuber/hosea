<?php

namespace HoseaApi;

/**
 * Parses the app's custom date string format.
 * Warning: this logic is similar to _js/Dates.js.
 */
trait DateParserTrait
{
    /**
     * Parse the app's custom date string into an array of date/begin/end entries.
     */
    private function parseDateString(string $rawDate): array
    {
        $return = [];
        foreach (explode(PHP_EOL, $rawDate) as $datesValue) {
            if (
                preg_match(
                    '/^[0-9][0-9].[0-9][0-9].[1-3][0-9]( [0-9][0-9]:[0-9][0-9]-[0-9][0-9]:[0-9][0-9])?$/',
                    $datesValue
                )
            ) {
                $date =
                    '20' .
                    substr($datesValue, 6, 2) .
                    '-' .
                    substr($datesValue, 3, 2) .
                    '-' .
                    substr($datesValue, 0, 2);
                [$begin, $end] = $this->extractTimeFromDate($datesValue);
                $return[] = ['date' => $date, 'begin' => $begin, 'end' => $end];
            } elseif (
                preg_match(
                    '/^(MO|DI|MI|DO|FR|SA|SO)((#|~)[1-9][0-9]?)?( [0-9][0-9]:[0-9][0-9]-[0-9][0-9]:[0-9][0-9])?( (-|>|<)[0-9][0-9].[0-9][0-9].[1-3][0-9])*$/',
                    $datesValue
                )
            ) {
                $date = date(
                    'Y-m-d',
                    strtotime(
                        'first ' .
                            [
                                'MO' => 'monday',
                                'DI' => 'tuesday',
                                'MI' => 'wednesday',
                                'DO' => 'thursday',
                                'FR' => 'friday',
                                'SA' => 'saturday',
                                'SO' => 'sunday'
                            ][substr($datesValue, 0, 2)] .
                            ' of january ' .
                            ((int) date('Y') - 1)
                    )
                );
                [$begin, $end] = $this->extractTimeFromDate($datesValue);
                while (date('Y', strtotime($date)) < date('Y') + 3) {
                    if (!$this->dateIsExcluded($date, $datesValue)) {
                        $return[] = ['date' => $date, 'begin' => $begin, 'end' => $end];
                    }
                    $date = date('Y-m-d', strtotime($date . ' + 1 week'));
                }
            } elseif (
                preg_match(
                    '/^[0-9][0-9].[0-9][0-9].( [0-9][0-9]:[0-9][0-9]-[0-9][0-9]:[0-9][0-9])?( (-|>|<)[0-9][0-9].[0-9][0-9].[1-3][0-9])*$/',
                    $datesValue
                )
            ) {
                // start 5 years in the past so the current year is always covered
                $date = (int) date('Y') - 5 . '-' . substr($datesValue, 3, 2) . '-' . substr($datesValue, 0, 2);
                [$begin, $end] = $this->extractTimeFromDate($datesValue);
                for ($i = 0; $i < 10; $i++) {
                    if (!$this->dateIsExcluded($date, $datesValue)) {
                        $return[] = ['date' => $date, 'begin' => $begin, 'end' => $end];
                    }
                    $date = date('Y-m-d', strtotime($date . ' + 1 year'));
                }
            }
        }
        return $return;
    }

    private function extractTimeFromDate(string $datesValue): array
    {
        $begin = null;
        $end = null;
        if (count(explode(':', $datesValue)) === 3) {
            $shift = strpos($datesValue, ':') - 2;
            $begin = substr($datesValue, $shift, 5);
            $end = substr($datesValue, $shift + 6, 5);
        }
        if ($end === '00:00') {
            $end = '24:00';
        }
        return [$begin, $end];
    }

    private function dateIsExcluded(string $date, string $dates): bool
    {
        if (strpos($dates, '#') === 2) {
            $num = trim(substr($dates, 3, 2));
            if ($num % 4 != $this->nthWeekdayOfMonth($date)) {
                return true;
            }
            if (date('m', strtotime($date)) % (floor(($num - 1) / 4) + 1) != 0) {
                return true;
            }
        }
        if (strpos($dates, '~') === 2) {
            $num = trim(substr($dates, 3, 2));
            if ($num != intval(date('W', strtotime($date)))) {
                return true;
            }
        }
        foreach (explode(' ', $dates) as $datesValue) {
            $excluded =
                '20' . substr($datesValue, 7, 2) . '-' . substr($datesValue, 4, 2) . '-' . substr($datesValue, 1, 2);
            if (substr($datesValue, 0, 1) === '-' && $date === $excluded) {
                return true;
            }
            if (
                substr($datesValue, 0, 1) === '>' &&
                strtotime($date . ' 00:00:00') <= strtotime($excluded . ' 00:00:00')
            ) {
                return true;
            }
            if (substr($datesValue, 0, 1) === '<' && strtotime($date) >= strtotime($excluded)) {
                return true;
            }
        }
        return false;
    }

    private function nthWeekdayOfMonth(string $date): int
    {
        return (int) floor((date('d', strtotime($date)) - 1) / 7) + 1;
    }
}

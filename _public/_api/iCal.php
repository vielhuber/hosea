<?php
namespace HoseaApi;

class iCal extends Api
{
    public function __construct()
    {
    }

    protected function getRequest()
    {
        if ($this->getRequestMethod() === 'GET' && $this->getRequestPathFirst() === 'ical' && $this->getRequestPathSecond() != '') {
            $this->generateICal();
        }
    }

    protected function generateICal()
    {
        $vCalendar = new \Eluceo\iCal\Component\Calendar('ical');
        $tickets = $this::$db->fetch_all('SELECT * FROM tickets WHERE user_id = (SELECT id FROM users WHERE ical_key = ?)', $this->getRequestPathSecond());
        foreach ($tickets as $tickets__value) {
            $dates = $this->parseDateString($tickets__value['date']);
            foreach ($dates as $dates__value) {
                $vEvent = new \Eluceo\iCal\Component\Event();
                if (@$dates__value['date'] != '') {
                    if (@$dates__value['begin'] != '' && @$dates__value['end'] != '') {
                        $vEvent->setDtStart(new \DateTime($dates__value['date'] . ' ' . $dates__value['begin'] . ':00'));
                        $vEvent->setDtEnd(new \DateTime($dates__value['date'] . ' ' . $dates__value['end'] . ':00'));
                    } else {
                        $vEvent->setDtStart(new \DateTime($dates__value['date']));
                        $vEvent->setDtEnd(new \DateTime($dates__value['date']));
                        $vEvent->setNoTime(true);
                    }
                }
                if (@$dates__value['recurrence'] != '') {
                    $recurrenceRule = new \Eluceo\iCal\Property\Event\RecurrenceRule();
                    if (@$dates__value['recurrence']['freq'] != '') {
                        $recurrenceRule->setFreq($dates__value['recurrence']['freq']);
                    }
                    if (@$dates__value['recurrence']['until'] != '') {
                        $recurrenceRule->setUntil(new \DateTime($dates__value['recurrence']['until']));
                    }
                    if (@$dates__value['recurrence']['byday'] != '') {
                        $recurrenceRule->setByDay($dates__value['recurrence']['byday']);
                    }
                    if (@$dates__value['recurrence']['byweekno'] != '') {
                        //$recurrenceRule->setByWeekNo($dates__value['recurrence']['byweekno']);
                        $recurrenceRule->setByWeekNo('1');
                    }
                    /*
                    $recurrenceRule->setInterval(1);
                    $recurrenceRule->setCount(1);
                    $recurrenceRule->setByMonth(1);
                    $recurrenceRule->setByYearDay(1);
                    $recurrenceRule->setByMonthDay(1);
                    */
                    $vEvent->setRecurrenceRule($recurrenceRule);
                }
                $vEvent->setCategories(['_' . $tickets__value['status']]);
                $vEvent->setSummary($tickets__value['project']);
                $vEvent->setDescription($tickets__value['description']);
                $vEvent->setDescriptionHTML(nl2br($tickets__value['description']));
                $vCalendar->addComponent($vEvent);
            }
        }
        if (@$_GET['test'] == 1) {
            echo '<pre>';
            print_r($vCalendar);
            echo $vCalendar->render();
            die();
        }

        header('Content-Type: text/calendar; charset=utf-8');
        header('Content-Disposition: attachment; filename="cal.ics"');
        echo $vCalendar->render();
        die();
    }

    protected function parseDateString($date)
    {
        /* warning: this logic is similiar to _js/Dates.js */
        $return = [];
        foreach (explode(PHP_EOL, $date) as $dates__value) {
            if (preg_match('/^[0-9][0-9].[0-9][0-9].[1-2][0-9]( [0-9][0-9]:[0-9][0-9]-[0-9][0-9]:[0-9][0-9])?$/', $dates__value)) {
                $date = '20' . substr($dates__value, 6, 2) . '-' . substr($dates__value, 3, 2) . '-' . substr($dates__value, 0, 2);
                $begin = strlen($dates__value) > 8 ? substr($dates__value, 9, 5) : null;
                $end = strlen($dates__value) > 8 ? substr($dates__value, 15, 5) : null;
                if ($end == 0) {
                    $end = 24;
                }
                $return[] = [
                    'date' => $date,
                    'begin' => $begin,
                    'end' => $end,
                    'recurrence' => null
                ];
            } elseif (preg_match('/^[0-9][0-9].[0-9][0-9].( [0-9][0-9]:[0-9][0-9]-[0-9][0-9]:[0-9][0-9])?( (-|>|<)[0-9][0-9].[0-9][0-9].[1-2][0-9])*$/', $dates__value)) {
                $begin = null;
                $end = null;
                if (count(explode(':', $dates__value)) === 3) {
                    $shift = strpos($dates__value, ':') - 2;
                    $begin = intval(substr($dates__value, $shift, 2)) + intval(substr($dates__value, $shift + 3, 2)) / 60;
                    $end = intval(substr($dates__value, $shift + 6, 2)) + intval(substr($dates__value, $shift + 9, 2)) / 60;
                }
                if ($end === 0) {
                    $end = 24;
                }
                $date = '2016-' . substr($dates__value, 3, 2) . '-' . substr($dates__value, 0, 2);
                for ($i = 0; $i < 10; $i++) {
                    $date = date('Y-m-d', strtotime($date . ' + 1 year'));
                    if ($this->dateIsExcluded($date, $dates__value)) {
                        continue;
                    }
                    $return[] = [
                        'date' => $date,
                        'begin' => $begin,
                        'end' => $end,
                        'recurrence' => null
                    ];
                }
            } elseif (preg_match('/^(MO|DI|MI|DO|FR|SA|SO)((#|~)[1-9][0-9]?)?( [0-9][0-9]:[0-9][0-9]-[0-9][0-9]:[0-9][0-9])?( (-|>|<)[0-9][0-9].[0-9][0-9].[1-2][0-9])*$/', $dates__value)) {
                $begin = null;
                $end = null;
                if (count(explode(':', $dates__value)) === 3) {
                    $shift = strpos($dates__value, ':') - 2;
                    $begin = intval(substr($dates__value, $shift, 2)) + intval(substr($dates__value, $shift + 3, 2)) / 60;
                    $end = intval(substr($dates__value, $shift + 6, 2)) + intval(substr($dates__value, $shift + 9, 2)) / 60;
                }
                if ($end === 0) {
                    $end = 24;
                }

                $recurrence = [];

                $recurrence['freq'] = 'WEEKLY';

                $date = '2017-01-01';
                if (strpos($dates__value, '>') !== false) {
                    foreach (explode(' ', $dates__value) as $dates__value__value) {
                        if (strpos($dates__value__value, '>') === 0) {
                            if ($date === null || strtotime(substr($dates__value__value, 1)) > strtotime($date)) {
                                $date = date('Y-m-d', strtotime(substr($dates__value__value, 1, 6) . '20' . substr($dates__value__value, 7, 8)));
                            }
                        }
                    }
                }

                $recurrence['until'] = null;
                if (strpos($dates__value, '<') !== false) {
                    foreach (explode(' ', $dates__value) as $dates__value__value) {
                        if (strpos($dates__value__value, '<') === 0) {
                            if ($recurrence['until'] === null || strtotime(substr($dates__value__value, 1)) < strtotime($recurrence['until'])) {
                                $recurrence['until'] = date('Y-m-d', strtotime(substr($dates__value__value, 1, 6) . '20' . substr($dates__value__value, 7, 8)));
                            }
                        }
                    }
                }

                $recurrence['byday'] = ['MO' => 'MO', 'DI' => 'TU', 'MI' => 'WE', 'DO' => 'TH', 'FR' => 'FR', 'SA' => 'SA', 'SO' => 'SU'][substr($dates__value, 0, 2)];

                $recurrence['byweekno'] = null;

                /*
                if (substr($dates__value, 2, 1) === '#') {
                    $recurrence['byweekno'] = [];
                    $rule_original = trim(substr($dates__value, 3, 2));
                    $rule = $rule_original;
                    while ($rule < 53) {
                        $recurrence['byweekno'][] = $rule;
                        if ($rule_original < 4) {
                            $rule += 4;
                        } else {
                            $rule += $rule_original;
                        }
                    }
                    $recurrence['byweekno'] = implode(',', $recurrence['byweekno']);
                }
                if (substr($dates__value, 2, 1) === '~') {
                    $recurrence['byweekno'] = trim(substr($dates__value, 2, 2));
                }
                */

                if (substr($dates__value, 2, 1) === '~') {
                }

                $return[] = [
                    'date' => $date,
                    'begin' => $begin,
                    'end' => $end,
                    'recurrence' => $recurrence
                ];
            }
        }
        if (@$_GET['test'] == 2) {
            echo '<pre>';
            print_r($return);
            die();
        }
        return $return;
    }

    protected function dateIsExcluded($date, $dates)
    {
        $ret = false;
        foreach (explode(' ', $dates) as $dates__value) {
            $excluded = '20' . substr($dates__value, 7, 2) . '-' . substr($dates__value, 4, 2) . '-' . substr($dates__value, 1, 2);
            if (substr($dates__value, 0, 1) === '-') {
                if ($date === $excluded) {
                    $ret = true;
                }
            }
            if (substr($dates__value, 0, 1) === '>') {
                if (strtotime($date) < strtotime($excluded)) {
                    $ret = true;
                }
            }
            if (substr($dates__value, 0, 1) === '<') {
                if (strtotime($date) > strtotime($excluded)) {
                    $ret = true;
                }
            }
        }
        return $ret;
    }
}

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
                if ($dates__value['begin'] !== null && $dates__value['end'] !== null) {
                    $vEvent->setDtStart(new \DateTime($dates__value['date'] . ' ' . $dates__value['begin'] . ':00'));
                    $vEvent->setDtEnd(new \DateTime($dates__value['date'] . ' ' . $dates__value['end'] . ':00'));
                } else {
                    $vEvent->setDtStart(new \DateTime($dates__value['date']));
                    $vEvent->setDtEnd(new \DateTime($dates__value['date']));
                    $vEvent->setNoTime(true);
                }
                if ($dates__value['recurrence'] !== null) {
                    $recurrenceRule = new \Eluceo\iCal\Property\Event\RecurrenceRule();
                    $recurrenceRule->setFreq('YEARLY');
                    $recurrenceRule->setInterval(1);
                    $recurrenceRule->setCount(1);
                    $recurrenceRule->setUntil(new \DateTime('1997-12-24'));
                    $recurrenceRule->setByDay('MO,WE,FR');
                    $recurrenceRule->setByMonth(1);
                    $recurrenceRule->setByWeekNo(1);
                    $recurrenceRule->setByYearDay(1);
                    $recurrenceRule->setByMonthDay(1);
                    $vEvent->setRecurrenceRule($recurrenceRule);
                }
                $vEvent->setCategories(['_' . $tickets__value['status']]);
                $vEvent->setSummary($tickets__value['project']);
                $vEvent->setDescription($tickets__value['description']);
                $vEvent->setDescriptionHTML(nl2br($tickets__value['description']));
                $vCalendar->addComponent($vEvent);
            }
        }
        /*
        echo '<pre>';
        print_r($vCalendar);
        die();
        */
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
            }
            if (preg_match('/^(MO|DI|MI|DO|FR|SA|SO)((#|~)[1-9][0-9]?)?( [0-9][0-9]:[0-9][0-9]-[0-9][0-9]:[0-9][0-9])?( (-|>|<)[0-9][0-9].[0-9][0-9].[1-2][0-9])*$/', $dates__value)) {
                $day = substr($dates__value, 0, 2);
                $date = $this->getFirstWeekdayOfYear($day, date('Y') - 2);
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
                /*
                print_r([
                    $dates__value,
                    [
                        'date' => $date,
                        'begin' => $begin,
                        'end' => $end,
                        'recurrence' => 'test'
                    ]
                ]);
                die();
                */
                $return[] = [
                    'date' => $date,
                    'begin' => $begin,
                    'end' => $end,
                    'recurrence' => 'test'
                ];
            }
        }
        return $return;
    }

    function getFirstWeekdayOfYear($day, $year)
    {
        $day = ['MO' => 'monday', 'DI' => 'tuesday', 'MI' => 'wednesday', 'DO' => 'thursday', 'FR' => 'friday', 'SA' => 'saturday', 'SO' => 'sunday'][$day];
        return date('Y-m-d', strtotime('first ' . $day . ' of january ' . $year));
    }

    protected function getDayFromTime($curday)
    {
        return [
            1 => 'MO',
            2 => 'DI',
            3 => 'MI',
            4 => 'DO',
            5 => 'FR',
            6 => 'SA',
            7 => 'SO'
        ][date('N', $curday)];
    }

    protected function dateIsExcluded($curday, $dates__value)
    {
    }
}

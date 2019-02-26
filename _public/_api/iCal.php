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
                $vEvent->setCategories(['_' . $tickets__value['status']]);
                $vEvent->setSummary($tickets__value['project']);
                $vEvent->setDescription($tickets__value['description']);
                $vEvent->setDescriptionHTML(nl2br($tickets__value['description']));
                $vCalendar->addComponent($vEvent);
            }
        }
        if (@$_GET['test'] == 1) {
            echo '<pre>';
            //print_r($vCalendar);
            echo $vCalendar->render();
            die();
        }
        header('Content-Type: text/calendar; charset=utf-8');
        header('Content-Disposition: attachment; filename="cal.ics"');
        echo $vCalendar->render();
        die();
    }

    protected function parseDateString($raw_date)
    {
        /* warning: this logic is similiar to _js/Dates.js */
        $return = [];
        foreach (explode(PHP_EOL, $raw_date) as $dates__value) {
            if (preg_match('/^[0-9][0-9].[0-9][0-9].[1-2][0-9]( [0-9][0-9]:[0-9][0-9]-[0-9][0-9]:[0-9][0-9])?$/', $dates__value)) {
                $date = '20' . substr($dates__value, 6, 2) . '-' . substr($dates__value, 3, 2) . '-' . substr($dates__value, 0, 2);
                [$begin, $end] = $this->extractTimeFromDate($dates__value);
                $return[] = [
                    'date' => $date,
                    'begin' => $begin,
                    'end' => $end
                ];
            } elseif (preg_match('/^(MO|DI|MI|DO|FR|SA|SO)((#|~)[1-9][0-9]?)?( [0-9][0-9]:[0-9][0-9]-[0-9][0-9]:[0-9][0-9])?( (-|>|<)[0-9][0-9].[0-9][0-9].[1-2][0-9])*$/', $dates__value)) {
                $date = date(
                    'Y-m-d',
                    strtotime(
                        'first ' .
                            ['MO' => 'monday', 'DI' => 'tuesday', 'MI' => 'wednesday', 'DO' => 'thursday', 'FR' => 'friday', 'SA' => 'saturday', 'SO' => 'sunday'][substr($dates__value, 0, 2)] .
                            ' of january ' .
                            (date('Y') - 1)
                    )
                );
                [$begin, $end] = $this->extractTimeFromDate($dates__value);
                while (date('Y', strtotime($date)) < date('Y') + 3) {
                    if (!$this->dateIsExcluded($date, $dates__value)) {
                        $return[] = [
                            'date' => $date,
                            'begin' => $begin,
                            'end' => $end
                        ];
                    }
                    $date = date('Y-m-d', strtotime($date . ' + 1 week'));
                }
            } elseif (preg_match('/^[0-9][0-9].[0-9][0-9].( [0-9][0-9]:[0-9][0-9]-[0-9][0-9]:[0-9][0-9])?( (-|>|<)[0-9][0-9].[0-9][0-9].[1-2][0-9])*$/', $dates__value)) {
                $date = '2016-' . substr($dates__value, 3, 2) . '-' . substr($dates__value, 0, 2);
                [$begin, $end] = $this->extractTimeFromDate($dates__value);
                for ($i = 0; $i < 10; $i++) {
                    if (!$this->dateIsExcluded($date, $dates__value)) {
                        $return[] = [
                            'date' => $date,
                            'begin' => $begin,
                            'end' => $end
                        ];
                    }
                    $date = date('Y-m-d', strtotime($date . ' + 1 year'));
                }
            }
        }
        if (@$_GET['test'] == 2) {
            if (strpos($raw_date, 'FR 09:30-16:00 -28.12.18 -04.01.19 >21.12.18') === 0) {
                echo '<pre>';
                print_r($return);
                die();
            }
        }
        return $return;
    }

    protected function extractTimeFromDate($dates__value)
    {
        $begin = null;
        $end = null;
        if (count(explode(':', $dates__value)) === 3) {
            $shift = strpos($dates__value, ':') - 2;
            $begin = substr($dates__value, $shift, 5);
            $end = substr($dates__value, $shift + 6, 5);
        }
        if ($end == '00:00') {
            $end = '24:00';
        }
        return [$begin, $end];
    }

    protected function dateIsExcluded($date, $dates)
    {
        if (strpos($dates, '#') === 2) {
            $num = trim(substr($dates, 3, 2));
            $nthWeekdayOfMonth = $this->nthWeekdayOfMonth($date);
            if ($num % 4 !== $nthWeekdayOfMonth) {
                return true;
            }
            if ($num / 4 > 1 && date('m', strtotime($date)) % (floor($num / 4) + 1) !== 0) {
                return true;
            }
        }
        if (strpos($dates, '~') === 2) {
            $num = trim(substr($dates, 3, 2));
            $weekNumber = intval(date('W', strtotime($date)));
            if ($num != $weekNumber) {
                return true;
            }
        }
        foreach (explode(' ', $dates) as $dates__value) {
            $excluded = '20' . substr($dates__value, 7, 2) . '-' . substr($dates__value, 4, 2) . '-' . substr($dates__value, 1, 2);
            if (substr($dates__value, 0, 1) === '-') {
                if ($date === $excluded) {
                    return true;
                }
            }
            if (substr($dates__value, 0, 1) === '>') {
                if (strtotime($date . ' 00:00:00') <= strtotime($excluded . ' 00:00:00')) {
                    return true;
                }
            }
            if (substr($dates__value, 0, 1) === '<') {
                if (strtotime($date) >= strtotime($excluded)) {
                    return true;
                }
            }
        }
        return false;
    }

    protected function nthWeekdayOfMonth($date)
    {
        $c = date('d', strtotime($date));
        return floor(($c - 1) / 7) + 1;
    }
}

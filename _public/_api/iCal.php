<?php

namespace HoseaApi;

class iCal extends Api
{
    use DateParserTrait;

    public function __construct() {}

    protected function getRequest()
    {
        if (
            $this->getRequestMethod() === 'GET' &&
            $this->getRequestPathFirst() === 'ical' &&
            $this->getRequestPathSecond() != ''
        ) {
            $this->generateICal();
        }
    }

    protected function generateICal()
    {
        $events = [];

        $query = [];

        if (isset($_GET['projects']) && $_GET['projects'] != '') {
            $query[] = 'status IN (\'fixed\',\'allday\')';
            $query_or = [];
            foreach (explode(',', $_GET['projects']) as $projects__value) {
                $query_or[] = 'project LIKE \'_' . $projects__value . '_\'';
                $query_or[] = 'project LIKE \'--_' . $projects__value . '_\'';
            }
            $query[] = '(' . implode(') OR (', $query_or) . ')';
        } else {
            $query[] =
                'INSTR(project,\'FEIERTAG\') OR ((LENGTH(date)-LENGTH(REPLACE(date, \'\n\', \'\'))) > 3) OR STR_TO_DATE(date,\'%d.%m.%y\') > DATE_SUB(NOW(), INTERVAL 30 DAY)';
            $query[] =
                'INSTR(project,\'FEIERTAG\') OR ((LENGTH(date)-LENGTH(REPLACE(date, \'\n\', \'\'))) > 3) OR STR_TO_DATE(date,\'%d.%m.%y\') < DATE_ADD(NOW(), INTERVAL 30 DAY)';
            $query[] = 'status IN (\'fixed\')';
            $query[] = 'project NOT LIKE \'%Mittagessen%\'';
            $query[] = 'project NOT LIKE \'%Abendessen%\'';
            $query[] = 'project NOT LIKE \'%Entspannen%\'';
            $query[] = 'project NOT LIKE \'%Julia%\'';
        }

        $tickets = $this::$db->fetch_all(
            '
            SELECT * FROM tickets WHERE user_id = (SELECT id FROM users WHERE api_key = ?)
            AND (' .
                implode(') AND (', $query) .
                ')
            ',
            $this->getRequestPathSecond()
        );
        foreach ($tickets as $tickets__value) {
            $dates = $this->parseDateString($tickets__value['date'] ?? '');
            foreach ($dates as $dates__value) {
                $vEvent = new \Eluceo\iCal\Domain\Entity\Event();
                if (@$dates__value['date'] != '') {
                    if (@$dates__value['begin'] != '' && @$dates__value['end'] != '') {
                        $vEvent->setOccurrence(
                            new \Eluceo\iCal\Domain\ValueObject\TimeSpan(
                                new \Eluceo\iCal\Domain\ValueObject\DateTime(
                                    \DateTimeImmutable::createFromFormat(
                                        'Y-m-d H:i:s',
                                        $dates__value['date'] . ' ' . $dates__value['begin'] . ':00'
                                    ),
                                    true
                                ),
                                new \Eluceo\iCal\Domain\ValueObject\DateTime(
                                    \DateTimeImmutable::createFromFormat(
                                        'Y-m-d H:i:s',
                                        $dates__value['date'] .
                                            ' ' .
                                            ($dates__value['end'] == '24:00' ? '23:59' : $dates__value['end']) .
                                            ':00'
                                    ),
                                    true
                                )
                            )
                        );
                    } else {
                        $vEvent->setOccurrence(
                            new \Eluceo\iCal\Domain\ValueObject\SingleDay(
                                new \Eluceo\iCal\Domain\ValueObject\Date(
                                    \DateTimeImmutable::createFromFormat('Y-m-d', $dates__value['date'])
                                )
                            )
                        );
                    }
                }
                $vEvent->setCategories(['_' . $tickets__value['status']]);
                $vEvent->setSummary($tickets__value['project']);
                $vEvent->setDescription($tickets__value['description']);
                $events[] = $vEvent;
            }
        }
        if (@$_GET['test'] == 1) {
            echo '<pre>';
        } else {
            header('Content-Type: text/calendar; charset=utf-8');
            header('Content-Disposition: attachment; filename="cal.ics"');
        }
        $timezone = new \DateTimeZone('Europe/Berlin');
        $calendar = new \Eluceo\iCal\Domain\Entity\Calendar($events);
        $calendar->addTimeZone(
            \Eluceo\iCal\Domain\Entity\TimeZone::createFromPhpDateTimeZone(
                $timezone,
                new \DateTimeImmutable('2023-05-01 00:00:00', $timezone),
                new \DateTimeImmutable('2099-12-31 23:59:59', $timezone)
            )
        );
        echo (new \Eluceo\iCal\Presentation\Factory\CalendarFactory())->createCalendar($calendar);
        die();
    }
}

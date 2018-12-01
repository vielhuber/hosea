<?php
namespace HoseaApi;

class iCal extends Api
{

    public function __construct()
    {
    }

    protected function getRequest()
    {
        if (
            $this->getRequestMethod() === 'GET' &&
            $this->getRequestPathFirst() === 'ical'
        ) {
            $this->generateICal();
        }
    }

    protected function generateICal()
    {
        $vCalendar = new \Eluceo\iCal\Component\Calendar('hosea');
        $vEvent = new \Eluceo\iCal\Component\Event();
        $vEvent
            ->setDtStart(new \DateTime('2012-12-24'))
            ->setDtEnd(new \DateTime('2012-12-24'))
            ->setNoTime(true)
            ->setSummary('Christmas')
        ;
        $vCalendar->addComponent($vEvent);
        //header('Content-Type: text/calendar; charset=utf-8');
        //header('Content-Disposition: attachment; filename="cal.ics"');
        echo $vCalendar->render();
        die();
    }

}

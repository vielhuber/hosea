<?php

namespace HoseaApi;

class Cron extends Api
{
    public function __construct()
    {
    }

    protected function getRequest()
    {
        if (
            $this->getRequestMethod() === 'GET' &&
            $this->getRequestPathFirst() === 'cron' &&
            $this->getRequestPathSecond() != ''
        ) {
            $this->processCron();
        }
    }

    protected function processCron()
    {
        $this->Mail->buildCache(true);
        die('OK');
    }
}

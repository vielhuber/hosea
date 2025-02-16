<?php
namespace HoseaApi;

class Money extends Api
{
    public $money_stats_url = null;

    public function __construct()
    {
        $this->setupSettings();
    }

    protected function setupSettings()
    {
        $dotenv = \Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
        $dotenv->load();
        if (@$_SERVER['MONEY_STATS_URL'] != '') {
            $this->money_stats_url = $_SERVER['MONEY_STATS_URL'];
        }
    }

    protected function getRequest()
    {
        if (
            $this->getRequestMethod() === 'GET' &&
            $this->getRequestPathFirst() === 'money' &&
            $this->getRequestPathSecond() === null
        ) {
            return $this->index();
        }
    }

    protected function index()
    {
        die('OK');

        // add money info from external server
        $response = __curl($this->money_stats_url);

        // also add car info
        $car_data = explode(
            PHP_EOL,
            $this::$db->fetch_var('SELECT description FROM tickets WHERE description LIKE ?', '%Gefahrene Kilometer%')
        );
        $car_km = [];
        foreach ($car_data as $car_data__value) {
            $line_parts = explode(':', $car_data__value);
            $car_km[trim($line_parts[0])] = trim($line_parts[1]);
        }
        $response->result->data->km_per_day = round(
            (round(
                (strtotime($car_km['Leasingende']) - strtotime($car_km['Leasingbeginn'])) / (60 * 60 * 24 * 365.25)
            ) *
                $car_km['Kilometer / Jahr'] -
                $car_km['Gefahrene Kilometer']) /
                ((strtotime($car_km['Leasingende']) - strtotime($car_km['Letztes Update'])) / (60 * 60 * 24)),
            2
        );

        $this->response($response->result);
    }
}

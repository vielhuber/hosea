<?php
namespace HoseaApi;

class Weather extends Api
{
    public $api_key = null;
    public $lat = null;
    public $lon = null;

    public function __construct()
    {
        $this->setupSettings();
    }

    protected function setupSettings()
    {
        $dotenv = \Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
        $dotenv->load();
        if (@$_SERVER['WEATHER_OPENWEATHER_API_KEY'] != '') {
            $this->api_key = $_SERVER['WEATHER_OPENWEATHER_API_KEY'];
        }
        if (@$_SERVER['WEATHER_LOCATION_LAT'] != '') {
            $this->lat = $_SERVER['WEATHER_LOCATION_LAT'];
        }
        if (@$_SERVER['WEATHER_LOCATION_LON'] != '') {
            $this->lon = $_SERVER['WEATHER_LOCATION_LON'];
        }
    }

    protected function getRequest()
    {
        if (
            $this->getRequestMethod() === 'GET' &&
            $this->getRequestPathFirst() === 'weather' &&
            $this->getRequestPathSecond() === null
        ) {
            return $this->index();
        }
    }

    protected function index()
    {
        $response = @file_get_contents(
            'https://api.openweathermap.org/data/2.5/onecall' .
                '?lat=' .
                $this->lat .
                '&lon=' .
                $this->lon .
                '&exclude=current,minutely,hourly,alerts' .
                '&units=metric' .
                '&appid=' .
                $this->api_key
        );
        if ($response == '' || strpos($response, '"lat"') === false) {
            $this->response([
                'success' => false,
                'data' => null,
            ]);
        }
        $response = json_decode($response);
        $data = [];
        foreach ($response->daily as $response__value) {
            $data[date('Y-m-d', $response__value->dt)] = [
                'temp' => round(@$response__value->temp->day != '' ? $response__value->temp->day : 0),
                'rain' => round(@$response__value->rain != '' ? $response__value->rain : 0),
            ];
        }
        $this->response([
            'success' => true,
            'data' => $data,
        ]);
    }
}

<?php
namespace HoseaApi;

require_once __DIR__ . '/../../vendor/autoload.php';

use vielhuber\simpleauth\simpleauth;
use vielhuber\dbhelper\dbhelper;

class Api
{
    public static $db = null;
    public static $auth = null;

    public function __construct()
    {
        $this->initDb();
        $this->checkAuth();
        $this->getRequest();
    }

    public function __get($class)
    {
        $class = '\\HoseaApi\\' . $class;
        return new $class();
    }

    protected function checkAuth()
    {
        $success = true;
        if ($this->getRequestPathFirst() === 'cron') {
            if (
                $this->getRequestPathSecond() == '' ||
                $this::$db->fetch_var('SELECT COUNT(*) FROM users WHERE api_key = ?', $this->getRequestPathSecond()) ==
                    0
            ) {
                $success = false;
            }
        } elseif ($this->getRequestPathFirst() === 'ical') {
            if (
                $this->getRequestPathSecond() == '' ||
                $this::$db->fetch_var('SELECT COUNT(*) FROM users WHERE api_key = ?', $this->getRequestPathSecond()) ==
                    0
            ) {
                $success = false;
            }
        } else {
            $this::$auth = new simpleauth(__DIR__ . '/../../.env');
            if (!$this::$auth->isLoggedIn()) {
                $success = false;
            }
        }
        if ($success === false) {
            $this->response(
                [
                    'success' => false,
                    'message' => 'auth not successful',
                    'public_message' => 'Authentifizierung fehlgeschlagen',
                ],
                401
            );
        }
    }

    protected function initDb()
    {
        $dotenv = \Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
        $dotenv->load();
        $this::$db = new dbhelper();
        $this::$db->connect(
            'pdo',
            $_SERVER['DB_CONNECTION'],
            $_SERVER['DB_HOST'],
            $_SERVER['DB_USERNAME'],
            $_SERVER['DB_PASSWORD'],
            $_SERVER['DB_DATABASE'],
            $_SERVER['DB_PORT']
        );
    }

    protected function getRequest()
    {
        $this->Ticket->getRequest();
        $this->Attachment->getRequest();
        $this->User->getRequest();
        $this->Weather->getRequest();
        $this->Mail->getRequest();
        $this->Money->getRequest();
        $this->iCal->getRequest();
        $this->Cron->getRequest();
        $this->response(
            [
                'success' => false,
                'message' => 'unknown route',
                'public_message' => 'Unbekannte Route!',
            ],
            404
        );
    }

    protected function getRequestPath()
    {
        $path = $_SERVER['REQUEST_URI'];
        $path = substr($path, strpos($path, '_api') + strlen('_api'));
        $path = trim($path, '/');
        if (strpos($path, '?')) {
            $path = substr($path, 0, strpos($path, '?'));
        }
        return $path;
    }

    protected function getRequestPathFirst()
    {
        $part = explode('/', $this->getRequestPath());
        if (!isset($part[0])) {
            return null;
        }
        return $part[0];
    }

    protected function getRequestPathSecond()
    {
        $part = explode('/', $this->getRequestPath());
        if (!isset($part[1])) {
            return null;
        }
        return $part[1];
    }

    protected function getRequestMethod()
    {
        return $_SERVER['REQUEST_METHOD'];
    }

    protected function getInput($key)
    {
        $p1 = $_POST;
        $p2 = json_decode(file_get_contents('php://input'), true);
        parse_str(file_get_contents('php://input'), $p3);
        if (isset($p1) && !empty($p1) && array_key_exists($key, $p1)) {
            return $p1[$key];
        }
        if (isset($p2) && !empty($p2) && array_key_exists($key, $p2)) {
            return $p2[$key];
        }
        if (isset($p3) && !empty($p3)) {
            foreach ($p3 as $p3__key => $p3__value) {
                unset($p3[$p3__key]);
                $p3[str_replace('amp;', '', $p3__key)] = $p3__value;
            }
            if (array_key_exists($key, $p3)) {
                return $p3[$key];
            }
        }
        return null;
    }

    protected function response($data, $code = 200)
    {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode($data);
        die();
    }

    public function colsWithout(...$array)
    {
        $ret = [];
        foreach ($this->cols as $cols__value) {
            if (!in_array($cols__value, $array)) {
                $ret[] = $cols__value;
            }
        }
        return $ret;
    }
}

$api = new Api();

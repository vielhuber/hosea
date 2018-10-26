<?php
namespace HoseaApi;

use Dotenv\Dotenv;
use vielhuber\simpleauth\simpleauth;
use vielhuber\dbhelper\dbhelper;
require_once __DIR__ . '/../../vendor/autoload.php';

class Api
{
    public static $db = null;
    public static $auth = null;

    public function __construct()
    {
        $this->checkAuth();
        $this->initDb();
        $this->getRequest();
    }

    public function __get($class)
    {
        $class = '\\HoseaApi\\' . $class;
        return new $class();
    }

    protected function checkAuth()
    {
        $this::$auth = new simpleauth(__DIR__ . '/../../.env');
        if (!$this::$auth->isLoggedIn()) {
            $this->response(
                [
                    'success' => false,
                    'message' => 'auth not successful',
                    'public_message' => 'Authentifizierung fehlgeschlagen'
                ],
                401
            );
        }
    }

    protected function initDb()
    {
        $dotenv = new Dotenv(__DIR__ . '/../../');
        $dotenv->load();
        $this::$db = new dbhelper();
        $this::$db->connect(
            'pdo',
            getenv('DB_CONNECTION'),
            getenv('DB_HOST'),
            getenv('DB_USERNAME'),
            getenv('DB_PASSWORD'),
            getenv('DB_DATABASE'),
            getenv('DB_PORT')
        );
    }

    protected function getRequest()
    {
        $this->Ticket->getRequest();
        $this->Attachment->getRequest();
        $this->response(
            [
                'success' => false,
                'message' => 'unknown route',
                'public_message' => 'Unbekannte Route!'
            ],
            404
        );
    }

    protected function getRequestPath()
    {
        $path = $_SERVER['REQUEST_URI'];
        $path = substr($path, strpos($path,'_api')+strlen('_api'));
        $path = trim($path, '/');
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
        foreach( $this->cols as $cols__value)
        {
            if( !in_array($cols__value, $array) )
            {
                $ret[] = $cols__value;
            }
        }
        return $ret;
    }
    
}

$api = new Api();

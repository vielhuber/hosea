<?php
require_once __DIR__ . '/../../vendor/autoload.php';

use vielhuber\simpleauth\simpleauth;
use vielhuber\dbhelper\dbhelper;

class Api
{
    private $db = null;
    private $auth = null;

    public function __construct()
    {
        $this->checkAuth();
        $this->initDb();
        $this->getRequest();
    }

    private function checkAuth()
    {
        $this->auth = new simpleauth(__DIR__ . '/../../.env');
        print_r($this->auth->getCurrentUserId());
        die();
        if (!$this->auth->isLoggedIn()) {
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

    private function initDb()
    {
        $dotenv = new Dotenv\Dotenv(__DIR__ . '/../../');
        $dotenv->load();
        $this->db = new dbhelper();
        $this->db->connect(
            'pdo',
            getenv('DB_CONNECTION'),
            getenv('DB_HOST'),
            getenv('DB_USERNAME'),
            getenv('DB_PASSWORD'),
            getenv('DB_DATABASE'),
            getenv('DB_PORT')
        );
    }

    private function getRequest()
    {
        if (
            $this->getRequestMethod() === 'GET' &&
            $this->getRequestPathFirst() === 'tickets' &&
            $this->getRequestPathSecond() === null
        ) {
            return $this->index();
        }
        if (
            $this->getRequestMethod() === 'GET' &&
            $this->getRequestPathFirst() === 'tickets' &&
            is_numeric($this->getRequestPathSecond())
        ) {
            return $this->show($this->getRequestPathSecond());
        }
        if (
            $this->getRequestMethod() === 'POST' &&
            $this->getRequestPathFirst() === 'tickets' &&
            $this->getRequestPathSecond() === null
        ) {
            return $this->create();
        }
        if (
            $this->getRequestMethod() === 'PUT' &&
            $this->getRequestPathFirst() === 'tickets' &&
            is_numeric($this->getRequestPathSecond())
        ) {
            return $this->update($this->getRequestPathSecond());
        }
        if (
            $this->getRequestMethod() === 'DELETE' &&
            $this->getRequestPathFirst() === 'tickets' &&
            is_numeric($this->getRequestPathSecond())
        ) {
            return $this->delete($this->getRequestPathSecond());
        }
        $this->response(
            [
                'success' => false,
                'message' => 'unknown route',
                'public_message' => 'Unbekannte Route!'
            ],
            404
        );
    }

    private function getRequestPath()
    {
        $path = $_SERVER['REQUEST_URI'];
        $path = str_replace('_api', '', $path);
        $path = trim($path, '/');
        return $path;
    }

    private function getRequestPathFirst()
    {
        $part = explode('/', $this->getRequestPath());
        if (!isset($part[0])) {
            return null;
        }
        return $part[0];
    }

    private function getRequestPathSecond()
    {
        $part = explode('/', $this->getRequestPath());
        if (!isset($part[1])) {
            return null;
        }
        return $part[1];
    }

    private function getRequestMethod()
    {
        return $_SERVER['REQUEST_METHOD'];
    }

    private function index()
    {
        $this->response([
            'success' => true,
            'data' => 'todo'
        ]);
    }

    private function show($id)
    {
        $this->response([
            'success' => true,
            'data' => 'todo'
        ]);
    }

    private function create()
    {
        $this->response([
            'success' => true,
            'data' => 'todo'
        ]);
    }

    private function update($id)
    {
        $this->response([
            'success' => true,
            'data' => 'todo'
        ]);
    }

    private function delete($id)
    {
        $this->response([
            'success' => true
        ]);
    }

    private function response($data, $code = 200)
    {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode($data);
        die();
    }
}

$api = new Api();

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

    private function checkId($id)
    {
        if( $this->db->fetch_var('SELECT COUNT(*) FROM tickets WHERE id = ? AND user_id = ?', $id, $this->auth->getCurrentUserId()) == 0 )
        {
            $this->response(
                [
                    'success' => false,
                    'message' => 'unauthorized',
                    'public_message' => 'Nicht authentifiziert'
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

    private function getInput($key)
    {
        $p1 = $_POST;
        $p2 = json_decode(file_get_contents('php://input'), true);
        parse_str(file_get_contents('php://input'), $p3);
        if( isset($p1) && !empty($p1) && array_key_exists($key, $p1) ) {
            return $p1[$key];
        }
        if( isset($p2) && !empty($p2) && array_key_exists($key, $p2) ) {
            return $p2[$key];
        }        
        if( isset($p3) && !empty($p3) )
        {
            foreach($p3 as $p3__key => $p3__value)
            {
                unset($p3[$p3__key]);
                $p3[str_replace('amp;', '', $p3__key)] = $p3__value;
            }
            if( array_key_exists($key, $p3) ) {
                return $p3[$key];
            }
        }
        return null;
    }

    private function index()
    {
        $this->response([
            'success' => true,
            'data' => $this->db->fetch_all('SELECT * FROM tickets WHERE user_id = ?', $this->auth->getCurrentUserId())
        ]);
    }

    private function show($id)
    {
        $this->checkId($id);
        $this->response([
            'success' => true,
            'data' => $this->db->fetch_all('SELECT * FROM tickets WHERE id = ? AND user_id = ?', $id, $this->auth->getCurrentUserId())
        ]);
    }

    private function create()
    {
        $values = [];
        foreach(['status','priority','date','time','project','description'] as $columns__value)
        {
            $values[$columns__value] = $this->getInput($columns__value);
        }
        $values['user_id'] = $this->auth->getCurrentUserId();
        $this->db->insert('tickets', $values);
        $this->response([
            'success' => true
        ]);
    }

    private function update($id)
    {
        $this->checkId($id);
        $values = [];
        foreach(['status','priority','date','time','project','description'] as $columns__value)
        {
            if( $this->getInput($columns__value) !== null )
            {
                $values[$columns__value] = $this->getInput($columns__value);
            }
        }
        if( !empty($values) )
        {
            $this->db->update('tickets', $values, ['id' => $id]);
        }
        $this->response([
            'success' => true
        ]);
    }

    private function delete($id)
    {
        $this->checkId($id);
        $this->db->delete('tickets', ['id' => $id]);
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

<?php
require_once __DIR__ . '/../vendor/autoload.php';

use vielhuber\dbhelper\dbhelper;

class Cli
{
    private $db = null;

    function __construct()
    {
        $dotenv = new Dotenv\Dotenv(__DIR__ . '/../');
        $dotenv->load();
        $this->db = new dbhelper();
        $this->db->connect(
            'pdo',
            getenv('DB_ENGINE'),
            getenv('DB_HOST'),
            getenv('DB_USERNAME'),
            getenv('DB_PASSWORD'),
            getenv('DB_DATABASE'),
            getenv('DB_PORT')
        );
    }

    function migrate()
    {
        $this->db->query('
            DROP TABLE IF EXISTS tickets
        ');
        $this->db->query(
            '
            CREATE TABLE IF NOT EXISTS tickets
            (
                id SERIAL PRIMARY KEY,
                status TEXT DEFAULT NULL,
                priority TEXT DEFAULT NULL,
                date TEXT DEFAULT NULL,
                time TEXT DEFAULT NULL,
                project TEXT DEFAULT NULL,
                description TEXT DEFAULT NULL,
                user TEXT DEFAULT NULL
            )
        '
        );
    }

    function seed()
    {
        $this->db->clear('tickets');
        $this->db->insert('tickets', [
            'status' => 'scheduled',
            'priority' => 'A',
            'date' => '2018-08-10T09:00:00\n2018-08-10T18:00:00',
            'time' => '9',
            'project' => 'HovawartDB',
            'description' => 'Siehe Word',
            'user' => 'david@vielhuber.de'
        ]);
        $this->db->insert('tickets', [
            'status' => 'scheduled',
            'priority' => 'A',
            'date' => '2018-08-10T09:00:00\n2018-08-10T18:00:00',
            'time' => '9',
            'project' => 'HovawartDB',
            'description' => 'Siehe Word',
            'user' => 'david@vielhuber.de'
        ]);
        $this->db->insert('tickets', [
            'status' => 'scheduled',
            'priority' => 'A',
            'date' => '2018-08-10T09:00:00\n2018-08-10T18:00:00',
            'time' => '9',
            'project' => 'HovawartDB',
            'description' => 'Siehe Word',
            'user' => 'david@vielhuber.de'
        ]);
    }
}

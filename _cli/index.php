<?php
require_once __DIR__ . '/../vendor/autoload.php';

use vielhuber\dbhelper\dbhelper;

class Cli
{
    private $db = null;

    function __construct()
    {
        $dotenv = \Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
        $dotenv->load();
        $this->db = new dbhelper();
        $this->db->connect(
            'pdo',
            $_SERVER['DB_CONNECTION'],
            $_SERVER['DB_HOST'],
            $_SERVER['DB_USERNAME'],
            $_SERVER['DB_PASSWORD'],
            $_SERVER['DB_DATABASE'],
            $_SERVER['DB_PORT']
        );
    }

    function migrate()
    {
        $this->db->query('
            DROP TABLE IF EXISTS users
        ');
        $this->db->query(
            '
            CREATE TABLE IF NOT EXISTS users
            (
                id SERIAL PRIMARY KEY,
                email TEXT DEFAULT NULL,
                password TEXT DEFAULT NULL,
                ical_key TEXT DEFAULT NULL
            )
        '
        );
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
                user_id INT DEFAULT NULL,
                updated_at TEXT DEFAULT NULL
            )
        '
        );
        $this->db->query(
            '
            DROP TABLE IF EXISTS attachments
        '
        );
        $this->db->query(
            '
            CREATE TABLE IF NOT EXISTS attachments
            (
                id SERIAL PRIMARY KEY,
                name TEXT DEFAULT NULL,
                data ' .
                ($this->db->engine === 'postgres' ? 'BYTEA' : 'MEDIUMBLOB') .
                ' DEFAULT NULL,
                ticket_id INT DEFAULT NULL
            )
        '
        );
    }

    function seed()
    {
        $this->db->clear('users');
        $this->db->insert('users', [
            'email' => 'david@vielhuber.de',
            'password' => password_hash('secret', PASSWORD_DEFAULT),
            'ical_key' => md5(uniqid(mt_rand(), true)),
        ]);

        $this->db->clear('tickets');
        $this->db->insert('tickets', [
            'status' => 'scheduled',
            'priority' => 'A',
            'date' => '2018-08-10T09:00:00\n2018-08-10T18:00:00',
            'time' => '9',
            'project' => 'HovawartDB',
            'description' => 'Siehe Word',
            'user_id' => 1,
        ]);
        $this->db->insert('tickets', [
            'status' => 'scheduled',
            'priority' => 'A',
            'date' => '2018-08-10T09:00:00\n2018-08-10T18:00:00',
            'time' => '9',
            'project' => 'HovawartDB',
            'description' => 'Siehe Word',
            'user_id' => 1,
        ]);
        $this->db->insert('tickets', [
            'status' => 'scheduled',
            'priority' => 'A',
            'date' => '2018-08-10T09:00:00\n2018-08-10T18:00:00',
            'time' => '9',
            'project' => 'HovawartDB',
            'description' => 'Siehe Word',
            'user_id' => 1,
        ]);

        file_put_contents('test.txt', str_repeat('abc', 999999));
        $this->db->clear('attachments');
        $this->db->insert('attachments', [
            'name' => 'test.txt',
            'data' => file_get_contents('test.txt'),
            'ticket_id' => 1,
        ]);
        unlink('test.txt');
    }
}

<?php
// include composer
require_once __DIR__ . '/../vendor/autoload.php';
use vielhuber\dbhelper\dbhelper;

// increase limits
set_time_limit(0);
ini_set('max_execution_time', 3000);
ini_set('memory_limit','2000M');

// read json backup
$backup = file_get_contents('../_backup/_08_22_2018.json');
$backup = json_decode($backup);

// include database
$dotenv = new Dotenv\Dotenv(__DIR__ . '/../');
$dotenv->load();
$db = new dbhelper();
$db->connect(
    'pdo',
    getenv('DB_CONNECTION'),
    getenv('DB_HOST'),
    getenv('DB_USERNAME'),
    getenv('DB_PASSWORD'),
    getenv('DB_DATABASE'),
    getenv('DB_PORT')
);
$db->query('TRUNCATE TABLE attachments');
$db->query('TRUNCATE TABLE tickets');

foreach($backup->docs as $docs__value)
{
    // migrate tickets
    $ticket_id = $db->insert('tickets', [
        'status' => $docs__value->status,
        'priority' => $docs__value->priority,
        'date' => $docs__value->date,
        'time' => $docs__value->time,
        'project' => $docs__value->project,
        'description' => $docs__value->description,
        'user_id' => 1
    ]);
    // migrate attachments
    if( !empty($docs__value->_attachments) )
    {
        foreach($docs__value->_attachments as $attachments__key=>$attachments__value)
        {
            $db->insert('attachments', [
                'name' => explode('#',$attachments__key)[1],
                //'data' => $attachments__value->data,
                'data' => file_get_contents('test.msg'),
                'ticket_id' => $ticket_id
            ]);
        }
    }
}

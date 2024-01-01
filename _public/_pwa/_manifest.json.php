<?php
header('Content-Type: application/json');
$json = file_get_contents('_manifest.json');
if (strpos(@$_SERVER['HTTP_HOST'], 'local') !== false) {
    $json = str_replace('%SUBPATH%', '', $json);
} else {
    $json = str_replace('%SUBPATH%', '/hosea', $json);
}
echo $json;

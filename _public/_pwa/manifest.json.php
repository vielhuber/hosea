<?php
header('Content-Type: application/json');
$json = file_get_contents('manifest.json');
if (strpos(@$_SERVER['REQUEST_URI'], 'hosea') === false) {
    $json = str_replace('%SUBPATH%', '', $json);
} else {
    $json = str_replace('%SUBPATH%', '/hosea', $json);
}
echo $json;

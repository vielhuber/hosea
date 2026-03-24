<?php
require __DIR__ . '/../../vendor/autoload.php';

use vielhuber\simplemcp\simplemcp;

new simplemcp(
    name: 'hosea-mcp-server',
    log: 'mcp-server.log',
    discovery: './../_api',
    auth: 'static', // 'static'|'totp'
    env: '.env'
);

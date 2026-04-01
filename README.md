[![GitHub Tag](https://img.shields.io/github/v/tag/vielhuber/hosea)](https://github.com/vielhuber/hosea/tags)
[![Code Style](https://img.shields.io/badge/code_style-psr--12-ff69b4.svg)](https://www.php-fig.org/psr/psr-12/)
[![License](https://img.shields.io/github/license/vielhuber/hosea)](https://github.com/vielhuber/hosea/blob/main/LICENSE.md)
[![Last Commit](https://img.shields.io/github/last-commit/vielhuber/hosea)](https://github.com/vielhuber/hosea/commits)

# ☕ hosea ☕

hosea is a personal assistant.

![](https://github.com/vielhuber/hosea/raw/main/screenshot.png)

## features

- ticket table view
- scheduler views (fixed, shifting, different week numbers)
- recurring events
- convert recurring events to scheduled events
- attach emails or documents to tickets
- can be controlled keyboard-only
- full mobile support (pwa included)
- live sync changes from different devices
- advanced sorting and filtering of tickets
- frontend/backend validation
- all data (including attachments) are inside the db
- supports mysql/postgres databases
- save login system using jwt
- live ical export for outlook integration
- light mail client included (exchange oauth2 supported)
- stats for your personal finance
- mcp server support

## installation

### app

- clone the repository
- `composer install`

### config

- `cp .env.example .env`
- `vi .env`

### database

- create a new empty database
- run `php migrate` to create the schema
- if you want some test data, also run `php seed`

### host

- point a vhost to the `_public` folder
- if you want to have the application run inside a subfolder of an existing domain
    - deploy the app outside of the root folder (e.g. `/var/hosea`)
    - create a symlink (`ln -s /var/hosea/_public /var/www/hosea`)
- open up the url and have fun

### cron

- to speed up caching and improve garbage collecting, point a recurring cronjob running every 5 minutes that calls https://tld.com/_api/cron/%API_KEY%
- you can find this link in the bottom right ("\_cron") of the gui

### mcp

- `cp _public/_mcp/.env.example _public/_mcp/.env`
- `vi _public/_mcp/.env`
- connect to `https://tld.com/_mcp/mcp-server.php` with header `Authorization: Bearer %MCP_TOKEN%`

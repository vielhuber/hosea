# ☕ hosea ☕

hosea is a personal assistant.

![](https://github.com/vielhuber/hosea/raw/master/screenshot.png)

## features

-   ticket table view
-   scheduler view
-   recurring events
-   convert recurring events to scheduled events
-   attach emails or documents to tickets
-   can be controlled keyboard-only
-   full mobile support
-   advanced sorting and filtering of tickets
-   frontend/backend validation
-   all data (including attachments) are inside the db
-   supports mysql/postgres databases
-   save login system using jwt
-   live ical export for outlook integration

## installation

### app

-   clone the repository
-   `composer install`

### database

-   create a new empty database
-   copy .env.example to .env and fill out your database credentials
-   run `php migrate` to create the schema
-   if you want some test data, also run `php seed`

### host

-   point a vhost to the `_public` folder
-   if you want to have the application run inside a subfolder of an existing domain
    -   deploy the app outside of the root folder (e.g. `/var/hosea`)
    -   create a symlink (`ln -s /var/hosea/_public /var/www/hosea`)
-   open up the url and have fun

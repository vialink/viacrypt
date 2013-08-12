# ![ViaCRYPT](static/img/logo.png)

One time message system.

Install
-------

Dependencies are handled by npm and installed like this:

    npm install

You will also need to install the grunt-cli globally if you don't already have it.

    npm install -g grunt-cli

Compiling
---------

To generate the files from templates, and download required assets simply run grunt.

    grunt

Configurations are found on config.js, copy and adapt yours from the config.js.sample

To regenerate only file from templates run the compile task:

    grunt compile

Running
-------

Should be as simple as

    ./server.js

Then checkout `localhost:8001` to see the app.

Deploying
---------

### Supervisor

Put the following typically on `/etc/supervisor/conf.d/viacrypt.conf`.

    [program:viacrypt]
    command=/path/to/viacrypt/server.js
    stdout_logfile=/path/to/viacrypt/logs/viacrypt.log

To start it:

    supervisorctl start viacrypt

Supervisor has the advantage of automatic restart of the process on failures.

### Upstart

Put the following typically on `/etc/init/viacrypt.conf`.

    description "ViaCRYPT node.js server"
    start on startup
    stop on shutdown
    exec /path/to/viacrypt/server.js >> /path/to/viacrypt/logs/viacrypt.log

To start it:

    start viacrypt

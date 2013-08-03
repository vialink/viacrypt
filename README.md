# ![ViaCRYPT](http://viacry.pt/img/logo.png)

One time message system.

Install
-------

Dependencies are handled by npm and installed like this:

    npm install

Compiling
---------

Required files are generated with compile.js, and needed assets
are gotten with get\_assets:

(Note: this is still a bit cumbersome)

    ./compile.js
    ./get_assets

Configurations are found on config.json, copy yours from
the config.json.sample

Running
-------

Should be as simple as

    ./server.js

Then checkout `localhost:8001` to see the app.

Supervisor
----------

    [program:viacrypt]
    command=/path/to/viacrypt/server.js
    stdout_logfile=/path/to/viacrypt/logs/viacrypt.log

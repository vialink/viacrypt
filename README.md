# ![ViaCRYPT](static/img/logo.png)

One time read messaging system. You can try it at [http://viacry.pt/](http://viacry.pt/).

Requirements
------------

* [Node.js](http://nodejs.org/)

Install
-------

Dependencies are handled by npm and installed like this:

    npm install

Compiling
---------

Required files are generated with compile.js, and needed assets
are gotten with getassets.js:

(Note: this is still a bit cumbersome)

    ./compile.js
    ./getassets.js

Configurations are found on config.js, copy and adapt yours from
the config.js.sample. Any change in config.js demands rerun compile.js.

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

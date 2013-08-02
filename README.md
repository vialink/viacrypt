ViaCRYPT
========

One time message system.

Supervisor
----------

    [program:viacrypt]
    command=/path/to/viacrypt/server.js
    stdout_logfile=/path/to/viacrypt/logs/viacrypt.log

Install
-------

Dependencies are handled by npm and installed like this:

    npm install

Running
-------

Should be as simple as

    ./server.js

Note that static/index.html is not served by nodejs, and
it cannot be served through `file://`, i.e. opening the file.

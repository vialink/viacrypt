# [![ViaCRYPT](assets/img/logo.png)](https://viacry.pt/)

One time read messaging system. You can try it at [viacry.pt](https://viacry.pt/).

## Quick Start

Assuming you have `node.js` and `grunt-cli` and just cloned the project.

### Development

    npm install
    grunt run
    # go to localhost:8001 and have fun developing

### Production

    npm install
    # configure config/server.js
    grunt
    # automate the following with supervisor/upstart/...
    ./bin/viacrypt-server
    # go to yourserver.com if you either have configured port 80
    # or proxied it to 8001 and enjoy your deployment

## Getting Started

### Requirements

- [node.js](http://nodejs.org/)
- [grunt-cli](http://gruntjs.com/getting-started)

Dependencies are handled by npm and installed like this:

    npm install

You will also need to install the grunt-cli globally if you don't already have it.

    npm install -g grunt-cli

### Configuring

Currently we're using [node-config](http://lorenwest.github.io/node-config/latest/) to manage
configurations.

Typically you should `config/development.js` (or `.json`, `.yaml`, `.yml`) to set your specific
preferences. It is also possible to create multiple configuration environments and also custom
configs to a machine hostname. You should read [the node-config documentation](http://lorenwest.github.io/node-config/latest/)
for more information on that regard.

An `static` directory is generated from the `assets` and `templates` dirs, and some dependencies
that need to be downloaded. Those tasks are automated with grunt.

To generate the static dir, simply run `grunt` on the project root:

    grunt

That step is needed when using `./bin/viacrypt-server` to update the files it will serve, or when
serving the files with your http server (nginx, varnish, apache, ...).

### Running

Should be as simple as

    ./bin/viacrypt-server

or

    grunt run

for development, this one will recompile and reload on demand as sources change, more a less like
django's `./manage runserver`.

Then checkout `localhost:8001` (or whatever you have configured) to see the app.

## Translating

Translations are being done with gettext and translation files should be located on `locale/<LANG>/messages.po`.

The current scheme still needs some polishing, we could compile the .po to .mo and ease the extraction.

Although there is an `xgettext` task, using [handlebars-xgettext](https://github.com/gmarty/handlebars-xgettext)
package yield better results, as the current task will not extract source lines.

To create a new translation one can use `locale/messages.pot` as a template.

There is a script to update the current translations, it is the recommended way right now.

    ./xgettext.sh

We are aware that it only works on POSIX systems and `handlebars-xgettext` and `po2json` are
required to be installed globaly contributions to improve this subsystem are very welcome.


## Deploying

### Supervisor

Put the following typically on `/etc/supervisor/conf.d/viacrypt.conf`.

    [program:viacrypt]
    command=/path/to/viacrypt/bin/viacrypt-server
    stdout_logfile=/path/to/viacrypt/logs/viacrypt.log

To start it:

    supervisorctl start viacrypt

Supervisor has the advantage of automatic restart of the process on failures.

### Upstart

Put the following typically on `/etc/init/viacrypt.conf`.

    description "ViaCRYPT node.js server"
    start on startup
    stop on shutdown
    exec /path/to/viacrypt/bin/viacrypt-server >> /path/to/viacrypt/logs/viacrypt.log

To start it:

    start viacrypt

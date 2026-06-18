// nconf.js - setup configuration
var nconf = require('nconf');

// nconf 0.13's .argv() is backed by yargs, which by default intercepts
// --help/--version and exits the process. That would shadow the commander
// based CLI in ironbane.js, so hand nconf a yargs instance with those
// disabled and let commander own --help/--version.
var yargs = require('yargs')(process.argv.slice(2))
    .help(false)
    .version(false);

// Setup nconf to use (in-order):
//   1. Command-line arguments
//   2. Environment variables
//   3. 'config.json'
//
nconf.argv(yargs)
    .env()
    .file({ file: __dirname + '/config.json' });

// if not provided use these values
nconf.defaults({
    root: '',
    game_root: '/game',
    game_host: 'localhost',
    mysql_host: 'localhost',
    mysql_user: 'root',
    mysql_password: '',
    mysql_database: 'ironbane',

    buildTarget: 'deploy/', // replaces old clientDir

    assetDir: 'IronbaneAssets/',

    cryptSalt: '',
    isProduction: false,
    log_level: 0, // 5 is highest
    use_repl: true,
    use_netrepl: false,
    server_port: 8080,
    session_secret: 'horsehead bookends',
    // game settings
    game: {
        timeouts: {
            playerSpawn: 5,
            npcSpawn: 10
        },
        spawns: {
            guest: {
                zone: 1,
                position: {x: 10, y: 0, z: 0}
            },
            normal: {
                zone: 1,
                position: {x: 3, y: 20, z: -4}
            },
            tutorial: {
                zone: 3,
                position: {x: 42, y: 57, z: 59}
            }
        }
    },
    irc: {
        enabled: false, // default false so contributors dont *have* to flood the channel with Ironbane clones :)
        server: 'irc.freenode.net',
        nick: 'Ironbane',
        channels: ['#ironbane']
    },
    // integrate with Github API
    github: {
        enabled: false,
        username: 'FOO',
        password: 'BAR'
    }
});

// send this configured reference
module.exports = nconf;
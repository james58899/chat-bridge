'use strict';
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const readline = require('readline');
const rl = readline.createInterface(process.stdin, process.stdout);
const ignore = require(path.resolve('data', 'ignore.json'));

class Emitter extends EventEmitter {}

const Hub = new Emitter();
Hub.message = function(from, sender, message) {
    console.log(`(${from}) ${sender}: ${message}`);
    if (checkIgnore(sender)) {
        this.emit('message', from, sender, message);
    }
};

const checkIgnore = function(nick) {
    let result = true;
    ignore.forEach(function(ignore) {
        if (nick.match(new RegExp(ignore, 'gi'))) {
            result = false;
        }
    });
    return result;
};

// CLI
rl.setPrompt('> ');
rl.prompt();
rl.on('line', (line) => {
    line = line.trim().split(' ');
    switch (line[0]) {
    case 'ban':
        if (line.length === 2 && ignore.indexOf(line[1]) < 0) {
            ignore.push(line[1]);
            fs.writeFile(path.resolve('data', 'ignrore.json'), JSON.stringify(ignore), function(err) {
                if (err) {
                    throw err;
                }
                console.log('已封鎖 ' + line[1]);
            });
        } else {
            console.log('對象無效或已在忽略名單中');
        }
        break;
    case 'unban':
        if (line.length === 2 && ignore.indexOf(line[1]) > -1) {
            ignore.splice(ignore.indexOf(line[1]), 1);
            fs.writeFile(path.resolve('data', 'ignrore.json'), JSON.stringify(ignore), function(err) {
                if (err) throw err;
                console.log('已解除封鎖 ' + line[1]);
            });
        } else {
            console.log('對象無效或未在忽略名單中');
        }
        break;
    }
    rl.prompt();
}).on('close', () => process.exit(0));

// Init Modules
console.log('Loading modules...');
fs.readdir('modules', function(err, files) {
    if (err) throw err;

    for (const file of files) {
        try {
            require(path.resolve('modules', file))(Hub);
            console.log('Loaded module %s !', file);
        } catch (error) {
            console.error(`Can't load module ${file}`, error);
        }
    }
});

process.on('uncaughtException', function(ex) {
    console.error(ex);
});

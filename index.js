'use strict';
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
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

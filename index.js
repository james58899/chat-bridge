const fs = require('fs'),
    EventEmitter = require('events'),
    readline = require('readline'),
    rl = readline.createInterface(process.stdin, process.stdout);

var ignore = require("./data/ignore.json");

class Emitter extends EventEmitter {}

var Hub = new Emitter();
Hub.message = function (from, sender, message) {
    console.log(`(${from}) ${sender}: ${message}`);
    if (checkIgnore(sender)) {
        this.emit('message', from, sender, message);
    }
};

const checkIgnore = function (nick) {
    var result = true;
    ignore.forEach(function (ignore) {
        if (nick.match(new RegExp(ignore, 'gi'))) {
            result = false;
        }
    });
    return result;
};

//CLI
rl.setPrompt('> ');
rl.prompt();
rl.on('line', (line) => {
    line = line.trim().split(' ');
    switch (line[0]) {
    case 'ban':
        if (line.length === 2 && ignore.indexOf(line[1]) < 0) {
            ignore.push(line[1]);
            fs.writeFile('./data/ignore.json', JSON.stringify(ignore), function (err) {
                if (err) throw err;
                console.log("已封鎖 " + line[1]);
            });
        }
        else {
            console.log('對象無效或已在忽略名單中');
        }
        break;
    case 'unban':
        if (line.length === 2 && ignore.indexOf(line[1]) > -1) {
            ignore.splice(ignore.indexOf(line[1]), 1);
            fs.writeFile('./data/ignore.json', JSON.stringify(ignore), function (err) {
                if (err) throw err;
                console.log("已解除封鎖 " + line[1]);
            });
        }
        else {
            console.log('對象無效或未在忽略名單中');
        }
        break;
    }
    rl.prompt();
});

//Init Modules
(function () {
    console.log('Loading modules...');
    fs.readdir('modules', function (err, files) {
        if (err) throw err;
        for (var i = 0; i < files.length; i++) {
            require('./modules/' + files[i])(Hub);
            console.log('Loaded module %s !', files[i]);
        }
    });
})();

process.on('uncaughtException', function (ex) {
    console.log(ex.stack);
});

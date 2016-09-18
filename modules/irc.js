const irc = require('irc');
const util = require('util');
const Pastee = require('pastee');
const config = require('../data/irc.json');

var main;

var paste = new Pastee();
var bot = new irc.Client(config.host, config.nick, {
    channels: [config.channel],
    userName: config.username,
    realName: config.realname,
    port: config.port,
    secure: config.secure,
    stripColors: true
});

bot.on('message' + config.channel, (sender, message) => {
    main.message('IRC', sender, message);
});

bot.on('action', (sender, message) => {
    main.message('IRC', sender, '/me ' + message);
});

module.exports = Hub => {
    main = Hub;
    main.on('message', (from, sender, message) => {
        setImmediate(() => {
            if (from !== 'IRC') {
                if (Buffer.byteLength(message, 'utf8') > 300) {
                    paste.paste(message, (err, res) => {
                        bot.say(config.channel, util.format('<%s>: %s', sender, res.raw));
                        if (err) {
                            console.log(err);
                        }
                    });
                }
                else {
                    bot.say(config.channel, util.format('<%s>: %s', sender, message.replace(/\s/g, ' ')));
                }
            }
        });
    });
};
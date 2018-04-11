'use strict';
const {resolve} = require('path');
const {format} = require('util');
const irc = require('irc-upd');
const Pastee = require('pastee');
const config = require(resolve('data', 'irc.json'));

let main;
let paste;

const bot = new irc.Client(config.host, config.nick, {
    channels: [config.channel],
    userName: config.username,
    realName: config.realname,
    port: config.port,
    secure: config.secure,
    stripColors: true
});

if (config.pasteeToken) {
    console.log(config.pasteeToken);
    paste = new Pastee(config.pasteeToken);
} else {
    paste = new Pastee();
}

bot.on('registered', (message) => {
    console.log('Connected to irc.');
});

bot.on('message' + config.channel, (sender, message) => {
    main.message('IRC', sender, message);
});

bot.on('action', (sender, to, message) => {
    if (to === config.channel) {
        main.message('IRC', sender, '/me ' + message);
    }
});

module.exports = (Hub) => {
    main = Hub;
    main.on('message', (from, sender, message) => {
        setImmediate(() => {
            if (from === 'IRC') return;

            // Send large message to pastee
            if (Buffer.byteLength(message, 'utf8') > 300) {
                paste.paste(message, (err, res) => {
                    bot.say(config.channel, format('<%s>: %s', sender, res.raw));
                    if (err) {
                        console.log(err);
                    }
                });
                return;
            }

            bot.say(config.channel, format('<%s>: %s', sender, message.replace(/\s/g, ' ')));

            // URL Title
            if (config.title && /https?:\/\/\S*/ig.test(message)) {
                const url = require('url');
                const request = require('request');
                const iconv = require('iconv-lite');
                const jschardet = require('jschardet');
                const cheerio = require('cheerio');
                const urls = message.match(/https?:\/\/\S*/ig);
                urls.forEach((uri) => {
                    const options = {
                        url: encodeURI(decodeURIComponent(url.parse(uri).href)),
                        headers: {
                            'User-Agent': 'request',
                            'Cookie': 'over18=1',
                            'Accept-Language': 'zh-TW,zh;q=0.8,en-US;q=0.5,en;q=0.3'
                        },
                        gzip: true,
                        encoding: null
                    };
                    request(options, (error, response, body) => {
                        if (error) {
                            return;
                        }
                        const $ = cheerio.load(iconv.decode(body, jschardet.detect(body).encoding));
                        const title = $('title').text().trim().replace(/\s/g, ' ');
                        if (title) {
                            bot.say(config.channel, '[Title] ' + title);
                        }
                    });
                });
            }
        });
    });
};

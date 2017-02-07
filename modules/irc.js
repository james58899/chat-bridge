"use strict";
const irc = require('irc'),
    util = require('util'),
    Pastee = require('pastee'),
    config = require('../data/irc.json');

let main;

const paste = new Pastee();
const bot = new irc.Client(config.host, config.nick, {
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

bot.on('action', (sender, to, message) => {
    if (to === config.channel) {
        main.message('IRC', sender, '/me ' + message);
    }
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

                    //URL Title
                    if (config.title && /https?:\/\/\S*/ig.test(message)) {
                        let url = require('url'),
                            request = require("request"),
                            iconv = require('iconv-lite'),
                            charsetDetector = require("node-icu-charset-detector"),
                            cheerio = require('cheerio'),
                            urls = message.match(/https?:\/\/\S*/ig);
                        urls.forEach(uri => {
                            let options = {
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
                                if (error) return;
                                let $ = cheerio.load(iconv.decode(body, charsetDetector.detectCharset(body)));
                                let title = $('title').text().trim().replace(/\s/g, ' ');
                                if (title) bot.say(config.channel, '[Title] ' + title);
                            });
                        });
                    }
                }
            }
        });
    });
};

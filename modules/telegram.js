const TelegramBot = require('node-telegram-bot-api');
const util = require('util');
const imgur = require('imgur');
const config = require('../data/telegram.json');

var main, username;

imgur.setClientId('41ad90f344bdf2f');
var bot = new TelegramBot(config.token, {
    polling: {
        timeout: 60,
        interval: 0
    }
});

bot.getMe().then(me => username = me.username);

bot.on('message', (msg) => {
    if (msg.chat.id === config.ChatID) {
        var send = (message) => {
            if (msg.reply_to_message) {
                if (msg.reply_to_message.text) {
                    if (msg.reply_to_message.from.username === username) {
                        var ReplyUsername = msg.reply_to_message.text.match(/<\S+>/i)[1];
                        var ShortMessage;
                        if (msg.reply_to_message.text.replace(/^<\S+>: /i, '').length > 5) {
                            ShortMessage = msg.reply_to_message.text.replace(/^<\S+>: /i, '').substr(0, 5) + '...';
                        }
                        else {
                            ShortMessage = msg.reply_to_message.text.replace(/^<\S+>: /i, '');
                        }
                        main.message('Telegram', msg.from.username, util.format('(%s: %s) %s', ReplyUsername, ShortMessage, message));
                    }
                    else {
                        var ShortMessage;
                        if (msg.reply_to_message.text.length > 5) {
                            ShortMessage = msg.reply_to_message.text.replace(/\s/g, ' ').substr(0, 5) + '...';
                        }
                        else {
                            ShortMessage = msg.reply_to_message.text.replace(/\s/g, ' ');
                        }
                        main.message('Telegram', msg.from.username, util.format('(%s: %s) %s', msg.reply_to_message.from.username, ShortMessage, message));
                    }
                }
                else {
                    if (msg.reply_to_message.from.username === username) {
                        var ReplyUsername = msg.reply_to_message.text.match(/<\S+>/i)[0].match(/[^<>]+/i)[0];
                        main.message('Telegram', msg.from.username, util.format('(reply %s) %s', ReplyUsername, message));
                    }
                    else {
                        main.message('Telegram', msg.from.username, util.format('(reply %s) %s', msg.reply_to_message.from.username, message));
                    }
                }
            }
            else {
                main.message('Telegram', msg.from.username, message);
            }
        };
        if (msg.text) {
            send(msg.text);
        }
        if (msg.photo) {
            var fileId = msg.photo[msg.photo.length - 1].file_id;
            bot.getFileLink(fileId).then((url) => {
                imgur.uploadUrl(url)
                    .then(res => send(res.data.link))
                    .catch(err => console.error(err.message));
            });
        }
        if (msg.caption) {
            send(msg.caption);
        }
        if (msg.sticker) {
            bot.getFileLink(msg.sticker.file_id).then(function(url) {
                imgur.uploadUrl(url).then(function(res) {
                    send(res.data.link);
                }).catch(function(err) {
                    console.error(err.message);
                });
            });
        }
    }
});

module.exports = Hub => {
    main = Hub;
    main.on('message', (from, sender, message) => {
        setImmediate(() => {
            if (from !== 'Telegram') {
                bot.sendMessage(config.ChatID, util.format('<%s>: %s', sender, message));
            }
        });
    });
};
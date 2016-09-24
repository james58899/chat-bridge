const TelegramBot = require('node-telegram-bot-api'),
    util = require('util'),
    imgur = require('imgur'),
    fs = require('fs'),
    sharp = require('sharp'),
    exec = require('child_process').exec,
    config = require('../data/telegram.json');

let main, username;

imgur.setClientId('41ad90f344bdf2f');
const bot = new TelegramBot(config.token, {
    polling: {
        timeout: 60,
        interval: 0
    }
});

exec('rm -rf TGtmp_*');
bot.getMe().then(me => username = me.username);

bot.on('message', msg => {
    if (msg.chat.id === config.ChatID) {
        // console.log(msg);
        var send = message => {
            if (msg.reply_to_message) {
                if (msg.reply_to_message.text) {
                    if (msg.reply_to_message.from.username === username) {
                        let ReplyUsername = msg.reply_to_message.text.match(/<\S+>/i)[1];
                        let ShortMessage;
                        if (msg.reply_to_message.text.replace(/^<\S+>: /i, '').length > 5) {
                            ShortMessage = msg.reply_to_message.text.replace(/^<\S+>: /i, '').substr(0, 5) + '...';
                        }
                        else {
                            ShortMessage = msg.reply_to_message.text.replace(/^<\S+>: /i, '');
                        }
                        main.message('Telegram', msg.from.username, util.format('(%s: %s) %s', ReplyUsername, ShortMessage, message));
                    }
                    else {
                        let ShortMessage;
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
                        let ReplyUsername = msg.reply_to_message.text.match(/<\S+>/i)[0].match(/[^<>]+/i)[0];
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
            let fileId = msg.photo[msg.photo.length - 1].file_id;
            bot.getFileLink(fileId).then((url) => {
                imgur.uploadUrl(url)
                    .then(res => {
                        if (msg.caption) {
                            send(util.format(`${res.data.link} ${msg.caption}`));
                        }
                        else {
                            send(res.data.link);
                        }
                    })
                    .catch(err => console.error(err.message));
            });
        }
        if (msg.sticker) {
            // let filename = Math.floor((Math.random() * 1000) + 1) + '.webp';
            let tmp = fs.mkdtempSync('./TGtmp_');
            bot.downloadFile(msg.sticker.file_id, tmp)
                .then(path => {
                    sharp(path).toFile(path + '.png')
                        .then(() => imgur.uploadFile(path + '.png')
                            .then(res => {
                                send(msg.sticker.emoji + ' ' + res.data.link);
                                fs.unlink(path);
                                fs.unlink(path + '.png', () => fs.rmdir(tmp));
                            }));
                });
        }
    }
});

// bot.on('edited_message', (msg => {
//     console.log(msg);
// }));

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

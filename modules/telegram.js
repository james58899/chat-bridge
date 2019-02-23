'use strict';
const {unlink} = require('fs');
const {tmpdir} = require('os');
const {resolve} = require('path');
const TelegramBot = require('node-telegram-bot-api');
const imgur = require('imgur');
const sharp = require('sharp');
const config = require(resolve('data', 'telegram.json'));
const request = require('request');

let main;
let username;

imgur.setClientId('41ad90f344bdf2f');

// Init API
const bot = new TelegramBot((typeof config.token === 'string') ? config.token : config.token[0], {
  polling: {
    interval: 0,
    params: {
      timeout: 60
    }
  }
});

// Get Username
bot.getMe().then((me) => username = me.username);

// Message
bot.on('message', async (msg) => {
  // Ignore other chat room or private message
  if (msg.chat.id !== config.ChatID) return;

  // Message processes
  function send(message) {
    const sender = msg.from.username ? msg.from.username : msg.from.first_name;

    if (msg.reply_to_message) {
      let replyUsername = msg.reply_to_message.from.username ? msg.reply_to_message.from.username : msg.reply_to_message.from.first_name;

      // Ignore other reply message type content
      if (!msg.reply_to_message.text) {
        main.message('Telegram', sender, `(Reply to ${replyUsername}) ${message}`);
        return;
      }

      let shortMessage = msg.reply_to_message.text.replace(/\s/g, ' ');

      // If reply bot message
      if (msg.reply_to_message.from.username === username) {
        replyUsername = shortMessage.match(/<(\S+)>/i)[1];
        shortMessage = shortMessage.replace(/^<\S+>: /i, '');
      }

      if (shortMessage.length > 5) {
        shortMessage = shortMessage.substr(0, 5).trim() + '...';
      }

      main.message('Telegram', sender, `(${replyUsername}: ${shortMessage}) ${message}`);
    } else {
      main.message('Telegram', sender, message);
    }
  }

  // Text message
  if (msg.text) {
    send(msg.text);
  }

  // Image
  if (msg.photo) {
    // Upload image to imgur
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const image = await imgur.uploadUrl(await bot.getFileLink(fileId));

    if (msg.caption) {
      send(`${msg.caption} ${image.data.link}`);
    } else {
      send(image.data.link);
    }
  }

  // Sticker
  if (msg.sticker) {
    const tmp = tmpdir();
    const sticker = await bot.downloadFile(msg.sticker.file_id, tmp);

    // convert to png and upload to imgur
    await sharp(sticker).toFile(sticker + '.png');
    const link = (await imgur.uploadFile(sticker + '.png')).data.link;

    if (msg.sticker.emoji) {
      send(msg.sticker.emoji + ' ' + link);
    } else {
      send(link);
    }

    unlink(sticker, () => { });
    unlink(sticker + '.png', () => { });
  }

  // Image as file type
  if (msg.document) {
    if (msg.document.mime_type.match('image')) {
      let link = await bot.getFileLink(msg.document.file_id);
      link = (await imgur.uploadUrl(link)).data.link;

      if (msg.caption) {
        send(`${msg.caption} ${link}`);
      } else {
        send(link);
      }
    }
  }
});

function* senderTokenMaker() {
  let index = 0;
  while (true) {
    yield config.token[index];
    index++;
    if (index >= config.token.length) index = 0;
  }
}

const senderToken = senderTokenMaker();

module.exports = (Hub) => {
  main = Hub;
  main.on('message', (from, sender, message) => {
    setImmediate(() => {
      if (from !== 'Telegram') {
        if (typeof config.token === 'string') {
          bot.sendMessage(config.ChatID, `<${sender}>: ${message}`);
        } else {
          request.post('https://api.telegram.org/bot' + senderToken.next().value + '/sendMessage', {
            form: {
              chat_id: config.ChatID,
              text: `<${sender}>: ${message}`
            }
          });
        }
      }
    });
  });
};

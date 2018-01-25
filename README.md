# chat-bridge [![CodeFactor](https://www.codefactor.io/repository/github/james58899/chat-bridge/badge)](https://www.codefactor.io/repository/github/james58899/chat-bridge)
同步不同聊天平台的訊息

# 系統需求

- node.js 6.0+
- npm

# 安裝方法

1. `git clone https://github.com/james58899/chat-bridge.git`
2. `cd chat-bridge`
3. `npm install`
4. 更改data資下夾下的設定檔
5. `node index.js`

## 設定資訊

### irc.json
* `host` IRC伺服器位置
* `port` IRC伺服器連線port
* `secure` 是否使用SSL連線
* `nick` bot在IRC上的nickname
* `username` bot在IRC上的username
* `realname` bot在IRC上的realname
* `channel` 要加入並轉發的頻道，目前僅支援單一頻道
* `pasteeToken` 設定 paste.ee 的API Token，可留空
* `title` 是否開啟連結標題解析，需要 [node-icu-charset-detector](https://github.com/mooz/node-icu-charset-detector)

### telegram.json
* `token` Telegram Bot API Token
* `ChatID` 要轉發的頻道的ID

### ignore.json
忽略清單，防止有多個bot時造成loop
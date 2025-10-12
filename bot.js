const mineflayer = require('mineflayer')

const names = [
  "7_is_Hoang",
  "7_is_Hung",
  "7_is_Nam",
  "7_is_Minh",
  "7_is_Phuong"
]

function createBot(name) {
  const bot = mineflayer.createBot({
    host: process.env.SERVER_HOST || 'play2.eternalzero.cloud',
    port: Number(process.env.SERVER_PORT || 27199),
    username: name,
    auth: 'offline'
  })

  bot.on('spawn', () => {
    console.log(`${name} đã join server!`)
    bot.chat(`Xin chào, tôi là ${name}, chạy trên GitHub Actions!`)
  })

  bot.on('error', err => console.log(`${name} error:`, err))
  bot.on('kicked', reason => console.log(`${name} bị kick:`, reason))
}

for (const n of names) {
  createBot(n)
}

const mineflayer = require('mineflayer')

const bot = mineflayer.createBot({
  host: 'play.craftvn.net', // ⚠️ đổi thành IP/host server bạn
  port: 25565,
  username: '7_is_Hoang',
  auth: 'offline'           // nếu server crack; nếu premium -> 'microsoft'
})

bot.on('spawn', () => {
  console.log(`${bot.username} đã join server!`)
  bot.chat("Xin chào từ GitHub Actions 🤖")
})

bot.on('error', err => console.log('Error:', err))
bot.on('kicked', reason => console.log('Kicked:', reason))

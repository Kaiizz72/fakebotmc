const mineflayer = require('mineflayer')

// Danh sách tên bot
const names = [
  "7_is_Hoang",
  "7_is_Hung",
  "7_is_Nam",
  "7_is_Minh",
  "7_is_Phuong"
]

// Danh sách câu chào ngẫu nhiên
const messages = [
  "Xin chào mọi người 👋",
  "Có ai ở đây không vậy?",
  "Hế lô, tôi mới vào!",
  "Server hôm nay đông ghê 😎",
  "Ai chơi chung không nào?",
  "Mới join, dẫn đi mine với 😁"
]

function createBot(name) {
  const bot = mineflayer.createBot({
    host: 'play2.eternalzero.cloud', // ⚠️ đổi thành server bạn
    port: 27199,
    username: name,
    auth: 'offline'
  })

  bot.on('spawn', () => {
    console.log(`${name} đã vào server!`)

    // Chat 1 câu ngẫu nhiên sau 3s
    setTimeout(() => {
      const msg = messages[Math.floor(Math.random() * messages.length)]
      bot.chat(msg)
    }, 3000)
  })

  bot.on('kicked', reason => console.log(`${name} bị kick:`, reason))
  bot.on('error', err => console.log(`${name} lỗi:`, err))
}

// Tạo bot lần lượt, delay random 5–10s
names.forEach((name, i) => {
  const delay = i * (5000 + Math.random() * 5000) // 5–10s
  setTimeout(() => createBot(name), delay)
})

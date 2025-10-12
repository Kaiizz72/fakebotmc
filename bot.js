const mineflayer = require('mineflayer')

// SỐ BOT
const BOT_COUNT = 10

// Thông số server — đổi theo server của bạn hoặc dùng biến môi trường
const SERVER_HOST = process.env.SERVER_HOST || 'play2.eternalzero.cloud'
const SERVER_PORT = Number(process.env.SERVER_PORT || 27199)
const AUTH_MODE = process.env.AUTH_MODE || 'offline' // 'offline' hoặc 'microsoft'

// Tạo tên kiểu VN (unique)
function generateNames(count) {
  const ho = ["Nguyen","Tran","Le","Pham","Hoang","Vu","Vo","Do","Bui","Dang"]
  const ten = ["Hung","Nam","Minh","Khanh","Tuan","Quang","Duc","Anh","Phong","Phuong","Hieu"]
  const out = new Set()
  while (out.size < count) {
    const name = `7_is_${ho[Math.floor(Math.random()*ho.length)]}${ten[Math.floor(Math.random()*ten.length)]}${Math.floor(Math.random()*90)+10}`
    out.add(name)
  }
  return Array.from(out)
}

// Một vài câu chat ngẫu nhiên
const CHAT_MESSAGES = [
  "Xin chào mn 👋",
  "Ai hướng dẫn mình với 😁",
  "Có ai ở đây không?",
  "Mới vào, rảnh chơi cùng không?",
  "Server ngon đó nha",
  "Ai cùng farm không ạ?",
  "Hẹn gặp mọi người ở spawn!"
]

const names = generateNames(BOT_COUNT)
const bots = []

function createBot(name) {
  const bot = mineflayer.createBot({
    host: SERVER_HOST,
    port: SERVER_PORT,
    username: name,
    auth: AUTH_MODE
  })

  bot._humanLikeData = {}

  bot.on('spawn', () => {
    console.log(`${name} spawned`)
    // Chat 1 câu ngẫu nhiên sau 3s
    setTimeout(() => {
      const m = CHAT_MESSAGES[Math.floor(Math.random() * CHAT_MESSAGES.length)]
      try { bot.chat(m) } catch (e) {}
    }, 3000)

    // Nhìn quanh
    bot._humanLikeData.lookInterval = setInterval(() => {
      const yaw = (Math.random() * Math.PI * 2) - Math.PI
      const pitch = (Math.random() * 0.8) - 0.4
      bot.look(yaw, pitch, true).catch(()=>{})
    }, 3000 + Math.random()*2000)

    // Di chuyển ngẫu nhiên
    bot._humanLikeData.moveInterval = setInterval(() => {
      const actions = ['forward','back','left','right','jump','sprint','sneak']
      actions.forEach(a => bot.setControlState(a,false))
      const r = Math.random()
      if (r < 0.5) {
        bot.setControlState('forward', true)
        if (Math.random()<0.3) bot.setControlState('left', true)
        if (Math.random()<0.3) bot.setControlState('right', true)
        if (Math.random()<0.3) bot.setControlState('sprint', true)
      } else if (r < 0.7) {
        bot.setControlState('jump', true)
      } else if (r < 0.85) {
        bot.setControlState('sneak', true)
      }
      setTimeout(() => actions.forEach(a => bot.setControlState(a,false)), 1000+Math.random()*3000)
    }, 5000 + Math.random()*5000)

    // Chat định kỳ
    function scheduleChat() {
      const t = 30000 + Math.random()*60000
      bot._humanLikeData.chatTimeout = setTimeout(() => {
        const msg = CHAT_MESSAGES[Math.floor(Math.random()*CHAT_MESSAGES.length)]
        try { bot.chat(msg) } catch(e){}
        scheduleChat()
      }, t)
    }
    scheduleChat()
  })

  bot.on('kicked', (reason) => console.log(`${name} bị kick:`, reason))
  bot.on('error', (err) => console.log(`${name} lỗi:`, err?.message || err))

  bot.on('end', () => {
    clearInterval(bot._humanLikeData.lookInterval)
    clearInterval(bot._humanLikeData.moveInterval)
    clearTimeout(bot._humanLikeData.chatTimeout)
    console.log(`${name} disconnected, sẽ reconnect sau 15s`)
    setTimeout(()=>createBot(name), 15000)
  })

  bots.push(bot)
}

// Tạo bot join lần lượt
for (let i = 0; i < BOT_COUNT; i++) {
  const delay = i * (12000 + Math.random()*6000) // 12–18s mỗi bot
  setTimeout(() => createBot(names[i]), delay)
}

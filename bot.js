// bot.js
const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const collectBlockPlugin = require('mineflayer-collectblock').plugin
const pvpPlugin = require('mineflayer-pvp').plugin
const { GoalNear } = goals

// ====== CONFIG ======
const SERVER_HOST = process.env.SERVER_HOST || 'per10.asaka.asia'
const SERVER_PORT = Number(process.env.SERVER_PORT || 30060)
const AUTH_MODE   = process.env.AUTH_MODE || 'offline'
const PASSWORD    = process.env.BOT_PASS || '123456789'

// Danh sách 100 tên bot Việt Nam
const BOT_NAMES = [
  "meosube","nguyenphi","trananh","lethao","hoangcuong","duyphat","minhquan","thanhhuyen","linhchi","quanghuy",
  "hoangnam","ngocanh","tuananh","thanhdat","thuytrang","minhtam","khanhlinh","hoanganh","ngocbao","trangpham",
  "phuongnam","nguyenhoa","dinhphuc","huonggiang","lephuong","thanhson","vietanh","ngocmai","thienan","huynhnhu",
  "thienkim","quynhtrang","khanhduy","mydung","baokhanh","phuonganh","kimngan","trungkien","thanhngan","dieulinh",
  "kimanh","ngocquyen","thuthao","hoailinh","quocbao","phuonguyen","kimngoc","nguyenthinh","nhatlinh","thuytien",
  "tranphu","thanhtruc","hanhnguyen","namphuong","thuydung","nguyetanh","giahan","minhhoang","diepanh","nguyenthuy",
  "huyentrang","thienphu","duyminh","lethinh","baoan","giabao","hongson","trungkhoa","ngocson","hoangphuong",
  "baolong","khactuan","thanhhuy","quocviet","ngocduy","hoailam","kimlong","nhatminh","hongan","kimthoa","thienlong",
  "quynhmai","hoangdung","kimkhanh","lehong","thuykieu","thienbao","diephuong","trungkhang","kimphuong","huyhoang",
  "ngoclan","kimyen","hoanglam","nguyenquan","thutrang","tuanvu","minhchau","nguyenhai","tranthang","thanhbinh"
]

// Câu cà khịa khi chạy trốn
const CHAT_TAUNT = ['gà','ngu','bọn óc..','non thế mà cũng đánh','haha yếu!']

// ====== BOT CREATOR ======
function createBot(username) {
  const bot = mineflayer.createBot({
    host: SERVER_HOST,
    port: SERVER_PORT,
    username,
    auth: AUTH_MODE
  })

  bot.loadPlugin(pathfinder)
  bot.loadPlugin(collectBlockPlugin)
  bot.loadPlugin(pvpPlugin)

  let defaultMove

  bot.once('spawn', () => {
    console.log(username, 'spawned')

    const mcData = require('minecraft-data')(bot.version)
    defaultMove = new Movements(bot, mcData)
    bot.pathfinder.setMovements(defaultMove)

    // Auto register/login
    setTimeout(() => bot.chat(`/register ${PASSWORD} ${PASSWORD}`), 1000)
    setTimeout(() => bot.chat(`/login ${PASSWORD}`), 3000)
    setTimeout(() => bot.chat("hi cc"), 5000)

    // Hành vi chính lặp lại
    setInterval(() => mainLoop(bot, defaultMove), 3000)
  })

  bot.on('health', () => {
    if (bot.health < 10) startFlee(bot)
  })
  bot.on('entityHurt', (e) => {
    if (e === bot.entity) startFlee(bot)
  })

  bot.on('end', () => console.log(username, 'disconnected'))
}

// ====== BEHAVIORS ======
async function mainLoop(bot, defaultMove) {
  if (!bot.entity) return

  // Nếu đang chạy trốn thì skip
  if (bot._fleeing) return

  // 1. Tìm player gần để đánh
  const enemy = nearestPlayer(bot, 5)
  if (enemy) {
    try { await bot.pvp.attack(enemy) } catch {}
    return
  }

  // 2. Tìm slime block gần
  const slimePos = findNearbyBlock(bot, 'slime_block', 16)
  if (slimePos) {
    try {
      await approachPos(bot, defaultMove, slimePos, 2)
      const block = bot.blockAt(slimePos)
      if (block) await bot.collectBlock.collect(block)
    } catch {}
    return
  }

  // 3. Tìm NPC tên "New"
  const npc = findNpcNamed(bot, 'new')
  if (npc) {
    try {
      await approachEntity(bot, defaultMove, npc, 2)
      bot.activateEntity(npc)
      bot.chat("cho mình đổi pháo hoa với cánh nhé!")
    } catch {}
    return
  }

  // 4. Không có gì thì đi dạo ngẫu nhiên
  randomWalk(bot, defaultMove)
}

function nearestPlayer(bot, radius=6) {
  let best=null, bestDist=Infinity
  for (const e of Object.values(bot.entities)) {
    if (e.type==='player' && e.username!==bot.username) {
      const d=bot.entity.position.distanceTo(e.position)
      if (d<bestDist && d<=radius){best=e;bestDist=d}
    }
  }
  return best
}

function findNpcNamed(bot, needle) {
  const low=needle.toLowerCase()
  let best=null, bestDist=Infinity
  for (const e of Object.values(bot.entities)) {
    const name=(e.username||e.displayName||e.name||'').toString().toLowerCase()
    if (name.includes(low)) {
      const d=bot.entity.position.distanceTo(e.position)
      if (d<bestDist){best=e;bestDist=d}
    }
  }
  return best
}

function findNearbyBlock(bot, blockName, radius=16) {
  const mcData=require('minecraft-data')(bot.version)
  const id=mcData.blocksByName[blockName]?.id
  if (!id) return null
  const p=bot.entity.position.floored()
  let best=null, bestDist=Infinity
  for(let x=-radius;x<=radius;x++){
    for(let y=-2;y<=2;y++){
      for(let z=-radius;z<=radius;z++){
        const b=bot.blockAt(p.offset(x,y,z))
        if(b && b.type===id){
          const d=bot.entity.position.distanceTo(b.position)
          if(d<bestDist){best=b.position;bestDist=d}
        }
      }
    }
  }
  return best
}

async function approachEntity(bot, move, entity, dist=2){
  try{
    const g=new GoalNear(entity.position.x,entity.position.y,entity.position.z,dist)
    bot.pathfinder.setMovements(move)
    bot.pathfinder.setGoal(g,true)
    await waitMs(1000)
  }catch{}
}
async function approachPos(bot, move, pos, dist=2){
  try{
    const g=new GoalNear(pos.x,pos.y,pos.z,dist)
    bot.pathfinder.setMovements(move)
    bot.pathfinder.setGoal(g,true)
    await waitMs(1000)
  }catch{}
}

function randomWalk(bot, move){
  const dx=(Math.random()*10-5)|0
  const dz=(Math.random()*10-5)|0
  const p=bot.entity.position.offset(dx,0,dz)
  bot.pathfinder.setMovements(move)
  bot.pathfinder.setGoal(new GoalNear(p.x,p.y,p.z,2))
}

function startFlee(bot){
  if(bot._fleeing) return
  bot._fleeing=true
  bot.chat(CHAT_TAUNT[Math.floor(Math.random()*CHAT_TAUNT.length)])
  bot.setControlState('sprint',true)
  bot.setControlState('forward',true)
  bot.setControlState('jump',true)
  setTimeout(()=>{
    bot.clearControlStates()
    bot._fleeing=false
  },4000)
}

function waitMs(t){return new Promise(r=>setTimeout(r,t))}

// ====== SPAWN 100 BOT CÁCH NHAU 10S ======
BOT_NAMES.forEach((name,i)=>{
  setTimeout(()=>{
    console.log("Spawning bot:",name)
    createBot(name)
  }, i*10000) // mỗi bot cách 10 giây
})

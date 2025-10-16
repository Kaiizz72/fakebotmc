// multi_bot_fleet_with_surnames_plugins.js
// Multi-bot fleet script with correct plugin imports using .plugin where required.

const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals: { GoalNear } } = require('mineflayer-pathfinder')
const collectBlock = require('mineflayer-collectblock').plugin
const pvp = require('mineflayer-pvp').plugin
const toolPlugin = require('mineflayer-tool').plugin
const autoEat = require('mineflayer-auto-eat').plugin

const BOT_COUNT = parseInt(process.env.BOT_COUNT || '30', 10)
const JOIN_INTERVAL_MS = parseInt(process.env.JOIN_INTERVAL_MS || '15000', 10)
const HOST = process.env.SERVER_HOST || 'darknight.asakahot.net'
const PORT = parseInt(process.env.SERVER_PORT || '25565', 10)
const AUTH = process.env.AUTH_MODE || 'offline'
const PASS = process.env.BOT_PASS || '12345678@'
const SURNAME_LIMIT = parseInt(process.env.SURNAME_LIMIT || '3', 10)

// Generate Vietnamese-like names with surname + optional middle + given
function generateNames(count) {
  const SURNAMES = ['nguyen','tran','le','pham','hoang','phan','vu','vo','dang','bui','do','duong','ngo','dinh','ly','truong','phamle','ho']
  const MALE = ['minh','cuong','hieu','dung','anh','son','khoa','tuan','nam','hung','phuc','huy','nhat','thanh']
  const FEMALE = ['lan','hoa','mai','anh','thuy','nga','trang','hien','linh','phuong','ngoc','anhthu','quynh']
  const names = []
  const used = new Set()
  const surnameCount = {}
  const rand = arr => arr[Math.floor(Math.random()*arr.length)]
  while (names.length < count) {
    let surname = rand(SURNAMES)
    for (let t=0;t<8;t++) {
      if ((surnameCount[surname] || 0) < SURNAME_LIMIT) break
      surname = rand(SURNAMES)
    }
    const pickFemale = Math.random() < 0.48
    const given = pickFemale ? rand(FEMALE) : rand(MALE)
    let middle = ''
    if (Math.random() < 0.25) {
      const middles = ['van','thi','quoc','bao','tien','thanh']
      middle = rand(middles)
    }
    const parts = [surname].concat(middle ? [middle] : []).concat([given])
    let candidate = parts.join('').toLowerCase().replace(/\s+/g,'')
    if (used.has(candidate)) {
      for (let i=1;i<=50;i++) {
        const cand2 = candidate+i
        if (!used.has(cand2)) { candidate = cand2; break }
      }
    }
    if (used.has(candidate)) continue
    names.push(candidate)
    used.add(candidate)
    surnameCount[surname] = (surnameCount[surname]||0)+1
  }
  return names
}

function createBotWithName(username) {
  const bot = mineflayer.createBot({
    host: HOST, port: PORT, username,
    auth: AUTH
  })

  bot.loadPlugin(pathfinder)
  bot.loadPlugin(collectBlock)
  bot.loadPlugin(pvp)
  bot.loadPlugin(toolPlugin)
  bot.loadPlugin(autoEat)

  bot.once('spawn', async () => {
    const mcData = require('minecraft-data')(bot.version)
    const defaultMove = new Movements(bot, mcData)
    defaultMove.canOpenDoors = true
    bot.pathfinder.setMovements(defaultMove)
    bot.autoEat.options = { priority: 'saturation', startAt: 16, bannedFood: [] }

    async function stopMovement(ms=120){
      try{bot.pathfinder.setGoal(null)}catch{}
      const ctrls=['forward','back','left','right','sprint','jump','sneak']
      for(const c of ctrls) bot.setControlState(c,false)
      await new Promise(r=>setTimeout(r,ms))
    }
    function safeChat(msg){ stopMovement().catch(()=>{}); try{bot.chat(msg)}catch{} }

    try{
      await stopMovement(200)
      safeChat(`/register ${PASS} ${PASS}`)
      await new Promise(r=>setTimeout(r,1200))
      await stopMovement(200)
      safeChat(`/login ${PASS}`)
      await new Promise(r=>setTimeout(r,1200))
      await stopMovement(200)
      safeChat(`/spawn`)
    }catch(e){console.log(`[${username}] startup error`,e)}

    // Example simple loops
    setInterval(async()=>{
      try{
        const mcData = require('minecraft-data')(bot.version)
        const blk=mcData.blocksByName['slime_block']
        if(blk){
          const pos=bot.findBlock({matching:blk.id,maxDistance:32})
          if(pos){
            await stopMovement(100)
            await bot.tool.equipForBlock(pos).catch(()=>{})
            await bot.collectBlock.collect(pos).catch(()=>{})
            safeChat('dap slime block')
          }
        }
      }catch(e){}
    },20000)

    setInterval(async()=>{
      try{
        const mcData = require('minecraft-data')(bot.version)
        const oreNames=['coal_ore','iron_ore','gold_ore','diamond_ore','redstone_ore','lapis_ore','copper_ore']
        const ids=oreNames.map(n=>mcData.blocksByName[n]?.id).filter(Boolean)
        const positions=bot.findBlocks({matching:b=>ids.includes(b),maxDistance:10,count:1})
        if(positions.length){
          const pos=positions[0]
          await stopMovement(80)
          await bot.tool.equipForBlock(bot.blockAt(pos)).catch(()=>{})
          await bot.collectBlock.collect(bot.blockAt(pos)).catch(()=>{})
          safeChat('da quang')
        }
      }catch(e){}
    },12000)

    let attacking=false
    setInterval(()=>{
      if(!bot.entity||attacking) return
      const players=Object.values(bot.players||{}).map(p=>p.entity).filter(Boolean)
      let closest=null,cd=999
      for(const p of players){const d=bot.entity.position.distanceTo(p.position);if(d<cd){closest=p;cd=d}}
      if(closest&&cd<6){
        attacking=true
        let interval=setInterval(()=>{try{bot.pvp.attack(closest)}catch{}},160)
        setTimeout(()=>{clearInterval(interval);attacking=false},3000)
      }
    },900)

    bot.on('kicked',r=>console.log(`[${username}] kicked`,r))
    bot.on('error',e=>console.log(`[${username}] error`,e?.message))
    bot.on('end',()=>console.log(`[${username}] disconnected`))
  })
  return bot
}

async function main(){
  const names=generateNames(BOT_COUNT)
  console.log(`Spawning ${names.length} bots every ${JOIN_INTERVAL_MS} ms`)
  for(let i=0;i<names.length;i++){
    setTimeout(()=>{console.log(`Spawn bot ${i+1}: ${names[i]}`);createBotWithName(names[i])},i*JOIN_INTERVAL_MS)
  }
}
main()

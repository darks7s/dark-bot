// ═══════════════════════════════════════════════════════
// 👋 الترحيب - DARK BOT
// ═══════════════════════════════════════════════════════

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WELCOME_FILE = path.join(__dirname, 'welcome.json')

const BOT_IMAGES = [
  'https://files.catbox.moe/uc36m1.jpeg',
  'https://files.catbox.moe/6t3v2w.jpg'
]

function getRandomImage() {
  return BOT_IMAGES[Math.floor(Math.random() * BOT_IMAGES.length)]
}

// ═══ تحميل الإعدادات ═══
function loadWelcome() {
  try {
    if (fs.existsSync(WELCOME_FILE)) return JSON.parse(fs.readFileSync(WELCOME_FILE, 'utf8'))
  } catch (e) {}
  return {}
}

function saveWelcome(data) {
  try { fs.writeFileSync(WELCOME_FILE, JSON.stringify(data, null, 2)) } catch (e) {}
}

let welcomeData = loadWelcome()

// ═══ الترحيب بالأعضاء الجدد ═══
export async function handleWelcome(sock, event, db) {
  try {
    const { id, participants, action } = event
    const chat = db.data.chats[id] || {}
    if (!chat.welcome) return

    const customMsg = welcomeData[id] || null

    for (const participant of participants) {
      const num = participant.split('@')[0]
      let text = ''

      if (customMsg) {
        text = customMsg.replace(/{user}/g, '@' + num)
      } else {
        text = `👋 *أهلاً وسهلاً*\n\n@${num} نورت الجروب ✨`
      }

      try {
        await sock.sendMessage(id, {
          image: { url: getRandomImage() },
          caption: text,
          mentions: [participant]
        })
      } catch (e) {
        await sock.sendMessage(id, { text, mentions: [participant] })
      }
    }
  } catch (e) {}
}

// ═══ تفعيل / تعطيل الترحيب ═══
export async function handleWelcomeToggle(sock, from, msg, value, db) {
  if (!db.data.chats[from]) db.data.chats[from] = {}
  db.data.chats[from].welcome = value
  await sock.sendMessage(from, {
    text: value ? '✅ *تم تفعيل الترحيب*' : '🔒 *تم تعطيل الترحيب*'
  }, { quoted: msg })
}

// ═══ تعديل رسالة الترحيب ═══
export async function setWelcomeMessage(sock, from, msg, text) {
  if (!text || text.length < 2) {
    return sock.sendMessage(from, { text: '❌ اكتب نص الترحيب' }, { quoted: msg })
  }
  welcomeData[from] = text
  saveWelcome(welcomeData)
  await sock.sendMessage(from, {
    text: `✅ *تم حفظ رسالة الترحيب*\n\n📝 ${text}\n\n💡 استخدم {user} لمنشن العضو`
  }, { quoted: msg })
}

// ═══ عرض رسالة الترحيب ═══
export async function getWelcomeMessage(sock, from, msg) {
  const msgText = welcomeData[from] || 'الرسالة الافتراضية (أهلاً وسهلاً @العضو نورت الجروب ✨)'
  await sock.sendMessage(from, {
    text: `📝 *رسالة الترحيب الحالية:*\n\n${msgText}`
  }, { quoted: msg })
}

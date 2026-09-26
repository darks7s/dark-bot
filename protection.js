// ═══════════════════════════════════════════════════════
// 🛡️ الحماية - DARK BOT
// ═══════════════════════════════════════════════════════

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WARNS_FILE = path.join(__dirname, 'warns.json')

// ═══ قوائم ═══
const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(chat\.whatsapp\.com\/[^\s]+)/gi
const badWords = ['كلمة1', 'كلمة2', 'شتيمة1', 'شتيمة2']
const adWords = ['اشترك', 'قناتي', 'قناتنا', 'subscribe', 'اعلان', 'إعلان']
const phoneRegex = /(\+?\d{10,15})/g
const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi

// ═══ تحميل الإنذارات ═══
function loadWarns() {
  try {
    if (fs.existsSync(WARNS_FILE)) return JSON.parse(fs.readFileSync(WARNS_FILE, 'utf8'))
  } catch (e) {}
  return {}
}

function saveWarns(data) {
  try { fs.writeFileSync(WARNS_FILE, JSON.stringify(data, null, 2)) } catch (e) {}
}

// ═══ السبام ═══
const spamTracker = new Map()

function checkSpam(userId) {
  const now = Date.now()
  const user = spamTracker.get(userId) || { messages: [] }
  
  user.messages.push(now)
  user.messages = user.messages.filter(t => now - t < 10000)
  spamTracker.set(userId, user)
  
  if (user.messages.length > 5) {
    user.messages = []
    return true
  }
  return false
}

// ═══ العقوبة ═══
async function punish(sock, from, msg, sender, senderNum, reason) {
  try {
    await sock.sendMessage(from, { delete: msg.key }).catch(() => {})

    const warns = loadWarns()
    if (!warns[from]) warns[from] = {}
    if (!warns[from][senderNum]) warns[from][senderNum] = 0
    warns[from][senderNum]++
    saveWarns(warns)

    const count = warns[from][senderNum]

    if (count >= 3) {
      await sock.sendMessage(from, {
        text: `🚫 *@${senderNum}*\n\n⚠️ وصل لـ 3 إنذارات\n📝 السبب: ${reason}\n\n🔨 *جاري الطرد...*`,
        mentions: [sender]
      }).catch(() => {})

      setTimeout(async () => {
        try {
          await sock.groupParticipantsUpdate(from, [sender], 'remove')
          delete warns[from][senderNum]
          saveWarns(warns)
        } catch (e) {}
      }, 2000)
      return
    }

    await sock.sendMessage(from, {
      text: `⚠️ *@${senderNum}*\n\n📝 *السبب:* ${reason}\n📊 *الإنذارات:* ${count}/3\n\n⚠️ *لو وصلت 3 إنذارات هتطرد*`,
      mentions: [sender]
    }).catch(() => {})
  } catch (e) {
    console.log('❌ فشل العقوبة:', e.message)
  }
}

// ═══ فحص الرسائل ═══
export async function checkMessage(sock, msg, from, isGroup, isOwner, userIsAdmin, chat) {
  if (!isGroup || isOwner || userIsAdmin) return false

  const text = msg.message?.conversation
    || msg.message?.extendedTextMessage?.text
    || msg.message?.imageMessage?.caption
    || msg.message?.videoMessage?.caption
    || ''

  const sender = msg.key.participant || msg.key.remoteJid
  const senderNum = sender.split('@')[0]

  // منع الروابط
  if (chat.antilink && text) {
    linkRegex.lastIndex = 0
    if (linkRegex.test(text)) {
      await punish(sock, from, msg, sender, senderNum, 'منع الروابط')
      return true
    }
  }

  // منع الشتائم
  if (chat.antibad && text) {
    const found = badWords.some(w => text.includes(w))
    if (found) {
      await punish(sock, from, msg, sender, senderNum, 'منع الشتائم')
      return true
    }
  }

  // منع الكلمات الممنوعة المخصصة
  if (chat.customWordsEnabled && chat.customWords && chat.customWords.length > 0 && text) {
    const found = chat.customWords.some(w => text.includes(w))
    if (found) {
      await punish(sock, from, msg, sender, senderNum, 'كلمة ممنوعة')
      return true
    }
  }

  // منع الإعلانات
  if (chat.antiannounce && text) {
    const found = adWords.some(w => text.includes(w))
    if (found) {
      await punish(sock, from, msg, sender, senderNum, 'منع الإعلانات')
      return true
    }
  }

  // منع السبام
  if (chat.antispam && text) {
    if (checkSpam(sender)) {
      await punish(sock, from, msg, sender, senderNum, 'منع السبام')
      return true
    }
  }

  // منع التحويل
  if (chat.antiforward) {
    const isForwarded = msg.message?.extendedTextMessage?.contextInfo?.forwardingScore > 0
    if (isForwarded) {
      await punish(sock, from, msg, sender, senderNum, 'منع التحويل')
      return true
    }
  }

  // منع الأرقام
  if (chat.antiphone && text) {
    phoneRegex.lastIndex = 0
    if (phoneRegex.test(text) && text.replace(/[^0-9]/g, '').length >= 10) {
      await punish(sock, from, msg, sender, senderNum, 'منع الأرقام')
      return true
    }
  }

  // منع الإيميلات
  if (chat.antiemail && text) {
    emailRegex.lastIndex = 0
    if (emailRegex.test(text)) {
      await punish(sock, from, msg, sender, senderNum, 'منع الإيميلات')
      return true
    }
  }

  return false
}

// ═══ تفعيل/تعطيل الحماية ═══
export async function toggleProtection(sock, from, msg, chat, db, key, value) {
  if (!db.data.chats[from]) db.data.chats[from] = {}
  db.data.chats[from][key] = value

  const labels = {
    antilink: 'الروابط',
    antibad: 'الشتائم',
    antiannounce: 'الإعلانات',
    antispam: 'السبام',
    antiforward: 'التحويل',
    antinsfw: 'الصور المخلة',
    antiphone: 'الأرقام',
    antiemail: 'الإيميلات'
  }

  await sock.sendMessage(from, {
    text: value
      ? `✅ *تم تفعيل منع ${labels[key] || key}*`
      : `❌ *تم تعطيل منع ${labels[key] || key}*`
  }, { quoted: msg })
}

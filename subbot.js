// ═══════════════════════════════════════════════════════
// 🤖 البوتات الفرعية - DARK BOT
// ═══════════════════════════════════════════════════════

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { BOT_NAME, SUB_BOTS_DIR, OWNER_NUMBER } from './config.js'
import { handleBlock, isBlocked } from './blocks.js'
import { COMMANDS, matchCommand, getSectionContent } from './commands.js'
import { playDice, playGuess, playRPS } from './games.js'
import { decorateText, reverseText, calcExpression, randomQuote, randomJoke, randomFact } from './tools.js'
import { isAdmin, isBotAdmin, getMentioned, kickMember, promoteMember, demoteMember, muteGroup, unmuteGroup, tagAll, getGroupLink } from './admin.js'

const logger = pino({ level: 'silent' })
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const activeBots = new Map()
export const pendingCodes = new Map()
export const installCooldown = new Map()
export const codeCooldown = new Map()

function formatUptime() {
  const u = process.uptime()
  const h = Math.floor(u / 3600)
  const m = Math.floor((u % 3600) / 60)
  const s = Math.floor(u % 60)
  return h + 'س ' + m + 'د ' + s + 'ث'
}

// ═══════════════════════════════════════════════════════
// 🚀 إنشاء بوت فرعي
// ═══════════════════════════════════════════════════════
export async function createSubBot(phoneNumber, requesterJid, mainSock) {
  phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

  // فحص الكول داون
  const lastCode = codeCooldown.get(phoneNumber) || 0
  const codePassed = Date.now() - lastCode
  const codeCooldownMs = 2 * 60 * 1000

  if (codePassed < codeCooldownMs) {
    const remaining = Math.ceil((codeCooldownMs - codePassed) / 1000)
    const mins = Math.floor(remaining / 60)
    const secs = remaining % 60
    await mainSock.sendMessage(requesterJid, {
      text: `⏳ *استنى شوية*\n\nلازم تستنى *${mins} دقيقة و ${secs} ثانية* قبل ما تطلب كود جديد`
    }).catch(() => {})
    return
  }

  const botDir = path.join(SUB_BOTS_DIR, phoneNumber)
  if (fs.existsSync(botDir)) fs.rmSync(botDir, { recursive: true, force: true })
  fs.mkdirSync(botDir, { recursive: true })

  console.log('\n🔧 إنشاء بوت فرعي: ' + phoneNumber)

  const { state, saveCreds } = await useMultiFileAuthState(botDir)
  const { version } = await fetchLatestBaileysVersion()

  const subSock = makeWASocket({
    version,
    logger,
    auth: state,
    browser: ['Chrome', 'Windows', '10.0.0'],
    markOnlineOnConnect: true,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false
  })

  subSock.ev.on('creds.update', saveCreds)
  let codeSent = false

  subSock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    // ═══ طلب كود الاقتران (بعد إشارة QR أو connecting) ═══
    if ((qr || connection === 'connecting') && !codeSent && !subSock.authState.creds.registered) {
      codeSent = true
      
      setTimeout(async () => {
        try {
          console.log('🔑 طلب كود لـ ' + phoneNumber + '...')
          
          const code = await subSock.requestPairingCode(phoneNumber)
          const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code
          console.log('✅ كود ' + phoneNumber + ': ' + formattedCode)

          codeCooldown.set(phoneNumber, Date.now())

          await mainSock.sendMessage(requesterJid, {
            text: `🔑 *كود الإقران:*

\`\`\`
${formattedCode}
\`\`\`

📌 *الخطوات:*
1️⃣ افتح واتساب
2️⃣ الإعدادات
3️⃣ الأجهزة المرتبطة
4️⃣ ربط جهاز
5️⃣ الربط برقم الهاتف
6️⃣ أدخل الكود

⚠️ *الكود صالح 5 دقايق*
💡 *اضغط مطولاً على الكود لنسخه*`
          }).catch(() => {})

        } catch (err) {
          console.log('❌ فشل كود ' + phoneNumber + ': ' + err.message)
          codeSent = false
          
          await mainSock.sendMessage(requesterJid, {
            text: '❌ *فشل إنشاء الكود*\n\n⚠️ جرب تاني بعد 15 دقيقة'
          }).catch(() => {})
        }
      }, 2000)
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log('⚠️ بوت ' + phoneNumber + ' انقطع: ' + reason)
      if (reason !== DisconnectReason.loggedOut) {
        setTimeout(() => {
          activeBots.delete(phoneNumber)
          createSubBot(phoneNumber, requesterJid, mainSock).catch(console.error)
        }, 15000)
      } else {
        activeBots.delete(phoneNumber)
      }
    }

    if (connection === 'open') {
      console.log('✅ بوت فرعي اتصل: ' + phoneNumber)
      activeBots.set(phoneNumber, subSock)
      await mainSock.sendMessage(requesterJid, {
        text: `╭━━━ ⚡ *${BOT_NAME}* ⚡ ━━━╮
┃
┃ ✅ *تم الاتصال بنجاح*
┃
┃ 📱 *الرقم:* ${phoneNumber}
┃ 🟢 *الحالة:* متصل
┃
┃ ✅ *البوت جاهز للاستخدام الآن*
┃
┃ ﴿ فَاذْكُرُونِي أَذْكُرْكُمْ ﴾
┃ 📖 البقرة: 152
┃
╰━━━━━ ⚡ 𝑫𝑨𝑹𝑲 ⚡ ━━━━╯`
      }).catch(() => {})
    }
  })

  // ═══ معالجة الرسائل ═══
  subSock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    const msg = messages[0]
    if (!msg.message) return
    const from = msg.key.remoteJid
    const isGroup = from.endsWith('@g.us')

    let text = msg.message.conversation
      || msg.message.extendedTextMessage?.text
      || ''

    if (!text) return

    const senderJid = msg.key.participant || msg.key.remoteJid
    const senderNum = senderJid.split('@')[0].split(':')[0]
    const isOwner = senderNum === OWNER_NUMBER || msg.key.fromMe

    console.log('📩 [SUB] ' + senderNum + ': ' + text)

    try {
      if (isBlocked(senderJid, from) && !isOwner) return
      const blockHandled = await handleBlock(subSock, from, msg, text, senderJid, isGroup)
      if (blockHandled) return

      if (matchCommand(text, COMMANDS.menu)) {
        return subSock.sendMessage(from, {
          text: `╭━━━ ⚡ *${BOT_NAME}* ⚡ ━━━╮
┃
┃ 👤 *المستخدم:* @${senderNum}
┃ ⏱️ *التشغيل:* ${formatUptime()}
┃
┃ 📋 *اختر من الأزرار:*
┃
╰━━━━━━━━━━━━━━╯`,
          mentions: [senderNum + '@s.whatsapp.net']
        }, { quoted: msg })
      }

      if (matchCommand(text, COMMANDS.info)) {
        return subSock.sendMessage(from, { text: 'ℹ️ *معلومات*\n\n🤖 ' + BOT_NAME + '\n⏱️ ' + formatUptime() }, { quoted: msg })
      }

      if (matchCommand(text, COMMANDS.ping)) {
        return subSock.sendMessage(from, { text: '🏓 *تست*\n⚡ ' + formatUptime() }, { quoted: msg })
      }

      if (matchCommand(text, ['نرد'])) return playDice(subSock, from, msg)
      if (matchCommand(text, ['تخمين'])) return playGuess(subSock, from, msg, senderJid)
      if (matchCommand(text, ['حجر ورقة مقص', 'حجر'])) return playRPS(subSock, from, msg)

      if (text.startsWith('زخرفة ') || text.startsWith('.زخرفة ')) {
        const t = text.replace(/^[.\/!#*]?\s*زخرفة\s*/, '').trim()
        if (t) return decorateText(subSock, from, msg, t)
      }
      if (text.startsWith('عكس ') || text.startsWith('.عكس ')) {
        const t = text.replace(/^[.\/!#*]?\s*عكس\s*/, '').trim()
        if (t) return reverseText(subSock, from, msg, t)
      }
      if (text.startsWith('احسب ') || text.startsWith('.احسب ')) {
        const t = text.replace(/^[.\/!#*]?\s*احسب\s*/, '').trim()
        if (t) return calcExpression(subSock, from, msg, t)
      }
      if (matchCommand(text, ['اقتباس'])) return randomQuote(subSock, from, msg)
      if (matchCommand(text, ['نكتة'])) return randomJoke(subSock, from, msg)
      if (matchCommand(text, ['هل تعلم'])) return randomFact(subSock, from, msg)

      if (isGroup) {
        const userIsAdmin = isOwner || await isAdmin(subSock, from, senderJid)
        if (matchCommand(text, ['طرد']) && userIsAdmin) return kickMember(subSock, from, msg, getMentioned(msg))
        if (matchCommand(text, ['ترقية']) && userIsAdmin) return promoteMember(subSock, from, msg, getMentioned(msg))
        if (matchCommand(text, ['تنزيل']) && userIsAdmin) return demoteMember(subSock, from, msg, getMentioned(msg))
        if (matchCommand(text, ['قفل']) && userIsAdmin) return muteGroup(subSock, from, msg)
        if (matchCommand(text, ['فتح']) && userIsAdmin) return unmuteGroup(subSock, from, msg)
        if (matchCommand(text, ['منشن']) && userIsAdmin) return tagAll(subSock, from, msg, '')
        if (matchCommand(text, ['رابط']) && userIsAdmin) return getGroupLink(subSock, from, msg)
      }

    } catch (err) {
      console.log('❌ [SUB] خطأ: ' + err.message)
    }
  })
}

// ═══════════════════════════════════════════════════════
// 📱 معالجة التنصيب
// ═══════════════════════════════════════════════════════
export async function handleInstall(sock, from, msg, text, senderJid, senderNum) {
  const cleanText = text.trim()

  if (cleanText === 'تنصيب' || cleanText === '.تنصيب' || cleanText === 'نصب') {
    const lastRequest = installCooldown.get(senderJid) || 0
    const timePassed = Date.now() - lastRequest
    const cooldownMs = 2 * 60 * 1000

    if (timePassed < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - timePassed) / 1000)
      const mins = Math.floor(remaining / 60)
      const secs = remaining % 60
      await sock.sendMessage(from, {
        text: `⏳ *استنى شوية*\n\nلازم تستنى *${mins} دقيقة و ${secs} ثانية*`
      }, { quoted: msg })
      return true
    }

    await sock.sendMessage(from, {
      text: `╭━━━ ⚡ *${BOT_NAME}* ⚡ ━━━╮
┃
┃ 📱 *تنصيب بوت جديد*
┃
┃ ابعت رقمك مع كود الدولة
┃ ⚠️ بدون + وبدون 0
┃
┃ 📌 مثال: 201068818526
┃
╰━━━━━ ⚡ 𝑫𝑨𝑹𝑲 ⚡ ━━━━╯`
    }, { quoted: msg })
    pendingCodes.set(from, { step: 'awaiting_number', user: senderJid, time: Date.now() })
    return true
  }

  const pending = pendingCodes.get(from)
  if (pending && pending.step === 'awaiting_number') {
    const number = cleanText.replace(/[^0-9]/g, '')

    if (number.length < 10 || number.length > 15) {
      await sock.sendMessage(from, { text: '❌ رقم غلط! ابعت رقم صحيح' }, { quoted: msg })
      return true
    }

    if (activeBots.has(number)) {
      pendingCodes.delete(from)
      await sock.sendMessage(from, { text: '⚠️ البوت ده شغال بالفعل!' }, { quoted: msg })
      return true
    }

    await sock.sendMessage(from, { text: '⏳ جاري التنصيب...' }, { quoted: msg })
    pendingCodes.delete(from)
    installCooldown.set(senderJid, Date.now())
    createSubBot(number, from, sock).catch(console.error)
    return true
  }

  return false
}

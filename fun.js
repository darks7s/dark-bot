// ═══════════════════════════════════════════════════════
// 🎭 المميزات - DARK BOT
// ═══════════════════════════════════════════════════════

import { downloadMediaMessage } from '@whiskeysockets/baileys'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ═══════════════════════════════════════════════════════
// 🔓 فضح (View Once Reveal)
// ═══════════════════════════════════════════════════════
export async function revealMedia(sock, from, msg) {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    if (!quoted) {
      return sock.sendMessage(from, { text: '❌ رد على الرسالة مرة واحدة' }, { quoted: msg })
    }

    // نبحث عن viewOnceMessage
    let mediaMsg = quoted
    if (quoted.viewOnceMessageV2) mediaMsg = quoted.viewOnceMessageV2.message
    else if (quoted.viewOnceMessage) mediaMsg = quoted.viewOnceMessage.message

    const type = Object.keys(mediaMsg)[0]
    const mediaContent = mediaMsg[type]

    if (!mediaContent) {
      return sock.sendMessage(from, { text: '❌ مش لاقي الميديا' }, { quoted: msg })
    }

    await sock.sendMessage(from, { text: '⏳ *جاري التحميل...*' }, { quoted: msg })

    // نحمّل الميديا
    const buffer = await downloadMediaMessage(
      { message: mediaMsg, key: msg.key },
      'buffer',
      {}
    )

    if (!buffer) {
      return sock.sendMessage(from, { text: '❌ فشل التحميل' }, { quoted: msg })
    }

    // نبعت الميديا
    if (type === 'imageMessage') {
      await sock.sendMessage(from, {
        image: buffer,
        caption: mediaContent.caption || '🔓 *تم الفضح*'
      }, { quoted: msg })
    } else if (type === 'videoMessage') {
      await sock.sendMessage(from, {
        video: buffer,
        caption: mediaContent.caption || '🔓 *تم الفضح*'
      }, { quoted: msg })
    } else if (type === 'audioMessage') {
      await sock.sendMessage(from, {
        audio: buffer,
        mimetype: 'audio/mp4'
      }, { quoted: msg })
    } else {
      await sock.sendMessage(from, { text: '❌ نوع الميديا مش مدعوم' }, { quoted: msg })
    }

    console.log('✅ تم الفضح')
  } catch (e) {
    console.log('❌ فشل الفضح:', e.message)
    await sock.sendMessage(from, { text: '❌ فشل: ' + e.message }, { quoted: msg })
  }
}

// ═══════════════════════════════════════════════════════
// 📸 بروفايل
// ═══════════════════════════════════════════════════════
export async function getProfile(sock, from, msg, target) {
  try {
    if (!target) {
      return sock.sendMessage(from, { text: '❌ اعمل منشن أو رد على رسالة' }, { quoted: msg })
    }

    const num = target.split('@')[0]

    // نجيب صورة البروفايل
    let profilePic = null
    try {
      profilePic = await sock.profilePictureUrl(target, 'image')
    } catch (e) {}

    // نجيب الحالة
    let status = null
    try {
      const res = await sock.fetchStatus(target)
      status = res?.status
    } catch (e) {}

    // نجيب الاسم
    let name = num
    try {
      const res = await sock.onWhatsApp(target)
      if (res?.[0]?.exists) {
        name = res[0].notify || num
      }
    } catch (e) {}

    let text = `📸 *معلومات البروفايل*

👤 *الاسم:* ${name}
📱 *الرقم:* +${num}
📝 *الحالة:* ${status || 'مخفي'}

🔗 *اللينك:* wa.me/${num}`

    if (profilePic) {
      await sock.sendMessage(from, {
        image: { url: profilePic },
        caption: text
      }, { quoted: msg })
    } else {
      await sock.sendMessage(from, { text }, { quoted: msg })
    }

  } catch (e) {
    console.log('❌ فشل البروفايل:', e.message)
    await sock.sendMessage(from, { text: '❌ فشل: ' + e.message }, { quoted: msg })
  }
}

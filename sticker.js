// ═══════════════════════════════════════════════════════
// 📱 الستيكرز - DARK BOT
// ═══════════════════════════════════════════════════════

import { downloadMediaMessage } from '@whiskeysockets/baileys'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ═══ تحويل صورة/فيديو لستيكر ═══
export async function makeSticker(sock, from, msg) {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    if (!quoted) {
      return sock.sendMessage(from, { text: '❌ رد على صورة أو فيديو' }, { quoted: msg })
    }

    const type = Object.keys(quoted)[0]
    if (type !== 'imageMessage' && type !== 'videoMessage') {
      return sock.sendMessage(from, { text: '❌ لازم صورة أو فيديو' }, { quoted: msg })
    }

    // نبعت رسالة "جاري التحويل"
    await sock.sendMessage(from, { text: '⏳ *جاري التحويل...*' }, { quoted: msg })

    // ننزّل الصورة/الفيديو
    const stream = await downloadMediaMessage(
      { message: quoted, key: msg.message.extendedTextMessage.contextInfo },
      'buffer',
      {}
    )

    if (!stream) {
      return sock.sendMessage(from, { text: '❌ فشل التحميل' }, { quoted: msg })
    }

    // نبعت الستيكر
    if (type === 'imageMessage') {
      await sock.sendMessage(from, {
        sticker: stream
      }, { quoted: msg })
    } else {
      await sock.sendMessage(from, {
        sticker: stream,
        mimetype: 'image/webp'
      }, { quoted: msg })
    }

    console.log('✅ ستيكر اتبعت')
  } catch (e) {
    console.log('❌ فشل الستيكر:', e.message)
    await sock.sendMessage(from, { text: '❌ فشل التحويل: ' + e.message }, { quoted: msg })
  }
}

// ═══════════════════════════════════════════════════════
// 🚫 نظام الحظر - DARK BOT
// ═══════════════════════════════════════════════════════

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BLOCKS_FILE = path.join(__dirname, 'blocks.json')

// تحميل البيانات
function loadBlocks() {
  try {
    if (fs.existsSync(BLOCKS_FILE)) {
      return JSON.parse(fs.readFileSync(BLOCKS_FILE, 'utf8'))
    }
  } catch (e) {}
  return { global: {}, local: {} }
}

function saveBlocks(data) {
  try {
    fs.writeFileSync(BLOCKS_FILE, JSON.stringify(data, null, 2))
  } catch (e) {}
}

export let blocksData = loadBlocks()

// ═══════════════════════════════════════════════════════
// فحص لو المستخدم محظور
// ═══════════════════════════════════════════════════════
export function isBlocked(userJid, groupJid) {
  const num = userJid.split('@')[0].split(':')[0]
  
  // فحص الحظر العام
  if (blocksData.global[num]) return true
  
  // فحص الحظر الخاص بالجروب
  if (groupJid && blocksData.local[groupJid] && blocksData.local[groupJid][num]) return true
  
  return false
}

// ═══════════════════════════════════════════════════════
// الحظر
// ═══════════════════════════════════════════════════════
export function blockGlobal(userJid) {
  const num = userJid.split('@')[0].split(':')[0]
  blocksData.global[num] = { time: Date.now() }
  saveBlocks(blocksData)
}

export function blockLocal(userJid, groupJid) {
  const num = userJid.split('@')[0].split(':')[0]
  if (!blocksData.local[groupJid]) blocksData.local[groupJid] = {}
  blocksData.local[groupJid][num] = { time: Date.now() }
  saveBlocks(blocksData)
}

// ═══════════════════════════════════════════════════════
// فك الحظر
// ═══════════════════════════════════════════════════════
export function unblockGlobal(userJid) {
  const num = userJid.split('@')[0].split(':')[0]
  delete blocksData.global[num]
  saveBlocks(blocksData)
}

export function unblockLocal(userJid, groupJid) {
  const num = userJid.split('@')[0].split(':')[0]
  if (blocksData.local[groupJid]) {
    delete blocksData.local[groupJid][num]
    saveBlocks(blocksData)
  }
}

export function unblockAllLocal(groupJid) {
  if (blocksData.local[groupJid]) {
    blocksData.local[groupJid] = {}
    saveBlocks(blocksData)
  }
}

// ═══════════════════════════════════════════════════════
// معالجة الأوامر
// ═══════════════════════════════════════════════════════
export async function handleBlock(sock, from, msg, text, senderJid, isGroup) {
  const cleanText = text.replace(/^[.\/!#*]/, '').trim()

  // عرض قائمة الحظر
  if (cleanText === 'بلوك' || cleanText === 'block') {
    await sock.sendMessage(from, {
      text: `╭━━━ 🚫 *نظام الحظر* ━━━╮
┃
┃ 🔹 *.بلوك خاص تشغيل*
┃    يحظر الشخص من البوت الفرعي
┃    في الجروب ده فقط
┃
┃ 🔹 *.بلوك عام تشغيل*
┃    يحظر الشخص من كل مكان
┃
┃ 🔹 *.بلوك خاص ايقاف*
┃    يفك الحظر عن الشخص
┃    في الجروب ده فقط
┃
┃ 🔹 *.بلوك عام ايقاف*
┃    يفك الحظر العام
┃
┃ 🔹 *.بلوك خاص ايقاف_الكل*
┃    يفك الحظر عن الكل
┃    في الجروب ده
┃
╰━━━━━ ⚡ 𝑫𝑨𝑹𝑲 ⚡ ━━━━╯`
    }, { quoted: msg })
    return true
  }

  // .بلوك خاص تشغيل
  if (cleanText === 'بلوك خاص تشغيل') {
    if (!isGroup) return false
    const target = getTarget(msg)
    if (!target) {
      await sock.sendMessage(from, { text: '❌ اعمل منشن أو رد على رسالة' }, { quoted: msg })
      return true
    }
    blockLocal(target, from)
    const num = target.split('@')[0]
    await sock.sendMessage(from, {
      text: '🚫 *تم الحظر الخاص*\n\n@' + num + ' اتحظر من البوت في الجروب ده',
      mentions: [target]
    }, { quoted: msg })
    return true
  }

  // .بلوك عام تشغيل
  if (cleanText === 'بلوك عام تشغيل') {
    const target = getTarget(msg)
    if (!target) {
      await sock.sendMessage(from, { text: '❌ اعمل منشن أو رد على رسالة' }, { quoted: msg })
      return true
    }
    blockGlobal(target)
    const num = target.split('@')[0]
    await sock.sendMessage(from, {
      text: '🚫 *تم الحظر العام*\n\n@' + num + ' اتحظر من البوت في كل مكان',
      mentions: [target]
    }, { quoted: msg })
    return true
  }

  // .بلوك خاص ايقاف
  if (cleanText === 'بلوك خاص ايقاف') {
    if (!isGroup) return false
    const target = getTarget(msg)
    if (!target) {
      await sock.sendMessage(from, { text: '❌ اعمل منشن أو رد على رسالة' }, { quoted: msg })
      return true
    }
    unblockLocal(target, from)
    const num = target.split('@')[0]
    await sock.sendMessage(from, {
      text: '✅ *تم فك الحظر الخاص*\n\n@' + num + ' يقدر يستخدم البوت في الجروب ده',
      mentions: [target]
    }, { quoted: msg })
    return true
  }

  // .بلوك عام ايقاف
  if (cleanText === 'بلوك عام ايقاف') {
    const target = getTarget(msg)
    if (!target) {
      await sock.sendMessage(from, { text: '❌ اعمل منشن أو رد على رسالة' }, { quoted: msg })
      return true
    }
    unblockGlobal(target)
    const num = target.split('@')[0]
    await sock.sendMessage(from, {
      text: '✅ *تم فك الحظر العام*\n\n@' + num + ' يقدر يستخدم البوت في كل مكان',
      mentions: [target]
    }, { quoted: msg })
    return true
  }

  // .بلوك خاص ايقاف_الكل
  if (cleanText === 'بلوك خاص ايقاف_الكل' || cleanText === 'بلوك خاص ايقاف الكل') {
    if (!isGroup) return false
    unblockAllLocal(from)
    await sock.sendMessage(from, {
      text: '✅ *تم فك الحظر عن الكل*\n\nكل المحظورين في الجروب ده اتفك الحظر عنهم'
    }, { quoted: msg })
    return true
  }

  return false
}

function getTarget(msg) {
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
  if (mentioned && mentioned.length > 0) return mentioned[0]
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant
  if (quoted) return quoted
  return null
}

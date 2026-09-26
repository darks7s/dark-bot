// ═══════════════════════════════════════════════════════
// 💾 قاعدة البيانات - DARK BOT
// ═══════════════════════════════════════════════════════

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_FILE = path.join(__dirname, 'database.json')

// ═══ تحميل البيانات ═══
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
      return {
        chats: data.chats || {},
        warns: data.warns || {},
        muted: data.muted || {},
        stats: data.stats || {}
      }
    }
  } catch (e) {
    console.log('❌ خطأ في تحميل DB:', e.message)
  }
  return { chats: {}, warns: {}, muted: {}, stats: {} }
}

// ═══ حفظ البيانات ═══
function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
  } catch (e) {
    console.log('❌ خطأ في حفظ DB:', e.message)
  }
}

// ═══ قاعدة البيانات ═══
export const db = loadDB()

// حفظ تلقائي كل 30 ثانية
setInterval(() => {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)) } catch (e) {}
}, 30000)

// ═══ دوال مساعدة ═══

// إعدادات الجروب
export function getChat(chatId) {
  if (!db.chats[chatId]) {
    db.chats[chatId] = {
      antilink: false,
      antibad: false,
      welcome: false,
      muted: false
    }
    saveDB()
  }
  return db.chats[chatId]
}

export function updateChat(chatId, key, value) {
  if (!db.chats[chatId]) db.chats[chatId] = {}
  db.chats[chatId][key] = value
  saveDB()
}

// الإنذارات
export function addWarn(chatId, userId) {
  if (!db.warns[chatId]) db.warns[chatId] = {}
  if (!db.warns[chatId][userId]) db.warns[chatId][userId] = 0
  db.warns[chatId][userId]++
  saveDB()
  return db.warns[chatId][userId]
}

export function removeWarn(chatId, userId) {
  if (db.warns[chatId] && db.warns[chatId][userId]) {
    db.warns[chatId][userId]--
    if (db.warns[chatId][userId] <= 0) delete db.warns[chatId][userId]
    saveDB()
    return db.warns[chatId]?.[userId] || 0
  }
  return 0
}

export function getWarns(chatId, userId) {
  return db.warns[chatId]?.[userId] || 0
}

export function clearWarns(chatId, userId) {
  if (db.warns[chatId]) {
    delete db.warns[chatId][userId]
    saveDB()
  }
}

export function getAllWarns(chatId) {
  return db.warns[chatId] || {}
}

// المكتومين
export function muteUser(userId) {
  if (!db.muted) db.muted = {}
  db.muted[userId] = { time: Date.now() }
  saveDB()
}

export function unmuteUser(userId) {
  if (db.muted) {
    delete db.muted[userId]
    saveDB()
  }
}

export function isMuted(userId) {
  return !!db.muted?.[userId]
}

export function getAllMuted() {
  return Object.keys(db.muted || {})
}

// الإحصائيات
export function incrementStat(key) {
  if (!db.stats) db.stats = {}
  if (!db.stats[key]) db.stats[key] = 0
  db.stats[key]++
  saveDB()
}

export function getStats() {
  return db.stats || {}
}

export function save() {
  saveDB()
}

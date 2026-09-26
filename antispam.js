// ═══════════════════════════════════════════════════════
// 🛡️ منع السبام - DARK BOT
// ═══════════════════════════════════════════════════════

// تخزين مؤقت للمستخدمين
const userMessages = new Map()
const blockedUsers = new Map()

// الإعدادات
const MAX_MESSAGES = 5        // عدد الرسائل المسموح
const TIME_WINDOW = 10000     // 10 ثواني
const BLOCK_DURATION = 5 * 60 * 1000  // 5 دقايق

// ═══════════════════════════════════════════════════════
// فحص السبام
// ═══════════════════════════════════════════════════════
export function checkSpam(userId) {
  const now = Date.now()

  // لو محظور حالياً
  if (blockedUsers.has(userId)) {
    const blockTime = blockedUsers.get(userId)
    if (now - blockTime < BLOCK_DURATION) {
      return { blocked: true, remaining: Math.ceil((BLOCK_DURATION - (now - blockTime)) / 1000) }
    } else {
      blockedUsers.delete(userId)
      userMessages.delete(userId)
    }
  }

  // نضيف الرسالة الحالية
  if (!userMessages.has(userId)) {
    userMessages.set(userId, [])
  }

  const messages = userMessages.get(userId)
  messages.push(now)

  // نشيل الرسائل القديمة (أقدم من 10 ثواني)
  const recentMessages = messages.filter(t => now - t < TIME_WINDOW)
  userMessages.set(userId, recentMessages)

  // لو تعدى الحد
  if (recentMessages.length > MAX_MESSAGES) {
    blockedUsers.set(userId, now)
    userMessages.delete(userId)
    return { blocked: true, remaining: 300, newBlock: true }
  }

  return { blocked: false }
}

// ═══════════════════════════════════════════════════════
// معالجة السبام
// ═══════════════════════════════════════════════════════
export async function handleSpam(sock, from, msg, userId) {
  const check = checkSpam(userId)

  if (check.blocked) {
    try {
      // نمسح رسالة السبام
      await sock.sendMessage(from, { delete: msg.key })
    } catch (e) {}

    // لو حظر جديد
    if (check.newBlock) {
      const num = userId.split('@')[0]
      try {
        await sock.sendMessage(from, {
          text: `🚫 *ممنوع السبام*\n\n@${num} اتحظر لمدة 5 دقايق`,
          mentions: [userId]
        })
      } catch (e) {}
    }

    return true
  }

  return false
}

// ═══════════════════════════════════════════════════════
// فك الحظر يدوياً (للمشرفين)
// ═══════════════════════════════════════════════════════
export function unblockUser(userId) {
  blockedUsers.delete(userId)
  userMessages.delete(userId)
}

// ═══════════════════════════════════════════════════════
// قائمة المحظورين
// ═══════════════════════════════════════════════════════
export function getBlockedList() {
  const list = []
  const now = Date.now()
  for (const [userId, blockTime] of blockedUsers) {
    const remaining = Math.ceil((BLOCK_DURATION - (now - blockTime)) / 1000)
    if (remaining > 0) {
      list.push({ userId, remaining })
    }
  }
  return list
}

// ═══════════════════════════════════════════════════════
// 📊 الإحصائيات
// ═══════════════════════════════════════════════════════
const stats = {
  messages: 0,
  commands: 0,
  groups: new Set(),
  users: new Set(),
  startTime: Date.now()
}

export function incrementMessages() {
  stats.messages++
}

export function incrementCommands() {
  stats.commands++
}

export function addGroup(groupId) {
  stats.groups.add(groupId)
}

export function addUser(userId) {
  stats.users.add(userId)
}

export function getStats() {
  return {
    messages: stats.messages,
    commands: stats.commands,
    groups: stats.groups.size,
    users: stats.users.size,
    uptime: Date.now() - stats.startTime
  }
}

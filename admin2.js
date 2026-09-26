// ═══════════════════════════════════════════════════════
// 👮 الإدارة المتقدمة - DARK BOT
// ═══════════════════════════════════════════════════════

import { addWarn, removeWarn, getWarns, clearWarns, getAllWarns } from './database.js'

// معلومات الجروب
export async function groupInfo(sock, from, msg) {
  try {
    const metadata = await sock.groupMetadata(from)
    const admins = metadata.participants.filter(p => p.admin).length
    const members = metadata.participants.length
    const owner = metadata.owner?.split('@')[0] || 'غير معروف'
    const created = new Date(metadata.creation * 1000).toLocaleDateString('ar-EG')

    await sock.sendMessage(from, {
      text: `📊 *معلومات الجروب*

📌 *الاسم:* ${metadata.subject}
👥 *الأعضاء:* ${members}
👑 *المشرفين:* ${admins}
📅 *تاريخ الإنشاء:* ${created}
🆔 *المالك:* @${owner}`,
      mentions: [metadata.owner]
    }, { quoted: msg })
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ فشل جلب المعلومات' }, { quoted: msg })
  }
}

// منشن الكل
export async function mentionAll(sock, from, msg) {
  try {
    const metadata = await sock.groupMetadata(from)
    const mentions = metadata.participants.map(p => p.id)
    await sock.sendMessage(from, {
      text: `📢 *منشن للكل*\n\nعدد: ${mentions.length}`,
      mentions
    })
  } catch (e) {}
}

// إنذار
export async function warnMember(sock, from, msg, target) {
  if (!target) return sock.sendMessage(from, { text: '❌ اعمل منشن' }, { quoted: msg })
  const num = target.split('@')[0]
  const count = addWarn(from, num)

  await sock.sendMessage(from, {
    text: `⚠️ *إنذار*\n\n@${num} وصل لـ ${count} إنذار`,
    mentions: [target]
  }, { quoted: msg })

  // طرد تلقائي عند 3 إنذارات
  if (count >= 3) {
    try {
      await sock.groupParticipantsUpdate(from, [target], 'remove')
      clearWarns(from, num)
      await sock.sendMessage(from, {
        text: `🚫 *تم الطرد تلقائياً*\n\n@${num} وصل لـ 3 إنذارات`,
        mentions: [target]
      })
    } catch (e) {}
  }
}

// إلغاء إنذار
export async function unwarnMember(sock, from, msg, target) {
  if (!target) return sock.sendMessage(from, { text: '❌ اعمل منشن' }, { quoted: msg })
  const num = target.split('@')[0]
  const remaining = removeWarn(from, num)

  await sock.sendMessage(from, {
    text: `✅ *تم إلغاء إنذار*\n\n@${num} باقي: ${remaining}`,
    mentions: [target]
  }, { quoted: msg })
}

// عرض الإنذارات
export async function listWarns(sock, from, msg, target) {
  if (target) {
    const num = target.split('@')[0]
    const count = getWarns(from, num)
    return sock.sendMessage(from, {
      text: `📋 *إنذارات* @${num}: *${count}*`,
      mentions: [target]
    }, { quoted: msg })
  }

  const all = getAllWarns(from)
  if (Object.keys(all).length === 0) {
    return sock.sendMessage(from, { text: '📭 مفيش إنذارات' }, { quoted: msg })
  }
  let list = '📋 *الإنذارات:*\n\n'
  for (const [num, count] of Object.entries(all)) {
    list += `• @${num}: ${count}\n`
  }
  await sock.sendMessage(from, {
    text: list,
    mentions: Object.keys(all).map(n => n + '@s.whatsapp.net')
  }, { quoted: msg })
}

// حذف رسالة
export async function deleteMessage(sock, from, msg) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo
  if (!quoted || !quoted.stanzaId) {
    return sock.sendMessage(from, { text: '❌ رد على رسالة عشان تمسحها' }, { quoted: msg })
  }
  try {
    await sock.sendMessage(from, {
      delete: {
        remoteJid: from,
        fromMe: false,
        id: quoted.stanzaId,
        participant: quoted.participant
      }
    })
  } catch (e) {}
}

// تجديد (تنظيف)
export async function cleanup(sock, from, msg) {
  await sock.sendMessage(from, { text: '🧹 *تم التنظيف*' }, { quoted: msg })
}

// اعفاء (فك كل الإنذارات)
export async function pardon(sock, from, msg, target) {
  if (!target) return sock.sendMessage(from, { text: '❌ اعمل منشن' }, { quoted: msg })
  const num = target.split('@')[0]
  clearWarns(from, num)
  await sock.sendMessage(from, {
    text: `✅ *تم العفو*\n\n@${num} اتفك عنه كل الإنذارات`,
    mentions: [target]
  }, { quoted: msg })
}

// مخفي (منشن مخفي - للأونر بس)
export async function hiddenMention(sock, from, msg, isOwner) {
  if (!isOwner) {
    return sock.sendMessage(from, { text: '❌ الأمر ده للمالك بس' }, { quoted: msg })
  }
  try {
    const metadata = await sock.groupMetadata(from)
    const mentions = metadata.participants.map(p => p.id)
    await sock.sendMessage(from, {
      text: '\u200b',
      mentions
    })
    console.log('👻 منشن مخفي: ' + mentions.length)
  } catch (e) {
    console.log('❌ فشل المنشن المخفي:', e.message)
  }
}

// ═══════════════════════════════════════════════════════
// 👮 الإدارة - DARK BOT
// ═══════════════════════════════════════════════════════

export async function isAdmin(sock, groupId, jid) {
  try {
    const metadata = await sock.groupMetadata(groupId)
    const participant = metadata.participants.find(p => p.id === jid)
    return participant?.admin === 'admin' || participant?.admin === 'superadmin'
  } catch (e) { return false }
}

export async function isBotAdmin(sock, groupId) {
  try {
    const metadata = await sock.groupMetadata(groupId)
    const botNum = sock.user.id.split('@')[0].split(':')[0]
    const botLid = sock.user.lid ? sock.user.lid.split('@')[0].split(':')[0] : null
    const botLid2 = sock.user.lid ? sock.user.lid.split('@')[0] : null

    console.log('🔍 botNum:', botNum)
    console.log('🔍 botLid (raw):', sock.user.lid)
    console.log('🔍 botLid (clean):', botLid)

    // نشوف لو في participant اسمه admin ومش إنت
    const admins = metadata.participants.filter(p => p.admin)

    console.log('🔍 عدد الـ admins:', admins.length)

    // لو في admin واحد بس غير إنت → ده البوت
    if (admins.length === 2) {
      // واحد منهم إنت، التاني البوت
      const botAdmin = admins.find(p => {
        const pNum = p.id.split('@')[0].split(':')[0]
        return pNum !== botNum && pNum !== botLid && pNum !== botLid2
      })

      // لو لقينا admin غير إنت
      if (botAdmin) {
        console.log('✅ افتراضياً البوت =', botAdmin.id)
        return true
      }
    }

    // محاولة عادية
    const participant = metadata.participants.find(p => {
      const pNum = p.id.split('@')[0].split(':')[0]
      return pNum === botNum || (botLid && pNum === botLid) || (botLid2 && pNum === botLid2)
    })

    if (participant) {
      console.log('✅ البوت موجود:', participant.id, '| admin:', participant.admin)
      return participant.admin === 'admin' || participant.admin === 'superadmin'
    }

    console.log('⚠️ البوت مش موجود')
    return false
  } catch (e) {
    console.log('❌ isBotAdmin error:', e.message)
    return false
  }
}

export function getMentioned(msg) {
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
  if (mentioned && mentioned.length > 0) return mentioned[0]
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant
  if (quoted) return quoted
  return null
}

export async function kickMember(sock, from, msg, target) {
  if (!target) return sock.sendMessage(from, { text: '❌ اعمل منشن' }, { quoted: msg })
  try {
    await sock.groupParticipantsUpdate(from, [target], 'remove')
    await sock.sendMessage(from, { text: '✅ تم الطرد' })
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ فشل: ' + e.message })
  }
}

export async function promoteMember(sock, from, msg, target) {
  if (!target) return sock.sendMessage(from, { text: '❌ اعمل منشن' }, { quoted: msg })
  try {
    await sock.groupParticipantsUpdate(from, [target], 'promote')
    await sock.sendMessage(from, { text: '✅ تم الترقية' })
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ فشل: ' + e.message })
  }
}

export async function demoteMember(sock, from, msg, target) {
  if (!target) return sock.sendMessage(from, { text: '❌ اعمل منشن' }, { quoted: msg })
  try {
    await sock.groupParticipantsUpdate(from, [target], 'demote')
    await sock.sendMessage(from, { text: '✅ تم التنزيل' })
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ فشل: ' + e.message })
  }
}

export async function muteGroup(sock, from, msg) {
  try {
    await sock.groupSettingUpdate(from, 'announcement')
    await sock.sendMessage(from, { text: '🔒 *تم قفل الجروب*' }, { quoted: msg })
  } catch (e) {}
}

export async function unmuteGroup(sock, from, msg) {
  try {
    await sock.groupSettingUpdate(from, 'not_announcement')
    await sock.sendMessage(from, { text: '🔓 *تم فتح الجروب*' }, { quoted: msg })
  } catch (e) {}
}

export async function tagAll(sock, from, msg, text) {
  try {
    const metadata = await sock.groupMetadata(from)
    const mentions = metadata.participants.map(p => p.id)
    await sock.sendMessage(from, {
      text: text || '📢 *منشن للكل*',
      mentions
    })
  } catch (e) {}
}

export async function getGroupLink(sock, from, msg) {
  try {
    const code = await sock.groupInviteCode(from)
    await sock.sendMessage(from, {
      text: '🔗 *رابط الجروب:*\nhttps://chat.whatsapp.com/' + code
    }, { quoted: msg })
  } catch (e) {}
}

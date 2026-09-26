// ═══════════════════════════════════════════════════════
// ☁️ SoundCloud - DARK BOT
// ═══════════════════════════════════════════════════════

import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ═══ بحث SoundCloud ═══
export async function searchSoundCloud(sock, from, msg, query, sendListMessage) {
  try {
    console.log('🔍 بحث SoundCloud:', query)

    // نستخدم SoundCloud API
    const res = await axios.get('https://api-v2.soundcloud.com/search/tracks', {
      params: {
        q: query,
        client_id: 'a3b1c3d4e5f6g7h8i9j0k1l2m3n4o5p6', // client_id تجريبي
        limit: 7
      },
      timeout: 15000
    })

    const results = res.data?.collection || []
    if (results.length === 0) {
      return sock.sendMessage(from, { text: '❌ مفيش نتايج' }, { quoted: msg })
    }

    // نحفظ النتايج
    global.scResults = global.scResults || {}
    global.scResults[from] = results

    // نبني القائمة
    const sections = [
      {
        title: '🎵 نتايج SoundCloud',
        rows: results.map((track, i) => ({
          title: `${i + 1}. ${(track.title || 'بدون اسم').substring(0, 40)}`,
          id: `sc_${i}`,
          description: `${track.user?.username || 'فنان'} • ${Math.floor((track.duration || 0) / 1000 / 60)}:${String(Math.floor((track.duration || 0) / 1000) % 60).padStart(2, '0')}`
        }))
      }
    ]

    await sendListMessage(
      sock, from, msg,
      `🎵 *نتايج SoundCloud*\n\n🔍 *${query}*\n📊 *النتايج:* ${results.length}\n\n📌 اختر الأغنية:`,
      'DARK BOT © 2026',
      sections,
      '🎵 اختر أغنية'
    )
    return true
  } catch (e) {
    console.log('❌ فشل بحث SoundCloud:', e.message)
    await sock.sendMessage(from, { text: '❌ فشل البحث: ' + e.message }, { quoted: msg })
    return false
  }
}

// ═══ تحميل أغنية ═══
export async function downloadSoundCloud(sock, from, msg, index) {
  try {
    const results = global.scResults?.[from]
    if (!results || !results[index]) {
      return sock.sendMessage(from, { text: '❌ مفيش نتايج' }, { quoted: msg })
    }

    const track = results[index]
    const title = track.title || 'أغنية'
    const duration = track.duration || 0

    await sock.sendMessage(from, {
      text: `🎵 *${title}*\n👤 ${track.user?.username || 'فنان'}\n⏱️ ${Math.floor(duration / 1000 / 60)}:${String(Math.floor(duration / 1000) % 60).padStart(2, '0')}\n\n⏳ *جاري التحميل...*`
    }, { quoted: msg })

    // نجيب لينك التحميل من SoundCloud
    // ملاحظة: SoundCloud محتاج client_id حقيقي، عشان كده ممكن الحل ده ميفتحش
    return sock.sendMessage(from, {
      text: '⚠️ *تحميل SoundCloud مش متاح حالياً*\n\n📌 استخدم *تحميل [اسم]* للتحميل من يوتيوب'
    }, { quoted: msg })
  } catch (e) {
    console.log('❌ فشل تحميل SoundCloud:', e.message)
    await sock.sendMessage(from, { text: '❌ فشل التحميل' }, { quoted: msg })
    return false
  }
}

// ═══════════════════════════════════════════════════════
// 🎵 التحميل - DARK BOT
// ═══════════════════════════════════════════════════════

import yts from 'yt-search'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ═══ نتايج البحث (في الذاكرة) ═══
export const searchResults = {}

// ═══ بحث يوتيوب (يرجع List Message) ═══
export async function searchMusic(sock, from, msg, query, sendListMessage) {
  try {
    const results = await yts(query)
    const videos = results.videos.slice(0, 7)

    if (videos.length === 0) {
      return sock.sendMessage(from, { text: '❌ مفيش نتايج' }, { quoted: msg })
    }

    searchResults[from] = videos

    const sections = [
      {
        title: '🎵 النتايج',
        rows: videos.map((v, i) => ({
          title: `${i + 1}. ${v.title.substring(0, 45)}`,
          id: `song_${i}`,
          description: `${v.timestamp} • ${v.author.name.substring(0, 20)}`
        }))
      }
    ]

    await sendListMessage(
      sock, from, msg,
      `🎵 *نتايج البحث*\n\n🔍 *${query}*\n📊 *النتايج:* ${videos.length}\n\n📌 اختر الأغنية:`,
      'DARK BOT © 2026',
      sections,
      '🎵 اختر أغنية'
    )

    return true
  } catch (e) {
    console.log('❌ فشل البحث:', e.message)
    await sock.sendMessage(from, { text: '❌ فشل البحث' }, { quoted: msg })
    return false
  }
}

// ═══ تحميل أغنية بالاختيار ═══
export async function downloadSong(sock, from, msg, index) {
  try {
    const videos = searchResults[from]
    if (!videos || !videos[index]) {
      return sock.sendMessage(from, { text: '❌ مفيش نتايج' }, { quoted: msg })
    }

    const video = videos[index]

    await sock.sendMessage(from, {
      text: `🎵 *${video.title}*\n⏱️ ${video.timestamp}\n👤 ${video.author.name}\n\n⏳ *جاري التحميل...*`
    }, { quoted: msg })

    const downloadsDir = path.join(__dirname, 'downloads')
    if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true })
    const outputFile = path.join(downloadsDir, Date.now() + '.mp3')

    try {
      await execAsync(`yt-dlp -x --audio-format mp3 -o "${outputFile}" "${video.url}"`, { timeout: 180000 })

      if (fs.existsSync(outputFile)) {
        const audioBuffer = fs.readFileSync(outputFile)
        await sock.sendMessage(from, {
          audio: audioBuffer,
          mimetype: 'audio/mp4',
          ptt: false,
          fileName: video.title + '.mp3'
        }, { quoted: msg })

        try { fs.unlinkSync(outputFile) } catch (e) {}
        delete searchResults[from]
        return true
      }
    } catch (e) {
      console.log('❌ yt-dlp فشل:', e.message)
    }

    await sock.sendMessage(from, { text: `❌ *فشل التحميل*\n\n🔗 ${video.url}` }, { quoted: msg })
    return false
  } catch (e) {
    console.log('❌ فشل التحميل:', e.message)
    await sock.sendMessage(from, { text: '❌ فشل التحميل' }, { quoted: msg })
    return false
  }
}

// ═══ تحميل مباشر ═══
export async function playMusic(sock, from, msg, query) {
  try {
    const results = await yts(query)
    const video = results.videos[0]

    if (!video) {
      return sock.sendMessage(from, { text: '❌ مفيش نتايج' }, { quoted: msg })
    }

    const downloadsDir = path.join(__dirname, 'downloads')
    if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true })
    const outputFile = path.join(downloadsDir, Date.now() + '.mp3')

    try {
      await execAsync(`yt-dlp -x --audio-format mp3 -o "${outputFile}" "${video.url}"`, { timeout: 180000 })

      if (fs.existsSync(outputFile)) {
        const audioBuffer = fs.readFileSync(outputFile)
        await sock.sendMessage(from, {
          audio: audioBuffer,
          mimetype: 'audio/mp4',
          ptt: false,
          fileName: video.title + '.mp3'
        }, { quoted: msg })

        try { fs.unlinkSync(outputFile) } catch (e) {}
        return true
      }
    } catch (e) {
      console.log('❌ yt-dlp فشل:', e.message)
    }

    await sock.sendMessage(from, { text: `❌ *فشل التحميل*\n\n🔗 ${video.url}` }, { quoted: msg })
    return false
  } catch (e) {
    console.log('❌ فشل التحميل:', e.message)
    await sock.sendMessage(from, { text: '❌ فشل التحميل' }, { quoted: msg })
    return false
  }
}

// ═══════════════════════════════════════════════════════
// 🎵 TikTok - DARK BOT
// ═══════════════════════════════════════════════════════

import axios from 'axios'

// ═══ تحميل فيديو TikTok ═══
export async function downloadTikTokVideo(sock, from, msg, url) {
  try {
    await sock.sendMessage(from, { text: '⏳ *جاري التحميل...*' }, { quoted: msg })

    const res = await axios.get('https://tikwm.com/api/', {
      params: { url: url },
      timeout: 30000
    })

    if (res.data?.code !== 0 || !res.data?.data) {
      return sock.sendMessage(from, { text: '❌ فشل التحميل' }, { quoted: msg })
    }

    const data = res.data.data
    const videoUrl = data.play || data.wmplay

    if (!videoUrl) {
      return sock.sendMessage(from, { text: '❌ مفيش فيديو' }, { quoted: msg })
    }

    // نحمل الفيديو
    const videoRes = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
      timeout: 90000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    const buffer = Buffer.from(videoRes.data)
    const sizeMB = buffer.length / (1024 * 1024)

    if (sizeMB > 64) {
      return sock.sendMessage(from, { text: '❌ الفيديو كبير جداً (>64MB)' }, { quoted: msg })
    }

    await sock.sendMessage(from, {
      video: buffer,
      mimetype: 'video/mp4',
      caption: `🎵 *${data.title || 'TikTok'}*`
    }, { quoted: msg })

    return true
  } catch (e) {
    console.log('❌ فشل TikTok:', e.message)
    await sock.sendMessage(from, { text: '❌ فشل التحميل: ' + e.message }, { quoted: msg })
    return false
  }
}

// ═══ تحميل صوت TikTok ═══
export async function downloadTikTokAudio(sock, from, msg, url) {
  try {
    await sock.sendMessage(from, { text: '⏳ *جاري التحميل...*' }, { quoted: msg })

    const res = await axios.get('https://tikwm.com/api/', {
      params: { url: url },
      timeout: 30000
    })

    if (res.data?.code !== 0 || !res.data?.data) {
      return sock.sendMessage(from, { text: '❌ فشل التحميل' }, { quoted: msg })
    }

    const data = res.data.data
    const audioUrl = data.music

    if (!audioUrl) {
      return sock.sendMessage(from, { text: '❌ مفيش صوت' }, { quoted: msg })
    }

    const audioRes = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    const buffer = Buffer.from(audioRes.data)

    await sock.sendMessage(from, {
      audio: buffer,
      mimetype: 'audio/mp4',
      ptt: false,
      fileName: (data.music_info?.title || 'TikTok Audio') + '.mp3'
    }, { quoted: msg })

    return true
  } catch (e) {
    console.log('❌ فشل TikTok Audio:', e.message)
    await sock.sendMessage(from, { text: '❌ فشل التحميل' }, { quoted: msg })
    return false
  }
}

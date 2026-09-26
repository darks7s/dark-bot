// ═══════════════════════════════════════════════════════
// 🤖 الذكاء الاصطناعي - DARK BOT
// ═══════════════════════════════════════════════════════

import axios from 'axios'

// ═══ AI Chat ═══
export async function askAI(sock, from, msg, question) {
  try {
    // Pollinations AI (مجاني وبدون مفتاح)
    const prompt = `أنت مساعد ذكي اسمك DARK BOT. رد بالعربي بشكل مختصر ومفيد.\n\nالسؤال: ${question}`
    const url = 'https://text.pollinations.ai/' + encodeURIComponent(prompt)

    const res = await axios.get(url, { timeout: 30000 })
    const answer = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)

    if (!answer || answer.length < 2) throw new Error('مفيش رد')

    await sock.sendMessage(from, { text: '🤖 *AI:*\n\n' + answer }, { quoted: msg })
  } catch (e) {
    console.log('❌ AI Error:', e.message)
    await sock.sendMessage(from, { text: '❌ فشل الاتصال بالذكاء الاصطناعي، جرب تاني' }, { quoted: msg })
  }
}

// ═══ توليد صور ═══
export async function generateImage(sock, from, msg, prompt) {
  try {
    const url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?width=1024&height=1024&nologo=true'
    await sock.sendMessage(from, {
      image: { url },
      caption: '🎨 *' + prompt + '*'
    }, { quoted: msg })
  } catch (e) {
    console.log('❌ Image Error:', e.message)
    await sock.sendMessage(from, { text: '❌ فشل توليد الصورة' }, { quoted: msg })
  }
}

// ═══ ترجمة ═══
export async function translate(sock, from, msg, text, to = 'ar') {
  try {
    const res = await axios.get('https://api.mymemory.translated.net/get', {
      params: { q: text, langpair: 'auto|' + to },
      timeout: 15000
    })
    const translated = res.data?.responseData?.translatedText
    if (!translated) throw new Error('فشل الترجمة')
    await sock.sendMessage(from, { text: '🌐 *الترجمة:*\n\n' + translated }, { quoted: msg })
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ فشل الترجمة' }, { quoted: msg })
  }
}

// ═══ صور أنمي عشوائية ═══
export async function randomAnimeImage(sock, from, msg, category = 'waifu') {
  try {
    const res = await axios.get('https://api.waifu.pics/sfw/' + category, { timeout: 15000 })
    const url = res.data?.url
    if (!url) throw new Error('فشل')
    await sock.sendMessage(from, { image: { url }, caption: '🖼️ *' + category + '*' }, { quoted: msg })
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ فشل جلب الصورة' }, { quoted: msg })
  }
}

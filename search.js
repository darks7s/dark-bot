// ═══════════════════════════════════════════════════════
// 🔍 البحث - DARK BOT
// ═══════════════════════════════════════════════════════

import axios from 'axios'

// ═══════════════════════════════════════════════════════
// 🔍 بحث DuckDuckGo
// ═══════════════════════════════════════════════════════
export async function searchWeb(sock, from, msg, query) {
  try {
    // استخدام DuckDuckGo Instant Answer API
    const url = 'https://api.duckduckgo.com/?q=' + encodeURIComponent(query) + '&format=json&no_html=1&skip_disambig=1'
    
    const res = await axios.get(url, { timeout: 15000 })
    const data = res.data

    let text = '🔍 *نتايج البحث:* ' + query + '\n\n'

    if (data.AbstractText) {
      text += '📖 ' + data.AbstractText + '\n\n'
      if (data.AbstractURL) text += '🔗 ' + data.AbstractURL + '\n\n'
    }

    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      text += '📌 *مواضيع ذات صلة:*\n\n'
      let count = 0
      for (const topic of data.RelatedTopics) {
        if (count >= 5) break
        if (topic.Text && topic.FirstURL) {
          text += '• ' + topic.Text.substring(0, 100) + '\n'
          text += '  🔗 ' + topic.FirstURL + '\n\n'
          count++
        }
      }
    }

    if (!data.AbstractText && (!data.RelatedTopics || data.RelatedTopics.length === 0)) {
      text += '❌ مفيش نتايج واضحة\n\n'
      text += '🔗 *جرب تدور بنفسك:*\n'
      text += 'https://duckduckgo.com/?q=' + encodeURIComponent(query)
    }

    await sock.sendMessage(from, { text }, { quoted: msg })
  } catch (e) {
    console.log('❌ فشل البحث:', e.message)
    await sock.sendMessage(from, {
      text: '❌ فشل البحث\n\n🔗 جرب: https://duckduckgo.com/?q=' + encodeURIComponent(query)
    }, { quoted: msg })
  }
}

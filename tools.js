// ═══════════════════════════════════════════════════════
// 🛠️ الأدوات - DARK BOT
// ═══════════════════════════════════════════════════════

const quotes = ['الصبر مفتاح الفرج', 'من جد وجد', 'العلم نور', 'الوقت كالسيف إن لم تقطعه قطعك', 'خير الكلام ما قل ودل']
const jokes = ['واحد راح للدكتور قاله هموت قاله مات', 'مرة واحد غبي اشترى تليفون صامت', 'واحد بيقول لصاحبه أنا مش بضحك قاله ولا أنا']
const facts = ['العسل مش بيتلف', 'القلب بينبض 100 ألف مرة في اليوم', 'الفيل هو الحيوان الوحيد اللي مش يقدر يقفز', 'النملة تقدر تشيل 50 ضعف وزنها']

export async function decorateText(sock, from, msg, text) {
  await sock.sendMessage(from, { text: '✨ ' + text + ' ✨' }, { quoted: msg })
}

export async function reverseText(sock, from, msg, text) {
  const reversed = text.split('').reverse().join('')
  await sock.sendMessage(from, { text: reversed }, { quoted: msg })
}

export async function calcExpression(sock, from, msg, expr) {
  try {
    const clean = expr.replace(/[^0-9+\-*/().\s]/g, '')
    const result = eval(clean)
    await sock.sendMessage(from, { text: '🧮 *النتيجة:* ' + result }, { quoted: msg })
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ تعبير غلط' }, { quoted: msg })
  }
}

export async function randomQuote(sock, from, msg) {
  const q = quotes[Math.floor(Math.random() * quotes.length)]
  await sock.sendMessage(from, { text: '💬 *اقتباس:*\n' + q }, { quoted: msg })
}

export async function randomJoke(sock, from, msg) {
  const j = jokes[Math.floor(Math.random() * jokes.length)]
  await sock.sendMessage(from, { text: '😂 *نكتة:*\n' + j }, { quoted: msg })
}

export async function randomFact(sock, from, msg) {
  const f = facts[Math.floor(Math.random() * facts.length)]
  await sock.sendMessage(from, { text: '🧠 *هل تعلم:*\n' + f }, { quoted: msg })
}

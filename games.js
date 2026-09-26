// ═══════════════════════════════════════════════════════
// 🎮 الألعاب - DARK BOT
// ═══════════════════════════════════════════════════════

// ═══ ألعاب في الذاكرة ═══
export const games = {
  xo: {},
  guess: {},
  rps: {},
  word: {},
  roulette: {},
  cards: {}
}

// ═══ نرد ═══
export async function playDice(sock, from, msg) {
  const result = Math.floor(Math.random() * 6) + 1
  const dice = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
  await sock.sendMessage(from, {
    text: `🎲 *النتيجة:* ${dice[result - 1]} (${result})`
  }, { quoted: msg })
}

// ═══ تخمين ═══
export async function playGuess(sock, from, msg, senderJid) {
  const number = Math.floor(Math.random() * 100) + 1
  games.guess[from] = { number, attempts: 0, player: senderJid }
  await sock.sendMessage(from, {
    text: `🎯 *لعبة التخمين*\n\nخمنت رقم من 1 لـ 100\nاكتب تخمينك`
  }, { quoted: msg })
}

// ═══ حجر ورقة مقص ═══
export async function playRPS(sock, from, msg) {
  const choices = ['حجر', 'ورقة', 'مقص']
  const bot = choices[Math.floor(Math.random() * 3)]
  games.rps[from] = { bot }
  await sock.sendMessage(from, {
    text: `✊ *حجر ورقة مقص*\n\nالبوت اختار: *${bot}*\nاكتب اختيارك: حجر / ورقة / مقص`
  }, { quoted: msg })
}

// ═══ XO ═══
export async function playXO(sock, from, msg) {
  games.xo[from] = {
    board: ['1','2','3','4','5','6','7','8','9'],
    turn: 'X'
  }
  await sock.sendMessage(from, {
    text: renderXO(games.xo[from].board) + '\n\n*دورك:* X\nاكتب رقم من 1 لـ 9'
  }, { quoted: msg })
}

function renderXO(board) {
  return `🎮 *XO*\n\n${board[0]} | ${board[1]} | ${board[2]}\n─────────\n${board[3]} | ${board[4]} | ${board[5]}\n─────────\n${board[6]} | ${board[7]} | ${board[8]}`
}

function checkWin(board, player) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ]
  return wins.some(w => w.every(i => board[i] === player))
}

// ═══ كلمة السر ═══
const words = ['قهوة', 'شمس', 'قمر', 'نجمة', 'بحر', 'جبل', 'شجرة', 'طائر', 'سمكة', 'مدرسة', 'كتاب', 'قلم', 'حاسوب', 'هاتف', 'باب', 'شباك', 'كرسي', 'طاولة', 'سرير', 'مطبخ']

export async function playWord(sock, from, msg) {
  const word = words[Math.floor(Math.random() * words.length)]
  const hint = word[0] + '_'.repeat(word.length - 1)
  games.word[from] = { word, attempts: 0 }
  await sock.sendMessage(from, {
    text: `🔤 *كلمة السر*\n\n💡 *تلميح:* ${hint}\n📏 *الطول:* ${word.length} حرف\n\nاكتب الكلمة`
  }, { quoted: msg })
}

// ═══ روليت ═══
export async function playRoulette(sock, from, msg) {
  const prizes = ['🎁 100 نقطة', '💀 خسرت', '🎁 50 نقطة', '💀 خسرت', '🎁 200 نقطة', '💀 خسرت', '🎁 0 نقطة', '💀 خسرت']
  const result = prizes[Math.floor(Math.random() * prizes.length)]
  await sock.sendMessage(from, {
    text: `🎰 *روليت*\n\n🎯 *النتيجة:* ${result}`
  }, { quoted: msg })
}

// ═══ كوتشينة ═══
export async function playCards(sock, from, msg) {
  const suits = ['♠️', '♥️', '♦️', '♣️']
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  const playerCards = []
  const botCards = []
  
  for (let i = 0; i < 3; i++) {
    playerCards.push({
      suit: suits[Math.floor(Math.random() * 4)],
      value: values[Math.floor(Math.random() * 13)]
    })
    botCards.push({
      suit: suits[Math.floor(Math.random() * 4)],
      value: values[Math.floor(Math.random() * 13)]
    })
  }
  
  games.cards[from] = { playerCards, botCards }
  
  let text = `🃏 *كوتشينة*\n\n👤 *أوراقك:*\n`
  playerCards.forEach(c => { text += `  ${c.value} ${c.suit}\n` })
  text += `\n🤖 *أوراق البوت:*\n`
  botCards.forEach(c => { text += `  ${c.value} ${c.suit}\n` })
  
  await sock.sendMessage(from, { text }, { quoted: msg })
}

// ═══ معالجة ردود الألعاب ═══
export async function handleGameReply(sock, from, msg, text, senderJid) {
  const clean = text.trim()

  // تخمين
  if (games.guess[from]) {
    const num = parseInt(clean)
    if (!isNaN(num)) {
      const game = games.guess[from]
      game.attempts++
      if (num === game.number) {
        await sock.sendMessage(from, {
          text: `🎉 *مبروك!*\n\nخمنت الرقم ${num} في ${game.attempts} محاولة`
        }, { quoted: msg })
        delete games.guess[from]
        return true
      } else if (num < game.number) {
        await sock.sendMessage(from, { text: '⬆️ *أكبر*' }, { quoted: msg })
        return true
      } else {
        await sock.sendMessage(from, { text: '⬇️ *أصغر*' }, { quoted: msg })
        return true
      }
    }
  }

  // حجر ورقة مقص
  if (games.rps[from]) {
    if (['حجر', 'ورقة', 'مقص'].includes(clean)) {
      const bot = games.rps[from].bot
      let result = ''
      if (clean === bot) result = '🤝 *تعادل*'
      else if (
        (clean === 'حجر' && bot === 'مقص') ||
        (clean === 'ورقة' && bot === 'حجر') ||
        (clean === 'مقص' && bot === 'ورقة')
      ) result = '🎉 *فزت!*'
      else result = '😅 *خسرت!*'
      
      await sock.sendMessage(from, {
        text: `البوت: *${bot}*\nإنت: *${clean}*\n\n${result}`
      }, { quoted: msg })
      delete games.rps[from]
      return true
    }
  }

  // XO
  if (games.xo[from]) {
    const num = parseInt(clean)
    if (!isNaN(num) && num >= 1 && num <= 9) {
      const game = games.xo[from]
      if (game.board[num - 1] === 'X' || game.board[num - 1] === 'O') return false
      
      game.board[num - 1] = 'X'
      
      if (checkWin(game.board, 'X')) {
        await sock.sendMessage(from, {
          text: `🎉 *فزت!*\n\n${renderXO(game.board)}`
        }, { quoted: msg })
        delete games.xo[from]
        return true
      }
      
      const empty = game.board.map((v, i) => v !== 'X' && v !== 'O' ? i : -1).filter(i => i !== -1)
      if (empty.length === 0) {
        await sock.sendMessage(from, {
          text: `🤝 *تعادل*\n\n${renderXO(game.board)}`
        }, { quoted: msg })
        delete games.xo[from]
        return true
      }
      
      const botMove = empty[Math.floor(Math.random() * empty.length)]
      game.board[botMove] = 'O'
      
      if (checkWin(game.board, 'O')) {
        await sock.sendMessage(from, {
          text: `😅 *خسرت!*\n\n${renderXO(game.board)}`
        }, { quoted: msg })
        delete games.xo[from]
        return true
      }
      
      await sock.sendMessage(from, {
        text: renderXO(game.board) + '\n\n*دورك:* X'
      }, { quoted: msg })
      return true
    }
  }

  // كلمة السر
  if (games.word[from]) {
    const game = games.word[from]
    if (clean === game.word) {
      await sock.sendMessage(from, {
        text: `🎉 *مبروك!*\n\nالكلمة الصح: *${game.word}*`
      }, { quoted: msg })
      delete games.word[from]
      return true
    } else {
      game.attempts++
      await sock.sendMessage(from, {
        text: `❌ *غلط*\n\n📏 *الطول:* ${game.word.length}\n💡 *تلميح:* ${game.word[0]}${'_'.repeat(game.word.length - 1)}`
      }, { quoted: msg })
      return true
    }
  }

  return false
}

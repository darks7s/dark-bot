// ═══════════════════════════════════════════════════════
// ⚙️ إعدادات البوت - DARK BOT
// ═══════════════════════════════════════════════════════

export const BOT_NAME = '𝑫𝑨𝑹𝑲 𝑩𝑶𝑻ᬽ'
export const BOT_NAME_SHORT = '𝑩𝑶𝑻 𝑴𝑹↝|𝑫𝑨𝑹𝑲'
export const OWNER_NUMBER = '201068818526'
export const OWNER_NAME = '𝑫𝑨𝑹𝑲'
export const OWNER_CONTACT = 'wa.me/201068818526'
export const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Jxk4K0IBcsdKEas1P'
import fs from 'fs'

export const SESSION_DIR = fs.existsSync('/app') ? '/app/session' : './session'
export const SUB_BOTS_DIR = './subbots'
export const PREFIX = ['.', '/', '!', '#', '*']
export const SUB_BOT_NAME = 'DARK SUB'
export const INSTALL_OPEN = true
export const PAIRING_TIMEOUT = 60000

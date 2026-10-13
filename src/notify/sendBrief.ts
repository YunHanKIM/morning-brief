import type { Brief } from '../brief/generateBrief'
import { formatBrief } from './formatBrief'
import { readTelegramConfig, sendTelegramMessage } from './telegram'

export type TelegramStatus = { status: 'sent' } | { status: 'failed'; reason: string }

// 브리핑을 Telegram으로 보낸다. 어떤 경우에도 던지지 않는다 (전송이 실패해도 저장은 유지되어야 하므로)
export async function sendBriefToTelegram(
  brief: Brief,
  env: Record<string, string | undefined> = process.env,
): Promise<TelegramStatus> {
  const config = readTelegramConfig(env)
  if (!config) return { status: 'failed', reason: 'telegram not configured' }

  let text: string
  try {
    text = formatBrief(brief)
  } catch {
    return { status: 'failed', reason: '메시지를 만들지 못했습니다' }
  }

  const result = await sendTelegramMessage({ ...config, text })
  return result.ok ? { status: 'sent' } : { status: 'failed', reason: result.reason }
}

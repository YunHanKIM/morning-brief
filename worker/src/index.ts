// Cloudflare Workers Cron이 매일 정해진 시각에 앱의 POST /api/cron/brief를 부른다.
// GitHub Actions 예약 실행이 몇 시간씩 밀려서 스케줄러만 옮긴 것이고, 앱 쪽은 그대로다.
// 재시도하지 않는다: 앱이 502를 돌려줘도 저장 또는 전송 중 한쪽은 이미 성공했을 수 있어
// 다시 부르면 Telegram이 중복 전송된다.

export interface Env {
  BRIEF_URL: string
  CRON_SECRET: string
}

type Fetcher = (url: string, init: RequestInit & { headers: Record<string, string> }) => Promise<Response>

const TIMEOUT_MS = 120_000
const BODY_LIMIT = 300

export async function callBrief(env: Env, fetcher: Fetcher = fetch): Promise<void> {
  if (!env.BRIEF_URL || !env.CRON_SECRET) {
    throw new Error('BRIEF_URL, CRON_SECRET 시크릿을 등록해야 합니다')
  }
  // BOM·공백·줄바꿈·한글이 섞이면 앱이 401로 거절한다. 값을 로그에 남기지 않고 호출 전에 막는다
  if (!/^[\x21-\x7e]+$/.test(env.CRON_SECRET)) {
    throw new Error('CRON_SECRET에 보이지 않는 글자나 공백·한글이 섞여 있습니다. 다시 등록하세요')
  }
  // 끝의 공백·BOM이 경로에 섞이면 /%20/api/cron/brief 같은 엉뚱한 주소로 호출된다
  if (!/^https:\/\/[\x21-\x7e]+$/.test(env.BRIEF_URL)) {
    throw new Error('BRIEF_URL은 공백·한글 없이 https:// 로 시작해야 합니다')
  }

  const url = `${env.BRIEF_URL.replace(/\/$/, '')}/api/cron/brief`

  let response: Response
  try {
    response = await fetcher(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      // 리다이렉트를 따라가면 Authorization이 다른 주소로 넘어갈 수 있다. 3xx는 실패로 처리한다
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    // 원래 오류 메시지에 주소나 토큰이 섞일 수 있어 이름만 남긴다
    const name = error instanceof Error ? error.name : 'Error'
    throw new Error(`브리핑 호출 실패: ${name}`)
  }

  const body = (await response.text()).slice(0, BODY_LIMIT)
  if (!response.ok) {
    throw new Error(`브리핑 호출 실패: ${response.status} ${body}`)
  }
  console.log(`브리핑 호출 성공: ${response.status} ${body}`)
}

const worker = {
  async scheduled(_controller: unknown, env: Env): Promise<void> {
    await callBrief(env)
  },
}

export default worker

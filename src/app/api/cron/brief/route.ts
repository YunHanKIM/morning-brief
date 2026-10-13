import { isAuthorized } from '../../../../brief/auth'
import { runBrief } from '../../../../brief/runBrief'
import { openStore } from '../../../../storage/respond'

const NO_STORE = { 'Cache-Control': 'no-store' }

export async function POST(request: Request): Promise<Response> {
  // 복사해 붙이다 섞인 앞뒤 공백·줄바꿈은 지운다
  const secret = process.env.CRON_SECRET?.trim()
  // 비밀값이 없거나 중간에 공백이 있으면(토큰이 담을 수 없는 값) 닫힌 채로 둔다
  if (!secret || /\s/.test(secret)) {
    return Response.json({ error: 'server not configured' }, { status: 500, headers: NO_STORE })
  }

  if (!isAuthorized(request.headers.get('authorization'), secret)) {
    return Response.json(
      { error: 'unauthorized' },
      { status: 401, headers: { ...NO_STORE, 'WWW-Authenticate': 'Bearer' } },
    )
  }

  const result = await runBrief({
    cityValue: process.env.BRIEF_CITY,
    now: new Date(),
    store: openStore(),
    env: process.env,
  })

  // 저장과 전송이 모두 성공해야 200. 하나라도 실패하면 502로 알려 스케줄러(Actions)가 실패로 표시하게 한다
  const ok = result.snapshot === 'saved' && result.telegram === 'sent'
  return Response.json(result, { status: ok ? 200 : 502, headers: NO_STORE })
}

# Morning Brief — 배포 절차

> 계획 단계의 절차다. 첫 배포 후 실제 값으로 갱신한다.

API 라우트(서버 함수)가 있어 Node 런타임이 필요하다 — 순수 정적 호스팅으로는 배포할 수 없다.

## Vercel (기본) / Netlify (대안)

1. GitHub 저장소(`YunHanKIM/morning-brief`)를 연결한다 (Next.js 자동 감지).
2. 환경변수를 등록한다: `CRON_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (`09_api_contract` 참조).
3. 배포 URL로 `/api/brief`가 응답하는지 확인한다.

## 스케줄 (GitHub Actions)

1. 저장소 Secrets에 `CRON_SECRET`과 배포 URL을 등록한다.
2. `.github/workflows/morning-brief.yml`이 매일 07:00 KST(= 22:00 UTC 전날)에 `/api/cron/brief`를 호출한다.
3. 동작 확인은 Actions 탭의 `workflow_dispatch` 수동 실행으로 먼저 한다.

## Telegram 봇 준비

1. BotFather로 봇을 만들고 토큰을 받는다.
2. 봇에게 메시지를 한 번 보낸 뒤 `getUpdates`로 `chat_id`를 확인한다.

## 로컬 실행

```bash
npm install
npm run dev      # http://localhost:3000
```

## 주의

- 무료 플랜의 함수 실행 시간·cron 한도는 자주 바뀐다. 시작 전에 공식 문서로 확인한다.
- Actions의 schedule cron은 몇 분 지연될 수 있다.

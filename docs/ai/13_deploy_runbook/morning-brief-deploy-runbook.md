# Morning Brief — 배포 절차

> 코드는 로컬에서 끝까지 검증했지만 **실제 배포는 아직 한 번도 하지 않았다.** 아래 "실제 서비스에서만 확인할 수 있는 것"은
> 첫 배포 때 하나씩 확인하고 결과로 이 문서를 고친다. 서비스의 가격·한도·정책은 자주 바뀌므로 가입 화면과 공식 문서를 우선한다.

API 라우트(서버 함수)가 있어 Node 런타임이 필요하다 — 순수 정적 호스팅으로는 배포할 수 없다.

## 0. 직접 만들어야 하는 계정·값 (코드로 대신할 수 없음)

| 무엇 | 왜 | 얻는 값 |
|---|---|---|
| **Vercel** 계정 (GitHub로 가입 가능, Hobby 무료) | 앱 배포 | 배포 주소 `https://….vercel.app` |
| **Upstash** 계정 + Redis DB 1개 (무료) | 브리핑 저장소 | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **Telegram 봇** (@BotFather로 생성) + 봇과 대화 시작 | 아침 메시지 수신 | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| **Cloudflare** 계정 (무료) | 매일 09:30 예약 실행 (Workers Cron) | Worker 시크릿 `BRIEF_URL`, `CRON_SECRET` |
| **GitHub** (이미 있음) 저장소 Secrets 등록 | 수동 실행(Run workflow)용 | `BRIEF_URL`, `CRON_SECRET` |
| 직접 만드는 비밀 문자열 | 자동 실행 인증 | `CRON_SECRET` (긴 무작위 값) |

가입에 카드가 필요한지는 가입 화면에서 확인한다. Vercel Hobby는 개인·비상업 용도 플랜이다(이용 약관 확인).

## 1. 순서

1. **코드 올리기**: `tree/morning-brief` 저장소(`YunHanKIM/morning-brief`)에 푸시한다. 로컬 커밋이 원격보다 앞서 있다.
2. **비밀값 만들기**: `CRON_SECRET`용 긴 무작위 문자열을 만든다 (예: `openssl rand -hex 32`). 공백·줄바꿈 없이 한 줄.
3. **Upstash**: Redis DB 생성 → REST URL과 TOKEN 복사. (Vercel Marketplace로 연결하면 `KV_REST_API_URL/TOKEN` 이름으로 자동 등록되며 앱은 두 이름을 모두 읽는다)
4. **Telegram 봇**: @BotFather에서 `/newbot` → 토큰 받기 → 만든 봇에게 아무 메시지나 한 번 보내기 →
   `https://api.telegram.org/bot<토큰>/getUpdates` 응답의 `chat.id` 확인 (토큰이 주소에 들어가므로 화면 공유·기록에 남기지 않는다).
5. **Vercel**: New Project → 위 GitHub 저장소 선택 (Next.js 자동 감지) → 환경변수 등록 → Deploy.
6. **GitHub Secrets**: 저장소 Settings > Secrets and variables > Actions 에 `BRIEF_URL`(배포 주소, https), `CRON_SECRET`(앱과 같은 값) 등록. 수동 실행용이다.
7. **Cloudflare Worker 배포** (매일 09:30 KST 예약 실행, 아래 "Cloudflare Worker" 절 참고).

### Cloudflare Worker

GitHub Actions 예약 실행이 몇 시간씩 밀려(2026-10-20 14:08 KST 도착, 4시간 38분 지연) 예약만 Cloudflare Workers Cron으로 옮겼다. 앱은 그대로다.

```bash
cd worker
npx wrangler login
npx wrangler secret put BRIEF_URL        # 배포 주소 (https만 허용). Worker가 아직 없으면 새로 만들지 묻는다 → yes
npx wrangler secret put CRON_SECRET      # 앱의 CRON_SECRET과 같은 값
npx wrangler deploy                      # wrangler.toml의 cron "30 0 * * *" (= 09:30 KST) 등록
```

- **시크릿은 `|` 파이프로 넣지 말고 프롬프트에 직접 붙여넣는다.** Windows PowerShell 5.1에서 `값 | npx wrangler secret put …` 으로 넣으면 값 앞에 눈에 안 보이는 BOM(`EF BB BF`)이 붙어 앱이 401로 거절한다(2026-10-20 실제로 겪음).
  Worker는 공백·BOM·한글이 섞인 값을 호출 전에 막지만, 다시 등록하는 것은 사람이 해야 한다.
- **cron 변경은 반영까지 최대 15분 걸린다.** 시각을 바꿔 시험할 때는 20분 뒤로 잡는다(4~5분 뒤로 잡았을 때는 실행되지 않았다).
- **시크릿을 먼저 넣고 deploy한다.** 반대로 하면 cron이 켜진 뒤 시크릿이 없는 짧은 틈에 예약 시각이 오면 설정 오류로 실패한다.
- 시크릿은 파일이 아니라 `wrangler secret put`으로만 넣는다. 값을 바꾸면 Vercel·GitHub·Cloudflare 세 곳을 맞춘다.
- 등록 후 Cloudflare 대시보드 > Workers > `morning-brief-cron` > Triggers 에서 cron이 보이는지, Logs에서 `브리핑 호출 성공`이 찍히는지 확인한다.
- **GitHub 워크플로의 예약(schedule)은 제거됐다.** 다시 켜면 두 곳에서 호출되어 Telegram이 중복 전송된다.

### Vercel 환경변수

| 이름 | 값 | 비고 |
|---|---|---|
| `CRON_SECRET` | 2번에서 만든 값 | 비면 API는 500으로 닫힘 |
| `BRIEF_CITY` | `서울` 등 주요 도시 이름 (또는 도시 JSON) | 비면 서울 |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Upstash 값 | https 주소만 허용 |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Telegram 값 | 형식이 틀리면 전송은 failed |
| `SNAPSHOT_STORE` | **비워 둔다** | `memory`는 개발용(재시작하면 사라짐) |

## 2. 첫 배포 후 확인 순서

1. 배포 주소를 열어 대시보드가 보이는지 (날씨는 도시를 고르기 전까지 "도시를 선택하세요").
2. `GET <주소>/api/brief` → 저장 전에는 `404 {"error":"not found"}` 이면 정상. `503`이면 Upstash 환경변수 확인.
3. `POST <주소>/api/cron/brief`를 토큰 없이 호출 → `401` 이어야 한다.
4. Actions 탭 > Morning Brief > **Run workflow**(수동 실행) → 성공(초록)해야 하고, 로그에 `{"date":…,"snapshot":"saved","telegram":"sent"}` 가 보인다.
   (Worker를 배포한 뒤에는 `npx wrangler tail`로 로그를 보며 다음 09:30을 기다리거나, 대시보드에서 cron 이벤트를 수동으로 시험한다.)
5. Telegram에 메시지가 도착했는지.
6. 대시보드 아래 "지난 브리핑"에 오늘 날짜가 생기고, 누르면 읽기 전용으로 열리는지.
7. 실패 확인: `snapshot`/`telegram` 중 `failed`가 있으면 Actions가 빨갛게(502) 끝난다. 이유는 **응답이 아니라 Vercel 로그**(`[brief] …`)에 있다.

## 3. 실제 서비스에서만 확인할 수 있는 것 (아직 미검증)

- Upstash REST가 우리 요청 형식(POST + JSON 배열 + Bearer)대로 동작하는지, 환경변수 이름이 위 둘 중 어느 쪽으로 들어오는지.
- Upstash 무료 DB 개수·비활성 시 정책 (공식 페이지 확인).
- Telegram 메시지가 실제로 도착하는지 (오류 응답 형식은 가짜 토큰으로 확인함).
- Vercel 함수 실행 시간: 현재 Hobby의 기본·최대가 300초로 알려져 있고 우리 최악 시간은 약 35초다.
  다만 **오래된 프로젝트는 Fluid Compute가 꺼져 있어 더 짧을 수 있으니** Project Settings > Functions에서 확인한다.
- `use cache`는 서버리스에서 요청 사이에 유지되지 않을 수 있다 (유지 안 되면 명언·번역 외부 호출이 늘어난다 — 번역이 실패하면 영어만 보인다).

## 4. 운영 중 알아둘 점

- **예약 실행은 09:30 KST**(00:30 UTC)에 Cloudflare Worker가 맡는다. GitHub Actions 예약은 몇 시간씩 밀려서 쓰지 않는다.
  Cloudflare도 지연될 수 있으니 배포 후 며칠은 도착 시각을 확인한다. 메시지가 안 오면 Cloudflare 대시보드 > Workers > `morning-brief-cron` 의 Logs·Triggers를 먼저 본다.
- **Worker도 재시도하지 않는다.** 앱이 502를 돌려주면 Worker 실행이 실패로 기록될 뿐이다. 필요할 때만 GitHub Actions의 Run workflow로 수동 실행한다.
- **재시도하지 않는다.** 같은 날 두 번 실행하면 스냅샷은 덮어쓰고 Telegram은 다시 전송된다. 502가 났으면 어느 쪽이 실패했는지 로그로 보고 필요할 때만 수동 실행한다.
- **공개 데모에서 열려 있는 것**: 대시보드, `GET /api/brief`, `GET /api/brief/history`, 그리고 도시 검색·날씨 조회(Server Action, 외부 무료 API를 호출함).
  쓰기·cron 엔드포인트는 토큰으로 보호된다. 방문자가 많아지면 도시 검색이 무료 지오코딩 한도를 쓰므로 필요 시 요청 제한을 추가한다(미구현).
- **비밀값 교체**: `CRON_SECRET`을 바꾸면 Vercel, GitHub Secrets, Cloudflare Worker 세 곳을 같은 값으로 맞춘다. 봇 토큰이 노출됐으면 @BotFather에서 `/revoke`.
- 실패 알림: Worker 실행 실패는 Cloudflare 대시보드에서 확인한다. 이메일 알림이 필요하면 Cloudflare 알림 설정에서 따로 켠다.

## 5. 로컬 실행

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # Jest
npm run build && npm start
```

로컬에서 저장·조회를 시험하려면 `SNAPSHOT_STORE=memory CRON_SECRET=… npm start` 후
`curl -X POST localhost:3000/api/cron/brief -H "Authorization: Bearer …"` (Telegram 설정이 없으면 전송은 failed → 502, 저장은 된다).

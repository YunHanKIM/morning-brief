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
| **GitHub** (이미 있음) 저장소 Secrets 등록 | 예약 실행 | `BRIEF_URL`, `CRON_SECRET` |
| 직접 만드는 비밀 문자열 | 자동 실행 인증 | `CRON_SECRET` (긴 무작위 값) |

가입에 카드가 필요한지는 가입 화면에서 확인한다. Vercel Hobby는 개인·비상업 용도 플랜이다(이용 약관 확인).

## 1. 순서

1. **코드 올리기**: `tree/morning-brief` 저장소(`YunHanKIM/morning-brief`)에 푸시한다. 로컬 커밋이 원격보다 앞서 있다.
2. **비밀값 만들기**: `CRON_SECRET`용 긴 무작위 문자열을 만든다 (예: `openssl rand -hex 32`). 공백·줄바꿈 없이 한 줄.
3. **Upstash**: Redis DB 생성 → REST URL과 TOKEN 복사. (Vercel Marketplace로 연결하면 `KV_REST_API_URL/TOKEN` 이름으로 자동 등록되며 앱은 두 이름을 모두 읽는다)
4. **Telegram 봇**: @BotFather에서 `/newbot` → 토큰 받기 → 만든 봇에게 아무 메시지나 한 번 보내기 →
   `https://api.telegram.org/bot<토큰>/getUpdates` 응답의 `chat.id` 확인 (토큰이 주소에 들어가므로 화면 공유·기록에 남기지 않는다).
5. **Vercel**: New Project → 위 GitHub 저장소 선택 (Next.js 자동 감지) → 환경변수 등록 → Deploy.
6. **GitHub Secrets**: 저장소 Settings > Secrets and variables > Actions 에 `BRIEF_URL`(배포 주소, https), `CRON_SECRET`(앱과 같은 값) 등록.

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

- **예약 실행은 09:30 KST**(00:30 UTC). 정각을 피했지만 GitHub 부하에 따라 지연되거나 드물게 누락될 수 있다.
- **공개 저장소는 60일간 저장소 활동이 없으면 예약 실행이 자동으로 꺼진다(알림 없음).** 아침 메시지가 안 오면 가장 먼저 이것을 의심한다.
  점검(두 달에 한 번, 또는 메시지가 끊겼을 때): GitHub 저장소 > Actions > **Morning Brief** 를 열어
  ① "This scheduled workflow is disabled …" 같은 **비활성(disabled) 배너**가 없는지, ② 최근 실행 기록이 매일 있는지 본다.
  배너가 있으면 **Enable workflow**를 눌러 직접 켜고, **Run workflow**(수동 실행)가 성공(초록)하고 Telegram이 도착하는지까지 확인한다.
  커밋을 하면 다시 켜진다는 말도 있지만 보장되지 않으니 상태를 직접 확인한다.
- **재시도하지 않는다.** 같은 날 두 번 실행하면 스냅샷은 덮어쓰고 Telegram은 다시 전송된다. 502가 났으면 어느 쪽이 실패했는지 로그로 보고 필요할 때만 수동 실행한다.
- **공개 데모에서 열려 있는 것**: 대시보드, `GET /api/brief`, `GET /api/brief/history`, 그리고 도시 검색·날씨 조회(Server Action, 외부 무료 API를 호출함).
  쓰기·cron 엔드포인트는 토큰으로 보호된다. 방문자가 많아지면 도시 검색이 무료 지오코딩 한도를 쓰므로 필요 시 요청 제한을 추가한다(미구현).
- **비밀값 교체**: `CRON_SECRET`을 바꾸면 Vercel과 GitHub Secrets 두 곳을 같은 값으로 맞춘다. 봇 토큰이 노출됐으면 @BotFather에서 `/revoke`.
- 실패 알림: GitHub은 실패한 워크플로를 계정 이메일로 알려 주는 것이 기본이다 (설정에서 확인).

## 5. 로컬 실행

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # Jest
npm run build && npm start
```

로컬에서 저장·조회를 시험하려면 `SNAPSHOT_STORE=memory CRON_SECRET=… npm start` 후
`curl -X POST localhost:3000/api/cron/brief -H "Authorization: Bearer …"` (Telegram 설정이 없으면 전송은 failed → 502, 저장은 된다).

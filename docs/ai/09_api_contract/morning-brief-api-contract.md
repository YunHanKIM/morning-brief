# Morning Brief — API 계약

> `/api/cron/brief`는 U9에서 구현됐다(저장·Telegram 전송은 U12에서 연결). 나머지 라우트는 아직 구현되지 않았다. 구현 단위에서 테스트와 함께 만들고, 실제 라우트와 대조해 갱신한다.

## 내부 라우트 (Next.js Route Handlers)

| 라우트 | 메서드 | 설명 |
|---|---|---|
| `/api/cron/brief` | POST | **(U9 구현)** 위젯 병렬 호출 후 결과 반환. 헤더 `Authorization: Bearer <CRON_SECRET>` 필수(상수 시간 비교), 없거나 불일치 시 `401`(외부 API 무호출), `CRON_SECRET` 미설정·공백 포함이면 `500 {error:"server not configured"}`로 닫힘, `GET` 등은 `405`. 응답 `200 {date(KST), city, widgets: {weather\|exchange\|news\|quote: "ok" \| "error"}, results: {<name>: {status, data\|message}}}`, `Cache-Control: no-store`. **(U12 예정)** 스냅샷 저장 → Telegram 전송 후 응답에 `telegram: "sent" \| "failed"` 추가 |
| `/api/brief` | GET | 오늘(또는 `?date=YYYY-MM-DD`)의 브리핑 스냅샷 조회. 인증 없음, 읽기 전용 |
| `/api/brief/history` | GET | 최근 브리핑 날짜 목록. 인증 없음, 읽기 전용 |

## 환경변수

| 이름 | 용도 | 노출 |
|---|---|---|
| `CRON_SECRET` | cron 엔드포인트 인증. 앞뒤 공백·줄바꿈은 무시, 중간 공백은 설정 오류 | 서버 전용 (GitHub Actions secret에도 동일 값) |
| `BRIEF_CITY` | 자동 브리핑의 날씨 도시(주요 도시 이름 또는 도시 JSON, 비면 서울, 잘못되면 날씨만 오류). 서버 저장소(U10) 전까지의 임시 | 서버 전용 |
| `TELEGRAM_BOT_TOKEN` | Telegram 전송 | 서버 전용 |
| `TELEGRAM_CHAT_ID` | 수신 대상 | 서버 전용 |

## 소비하는 외부 API

위젯별 엔드포인트는 위젯 구현 시 확정해 `02_tech_stack`의 후보 표와 함께 갱신한다.
모든 외부 응답은 zod로 검증하고(첫 외부 API 단위인 U2에서 도입), 타임아웃을 둔다.

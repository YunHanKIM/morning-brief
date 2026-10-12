# Morning Brief — API 계약

> 계획 단계의 계약이다. **아래 라우트는 모두 아직 구현되지 않았다**(`src/app/api/` 없음). 구현 단위에서 테스트와 함께 만들고, 실제 라우트와 대조해 갱신한다.

## 내부 라우트 (Next.js Route Handlers)

| 라우트 | 메서드 | 설명 |
|---|---|---|
| `/api/cron/brief` | POST | 위젯 병렬 호출 → 스냅샷 저장 → Telegram 전송. 헤더 `Authorization: Bearer <CRON_SECRET>` 필수, 불일치 시 `401`. 응답 `{date, widgets: {<name>: "ok" \| "error"}, telegram: "sent" \| "failed"}` |
| `/api/brief` | GET | 오늘(또는 `?date=YYYY-MM-DD`)의 브리핑 스냅샷 조회. 인증 없음, 읽기 전용 |
| `/api/brief/history` | GET | 최근 브리핑 날짜 목록. 인증 없음, 읽기 전용 |

## 환경변수

| 이름 | 용도 | 노출 |
|---|---|---|
| `CRON_SECRET` | cron 엔드포인트 인증 | 서버 전용 (GitHub Actions secret에도 동일 값) |
| `TELEGRAM_BOT_TOKEN` | Telegram 전송 | 서버 전용 |
| `TELEGRAM_CHAT_ID` | 수신 대상 | 서버 전용 |

## 소비하는 외부 API

위젯별 엔드포인트는 위젯 구현 시 확정해 `02_tech_stack`의 후보 표와 함께 갱신한다.
모든 외부 응답은 zod로 검증하고(첫 외부 API 단위인 U2에서 도입), 타임아웃을 둔다.

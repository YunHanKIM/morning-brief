# Morning Brief — 요구사항 정의 및 구현 단위

> 2026-10-11 작성. 범위: 위젯 4개(날씨, 환율, 개발 뉴스, 오늘의 한마디)가 MVP. GitHub 활동 위젯은 2026-10-13에 MVP에서 제외했다(아래 3절). 개발은 아래 "구현 단위"를 한 번에 하나씩, TDD(Jest)로 진행하고
> 코드를 작성한 단위는 codex-critic 리뷰를 받는다. 상태는 구현 시 갱신한다.
> 형식은 상위 저장소 `요구사항_TASK_전환_Format.md`의 매핑(목표·완료 조건·제약)과 호환된다.

## 1. 기능 요구사항 (모두 MVP)

| ID | 요구사항 | 완료 조건 | 제약 | 단위 |
|---|---|---|---|---|
| REQ-F-001 | 위젯 인터페이스 | 위젯은 `fetch → normalize`를 거쳐 `{status: "ok", data}` 또는 `{status: "error", message}` 형태의 결과를 낸다 | 서버 전용 코드. 외부 호출에 타임아웃 | U1 |
| REQ-F-002 | 날씨 위젯 | 사용자가 고른 도시의 현재 기온·날씨 상태·오늘 최고/최저를 정규화해 반환. 도시는 처음 한 번 고르면 바꾸기 전까지 유지(첫 방문은 선택 안내). 이름으로 자유 검색하고, 한국 주요 8곳은 좌표 고정 목록으로도 고른다 | 키 없는 API만 사용. 검색어·저장된 도시는 신뢰하지 않고 검증 | U2, U2b, U4, U4b |
| REQ-F-003 | 환율 위젯 | USD 기준 환율과 기준 일자를 반환. 기본은 USD/KRW이며 사용자가 받는 통화를 고를 수 있다(KRW, JPY, EUR, CNY, GBP, AUD, CAD, CHF). 8개 통화의 환율을 한 번에 조회해 두고, 통화를 바꾸면 조회 없이 화면에서 즉시 전환한다(페이지 전체·다른 위젯 재조회 없음). 주소 `?to=`도 갱신해 새로고침해도 유지한다. 목록 밖 값은 KRW로 되돌린다 | 키 없는 API 우선. 제공 일자(마지막 영업일) 표시 | U5 |
| REQ-F-004 | 개발 뉴스 위젯 | Hacker News 상위 N건(제목·링크·점수) 반환 | 외부 문자열은 텍스트로만 렌더 | U6 |
| REQ-F-005 | ~~GitHub 활동 위젯~~ (MVP 제외, 3절 후순위) | 지정 사용자의 최근 공개 활동 요약(커밋·PR 수 등) 반환 | 토큰은 선택. 미설정 시 rate limit 초과를 오류로 처리 | 후순위 |
| REQ-F-006 | 오늘의 한마디 위젯 | 문구와 출처(작가)를 반환 | 출처 표기 의무 준수 | U8 |
| REQ-F-007 | 부분 실패 허용 | 위젯 하나가 실패해도 나머지 결과는 정상 반환되고 실패 위젯은 `error`로 표시 | `Promise.allSettled` 사용 | U3 |
| REQ-F-008 | 브리핑 생성 API | (U9) `POST /api/cron/brief`가 위젯을 실행해 결과를 반환하고, 토큰이 없거나 틀리면 `401`. (U12) 저장·Telegram 전송을 연결하고 응답에 `{date, widgets, telegram}` 상태를 포함 | 토큰 상수 시간 비교. 시크릿은 서버 환경변수만 | U9, U12 |
| REQ-F-009 | 스냅샷 저장·조회 | 오늘/날짜별 브리핑을 저장하고 `GET /api/brief`로 조회. `GET /api/brief/history`가 최근 날짜 목록을 반환 | 저장소는 U10에서 확정 | U10 |
| REQ-F-010 | Telegram 전송 | 브리핑 요약이 지정 chat으로 전송됨. 실패해도 저장은 유지 | SDK 없이 `fetch`. 토큰 노출 금지 | U11 |
| REQ-F-011 | 대시보드 UI | 오늘의 브리핑 표시, 위젯별 로딩/오류/빈 상태, 반응형·다크 모드 | 외부 HTML 렌더 금지 | U4, 각 위젯 카드, U13 |
| REQ-F-012 | 스케줄 실행 | 매일 09:30 KST에 GitHub Actions가 API를 호출. 수동 실행 가능 | 배포 플랫폼 cron에 의존하지 않음 | U14 |
| REQ-F-013 | 공개 읽기 전용 데모 | 인증 없이 대시보드와 조회 API 열람 가능, 쓰기는 불가 | 쓰기·cron 엔드포인트는 보호 | U14 |

## 2. 비기능 요구사항

| ID | 요구사항 |
|---|---|
| REQ-N-001 | 언어·스택은 React, TypeScript, Next.js(App Router)만 사용한다 |
| REQ-N-002 | 모든 단위는 TDD로 진행한다 (실패 테스트 → 최소 구현 → 정리). 도구는 Jest |
| REQ-N-003 | 코드를 작성한 단위는 codex-critic(읽기 전용) 리뷰를 받고 지적을 반영하거나 사유를 기록한다 |
| REQ-N-004 | 외부 호출은 모두 타임아웃을 둔다. 외부 응답은 사용 전에 zod로 검증한다 (첫 외부 API 단위인 U2에서 zod를 도입) |
| REQ-N-005 | 시크릿은 서버 환경변수로만 읽고 커밋하지 않는다. `.env.example`만 커밋한다 |
| REQ-N-006 | 접근성 기본(레이블, 포커스, 대비)과 모바일 뷰포트를 지킨다 |
| REQ-N-007 | 당장 필요 없는 의존성은 설치하지 않는다 |

## 3. 후순위 (MVP 이후) / 제외

- 후순위: LLM 요약(Claude API), 위젯 설정 UI, 이력 차트, 이메일 알림, GitHub 활동 위젯(공개 활동 요약, 필요 시 `GITHUB_TOKEN`)
- 제외: 다중 사용자 인증, 로그인이 필요한 크롤링(Playwright), 유료 API

## 4. 외부 API 후보 (2026-10-11 응답 확인)

| 위젯 | API | 키 | 확인 | 주의 |
|---|---|---|---|---|
| 날씨 | Open-Meteo `api.open-meteo.com/v1/forecast` | 불필요 | 200 | 비상업적 이용 무료. 약관 확인 |
| 환율 | Frankfurter `api.frankfurter.dev/v1/latest?base=USD&symbols=KRW` | 불필요 | 200 | ECB 기준 영업일 단위 환율. 대안: `open.er-api.com` (출처 표기 필요), 한국수출입은행(키 필요) |
| 개발 뉴스 | Hacker News `hacker-news.firebaseio.com/v0/topstories.json` + `item/{id}.json` | 불필요 | 200 | 항목별 호출이 필요해 상위 N건만, 병렬+타임아웃 |
| 오늘의 한마디 | ZenQuotes `zenquotes.io/api/today` | 불필요 | 200 | 영어 문구. 출처 표기 의무와 호출 제한이 있음. 한글 소스는 U8에서 재검토 |

한도와 약관은 자주 바뀐다. 각 위젯 단위를 시작할 때 공식 문서로 다시 확인하고 이 표를 갱신한다.

## 5. 구현 단위 로드맵

| 단위 | 내용 | 비고 |
|---|---|---|
| U0 | 요구사항·로드맵 문서 (이 문서) | 문서 단위 |
| U1 | 위젯 결과 타입 + 인터페이스 (REQ-F-001) | 순수 TS |
| U2 | 날씨 `fetch` + `normalize` (REQ-F-002) | `fetch` mock 테스트 |
| U3 | 위젯 병렬 실행 + 부분 실패 집계 (REQ-F-007) | |
| U2b | 도시 검색·검증·도시별 날씨 조회 로직 (REQ-F-002): `searchCities`(주요 도시 우선, 지오코딩), `parseCity`, `createWeatherWidget(city)` | 한글 짧은 이름(서울, 부산)은 지오코딩이 부정확해 주요 8곳 좌표 고정. 완료 |
| U4 | 날씨 카드 UI + 대시보드 골격 (REQ-F-011) | `jsdom`, RTL 도입. 컴포넌트 테스트 파일에만 `@jest-environment jsdom` 독블록 사용(전역 `node` 유지), `jest-dom` 미도입 |
| U4b | 도시 선택 UI + 저장 (REQ-F-002): 검색창, 자주 쓰는 도시, 결과마다 행정구역·나라 표시, 선택한 도시를 쿠키에 저장해 유지, 첫 방문 선택 안내 | 쿠키는 브라우저(`document.cookie`)에서 저장하고 서버는 읽을 때마다 `parseCity`로 검증. 매일 아침 자동 브리핑의 대표 도시는 서버 저장소(U10) 이후 연결. 완료 |
| U5a / U5b | 환율 (a) 로직: `fetch` + 정규화 + zod 검증, 통화 인자(`createExchangeWidget(to)`), `parseCurrency`, `fetch` mock 테스트 (b) 카드 UI: 정상·로딩·오류 렌더 테스트, 통화 선택 상자(Client Component, 이미 받은 환율에서 즉시 전환. 한 번에 조회: U5c), page가 `searchParams.to` → `parseCurrency` → `createExchangeWidget`으로 초기값 연결(`loadDashboardResults`) | U5a·U5b 완료. Frankfurter 확정, 기준 USD 고정, 통화 8개 고정 목록 |
| U6a / U6b | 개발 뉴스 — a 로직 / b 카드 | 항목 병렬 호출 + 타임아웃. U6a·U6b 완료: HN 상위 10건 조회 → 걸러낸 뒤 5건, 링크는 http(s)만(아니면 토론 주소), 카드는 제목을 텍스트로만 렌더하고 링크는 새 탭 + noopener noreferrer |
| ~~U7a / U7b~~ | ~~GitHub 활동~~ — MVP 제외(번호는 유지). 내가 한 일은 내가 이미 알아 아침 브리핑 가치가 낮고, 사용자 이름 입력 UI와 rate limit·토큰 부담이 크다. 알림(리뷰 요청 등)은 비공개 정보라 공개 데모(REQ-F-013)에 부적합 | 후순위 |
| U8a / U8b | 오늘의 한마디 — a 로직 / b 카드 | U8a·U8b 완료: 소스 확정 = ZenQuotes(영어, `/api/today`) + MyMemory 한글 자동 번역(무료·키 없음, 하루 5,000자). 번역 실패 시 영어만(null). 결과는 `use cache`로 저장(명언 hours, 번역 성공 days, 실패 minutes). 카드: 영어 원문(blockquote lang=en)+한글 번역("자동 번역" 표시), 번역이 있을 때만 MyMemory 출처 표기(ZenQuotes는 항상), 번역이 없으면 영어만 + 안내 |
| U9 | 브리핑 생성 Route Handler + 토큰 검증 + 위젯 실행 결과 반환 (저장·전송 제외) | `401` / `200` 테스트. **완료**: `POST /api/cron/brief`, Bearer 상수 시간 비교, 인증 실패 시 외부 API 무호출, 날씨 도시는 환경변수 `BRIEF_CITY`(서버 저장소 U10 전까지 임시) |
| U10 | 스냅샷 저장·조회 (`GET /api/brief`, `GET /api/brief/history`) | **완료**: 저장소 = Upstash Redis(REST, `fetch`만, 의존성 없음). Vercel KV는 종료되어 Upstash로 대체됨. 키 `brief:날짜` + 이력 정렬 집합 `briefs`. 읽은 값은 매번 재검증. **U12 조건**: `save`는 SET 후 ZADD라 원자적이지 않다(멱등) → 저장 실패는 실패로 보고하고 재시도할 것. Upstash 실서비스 호출은 계정 생성 후 U12/U14에서 검증 |
| U11 | Telegram 전송 (단독 함수, fetch mock) | **완료**: `formatBrief`(평문, 4096자 제한), `sendTelegramMessage`(토큰은 URL 경로라 형식 엄격 검사, 실패는 던지지 않고 reason만 반환·토큰/주소/본문 비노출), `sendBriefToTelegram`(`sent`/`failed`). 가짜 토큰으로 실제 Telegram 호출해 오류 응답 형식(401 `{"ok":false,"error_code":401,"description":"Unauthorized"}`) 확인. 실제 전송 성공은 봇 생성 후 검증. **U12 조건**: cron 응답에는 `telegram: "sent"\|"failed"`만 싣고 reason은 싣지 않는다(공개 Actions 로그 가능성), 저장 성공 후 전송, 전송 실패해도 저장 유지 |
| U12 | 브리핑 생성 API에 저장(U10)·전송(U11) 연결 (REQ-F-008 완성) | **완료**: `runBrief`(저장·전송 동시 시작, 서로 막지 않음), 응답 `{date, widgets, snapshot, telegram}`, 둘 다 성공해야 200 아니면 502. `BRIEF_CITY`는 공개 데모가 쓰기를 막아야 해서(REQ-F-013) 소유자 전용 설정으로 유지. 같은 날 재실행 시 중복 전송은 막지 않음. 서버리스 최대 실행 시간(`maxDuration`)은 배포(U14)에서 확인 |
| U13 | 대시보드 마감: 스켈레톤·다크 모드·반응형·이력 목록 조회 연결 | 이력 차트는 제외 (MVP 이후), 차트 라이브러리 설치 금지. **기능 부분 완료**: 오늘 화면에 "지난 브리핑" 목록(최근 14개), `/?date=YYYY-MM-DD`로 저장본을 읽기 전용으로 보기(도시 바꾸기 숨김, 환율 전환은 가능), 날짜는 저장소 접근 전에 엄격 검증하고 잘못된 입력은 화면에 되풀이하지 않음, 화면 전환 시 카드가 새로 만들어지도록 `key`. **디자인 부분(스켈레톤·다크 모드·반응형 다듬기)은 사용자 요청으로 나중에** |
| U14 | GitHub Actions cron + 배포 + 공개 데모 | **코드·문서 부분 완료**: `.github/workflows/morning-brief.yml`(09:30 KST, 수동 실행 가능, 권한 없음, 외부 액션 없음, 재시도 없음, 비밀값은 env로만), 워크플로 파일 안전 규칙 테스트, 배포 절차·점검표(`13_deploy_runbook`). **남은 것은 사용자가 직접**: Vercel/Upstash/Telegram 계정·값 준비, 푸시, 첫 배포 후 점검 |

진행 상태: U0~U12 완료, U13 기능 부분 완료(디자인 보류), U14 코드·문서 완료(실제 배포·계정 준비는 사용자 몫). U7(GitHub 활동)은 MVP 제외.

운영 규칙: 한 번에 한 단위만 만든다. 단위가 끝나면 (1) 테스트 통과 (2) codex-critic 리뷰 반영 (3) 관련 `docs/ai` 갱신 (4) 커밋 순서로 마치고 멈춰 보고한다.

## 6. 미결정 사항

| 항목 | 결정 시점 |
|---|---|
| ~~환율 API 최종 선택~~ → Frankfurter 확정 (U5a, 키·결제 없음. 한국수출입은행은 대안으로만 유지) | 완료 |
| ~~저장소~~ → Upstash Redis로 확정 (U10). 무료 한도·비활성 정책은 계정 생성 시 공식 페이지에서 확인 | 완료 |
| ~~오늘의 한마디 소스~~ → ZenQuotes(영어) + MyMemory 한글 자동 번역으로 확정 (U8a). 번역 품질 향상(AI 번역)은 후순위 | 완료 |
| ~~날씨 지역~~ → 사용자가 처음 고른 도시를 대표로 유지, 자유 검색 지원 (U2b·U4b). 자동 브리핑의 대표 도시 저장은 U10 이후 | U2b·U4b 완료. 자동 브리핑 연결만 U10 이후 |
| LLM 요약 포함 여부 | MVP 이후 |

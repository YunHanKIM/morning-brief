# Morning Brief — 기술 스택

## 현재 설치됨 (package.json 기준)

| 구분 | 값 |
|------|-----|
| 프레임워크 | Next.js 16.4.0 (App Router, `src/` 디렉터리) |
| UI 런타임 | React 19.3.0 |
| 언어 | TypeScript 5 |
| 스타일링 | Tailwind CSS 4 |
| 린트 | ESLint (eslint-config-next) |
| 테스트 | Jest 30 (`next/jest`, `testEnvironment: node`), `@types/jest`, `ts-node` |
| 데이터 검증 | zod 4.6.5 (외부 API 응답, U2에서 도입) |
| 글꼴 | Noto Serif KR(제목·큰 숫자), Noto Sans KR(본문). 둘 다 SIL OFL 1.1이며 `next/font/google`이 빌드 때 내려받아 직접 서빙 |
| 저장소 | Upstash Redis REST (`fetch`, SDK 없음, U10) |
| 알림 | Telegram Bot API (`fetch`, SDK 없음, U11) |
| 스케줄링 | Cloudflare Workers Cron → `/api/cron/brief` (GitHub Actions는 수동 실행용) |

- 테스트는 TDD(Red → Green → Refactor)로 작성한다. 컴포넌트 테스트는 파일 맨 위에 `@jest-environment jsdom`
  독블록을 붙여 `jest-environment-jsdom` + React Testing Library로 실행한다(전역은 `node` 유지: jsdom에 `fetch`가 없어
  위젯 `fetch` 테스트가 깨지기 때문). `@testing-library/jest-dom`은 필요해질 때 추가한다.
- `@/*` import alias를 테스트에서 쓰려면 그때 `jest.config.ts`에 `moduleNameMapper`를 추가한다.

## 계획 (아직 설치하지 않음 — 필요한 단위에서 추가)

| 구분 | 값 |
|------|-----|
| 컴포넌트 | shadcn/ui, lucide-react |
| 차트 | Recharts (이력 차트, MVP 이후) |
| 클라이언트 데이터 패칭 | TanStack Query |
| 배포 | Vercel (확정) |

## 외부 API 후보

| 위젯 | API | 키 |
|---|---|---|
| 날씨 | Open-Meteo | 불필요 |
| 환율 | Frankfurter (ECB 기준, 확정) / 한국수출입은행(대안) | 전자 불필요, 후자 필요 |
| 개발 뉴스 | Hacker News API, 기술 블로그 RSS | 불필요 |
| 오늘의 한마디 | ZenQuotes + MyMemory 한글 번역 (확정) | 불필요 |
| AI 요약(후순위) | Claude API | 필요 |

## 결정 근거

- **Cloudflare Workers Cron을 스케줄러로 쓴다**: Vercel/Netlify 무료 플랜의 cron 제약이 크고 변동이 잦다.
  처음에는 GitHub Actions cron을 썼지만 예약이 몇 시간씩 밀려(2026-10-20: 4시간 38분) 옮겼다. 앱은 그대로 두고 배포 플랫폼에 종속되지 않는다.
  플랜 한도는 공식 문서로 재확인한다.
- **Playwright를 쓰지 않는다**: 서버리스에서 헤드리스 브라우저 실행이 까다롭다. 공개 API 중심으로 설계한다.

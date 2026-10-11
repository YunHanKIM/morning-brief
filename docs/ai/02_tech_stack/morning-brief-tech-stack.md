# Morning Brief — 기술 스택

> 계획 단계의 선택이다. `create-next-app` 실행 후 실제 버전으로 갱신한다.

| 구분 | 값 |
|------|-----|
| 프레임워크 | Next.js (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS + shadcn/ui |
| 아이콘 | lucide-react |
| 차트 | Recharts (이력 차트, MVP 이후) |
| 클라이언트 데이터 패칭 | TanStack Query |
| 데이터 검증 | zod (외부 API 응답, 요청 바디) |
| 알림 | Telegram Bot API (`sendMessage`, SDK 없이 fetch) |
| 스케줄링 | GitHub Actions cron → `/api/cron/brief` |
| 저장소 | 미정 — Supabase(Postgres) 또는 Vercel KV |
| 배포 | Vercel (기본), Netlify (대안) |

## 외부 API 후보

| 위젯 | API | 키 |
|---|---|---|
| 날씨 | Open-Meteo | 불필요 |
| 환율 | 키 없는 무료 API (미정) / 한국수출입은행 | 후자는 필요 |
| 개발 뉴스 | Hacker News API, 기술 블로그 RSS | 불필요 |
| GitHub 활동 | GitHub REST API | 토큰(선택, rate limit 완화) |
| 오늘의 한마디 | 무료 공개 API (미정) | 불필요 |
| AI 요약(후순위) | Claude API | 필요 |

## 결정 근거

- **GitHub Actions를 스케줄러로 쓴다**: Vercel/Netlify 무료 플랜의 cron 제약이 크고 변동이 잦다.
  Actions는 시각 지정이 정확하고 배포 플랫폼에 종속되지 않는다. 플랜 한도는 시작 전에 공식 문서로 재확인한다.
- **Playwright를 쓰지 않는다**: 서버리스에서 헤드리스 브라우저 실행이 까다롭다. 공개 API 중심으로 설계한다.

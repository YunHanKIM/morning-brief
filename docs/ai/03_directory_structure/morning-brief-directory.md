# Morning Brief — 디렉터리 구조

> 2026-10-13 기준 실제 구조(U0~U14). 계획 단계에 적었던 `registry.ts`, `src/lib/`, `src/app/history/`, `src/types/`는 만들지 않았다
> (위젯은 `loadDashboardResults`가 직접 나열하고, 이력은 메인 페이지의 `?date=`로 보여준다).

```
morning-brief/
├── .github/workflows/
│   └── morning-brief.yml        # 매일 09:30 KST 예약 실행 → POST /api/cron/brief (U14)
├── docs/ai/                     # AI 하네스 문서 (요구사항·스택·API 계약·배포 절차 등)
├── src/
│   ├── app/
│   │   ├── page.tsx             # 대시보드 (오늘 실시간 / ?date= 저장본 / 안내)
│   │   └── api/
│   │       ├── cron/brief/      # POST 브리핑 생성·저장·전송 (토큰 필수)
│   │       └── brief/           # GET 저장본 조회, history/ 날짜 목록 (공개 읽기 전용)
│   ├── widgets/                 # 데이터를 가져오는 쪽 (화면과 무관)
│   │   ├── types.ts, runWidget.ts, runWidgets.ts
│   │   ├── weather/             # city.ts(검색·검증·주요 8곳), fetch, normalize, index
│   │   ├── exchange/            # currencies.ts, fetch(8개 통화 일괄), normalize, index
│   │   ├── news/                # fetch(Hacker News), normalize, index
│   │   └── quote/               # zenquotes, translate, cached('use cache'), fetch, normalize, index
│   ├── components/              # 화면 + 화면에 데이터를 넘기는 쪽
│   │   ├── Dashboard, PageShell, WeatherCard, ExchangeCard, NewsCard, QuoteCard
│   │   ├── CityPicker, cityActions('use server'), cityCookie
│   │   ├── HistoryCard, SnapshotBanner
│   │   └── loadDashboardResults, loadPageData, toDashboardResults
│   ├── brief/                   # 자동 브리핑 로직
│   │   ├── auth, briefCity, kstDate, generateBrief, runBrief
│   ├── storage/                 # 스냅샷 저장소 (Upstash Redis REST / 개발용 메모리)
│   │   ├── snapshotStore, snapshotSchema, upstashStore, memoryStore, getSnapshotStore, respond
│   └── notify/                  # Telegram: formatBrief, telegram, sendBrief
├── __tests__/                   # src와 같은 구조의 Jest 테스트 (+ workflow/ 파일 검사)
├── __fixtures__/                # 테스트 공용 데이터·가짜 외부 API (테스트로 오인되지 않게 __tests__ 밖)
├── jest.config.ts, next.config.ts, eslint.config.mjs, tsconfig.json, package.json
└── .env.example                 # 필요한 환경변수 목록
```

## 의존 방향

`app` → `components` / `brief` / `storage` / `notify` → `widgets`. `widgets`는 화면과 저장소를 모른다
(그래서 대시보드와 자동 브리핑 API가 같은 위젯 코드를 쓴다).

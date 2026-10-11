# Morning Brief — 디렉터리 구조

## 현재 구조 (create-next-app + Jest 설정 직후)

```
morning-brief/
├── docs/ai/                # AI 하네스 문서
├── public/
├── src/app/                # layout.tsx, page.tsx, globals.css, favicon.ico (기본 템플릿)
├── __tests__/              # Jest 테스트
├── jest.config.ts
├── next.config.ts
├── eslint.config.mjs
├── tsconfig.json
└── package.json
```

`.github/`, `src/widgets/`, `src/lib/`, `src/components/ui/`, `src/types/`, `src/app/api/`, `src/app/history/`는
아직 없다. 아래는 목표 구조이며 해당 단위를 구현할 때 만든다.

## 목표 구조 (계획안)

```
morning-brief/
├── docs/ai/                    # AI 하네스 문서 (이 폴더)
├── .github/workflows/
│   └── morning-brief.yml       # 매일 07:00 KST cron → /api/cron/brief 호출
├── src/
│   ├── app/
│   │   ├── page.tsx            # 오늘의 브리핑 대시보드
│   │   ├── history/            # 지난 브리핑 이력
│   │   └── api/
│   │       ├── cron/brief/     # 브리핑 생성 (시크릿 토큰 필수)
│   │       └── brief/          # 대시보드용 조회 (읽기 전용)
│   ├── widgets/                # 위젯 플러그인 — 위젯 하나당 폴더 하나
│   │   ├── types.ts            # Widget 인터페이스 (fetch → normalize → render)
│   │   ├── registry.ts         # 등록된 위젯 목록
│   │   └── weather/ ...
│   ├── lib/
│   │   ├── server/             # 서버 전용 (Telegram, 스냅샷 저장, cron 인증)
│   │   └── client/             # 클라이언트 전용 헬퍼
│   ├── components/
│   │   └── ui/                 # shadcn 생성 파일 (직접 수정 금지)
│   └── types/
└── public/
```

## 배치 규약

- 위젯은 `src/widgets/<name>/` 한 폴더에 `fetch.ts`(외부 호출+zod 검증), `normalize.ts`, `Card.tsx`(UI)를 둔다.
- 서버 전용 코드(시크릿 사용)는 `src/lib/server/` 아래에만 둔다. 클라이언트 번들에 들어가면 안 된다.
- 새 위젯 추가 시 `registry.ts`에 한 줄만 추가하면 되도록 유지한다.

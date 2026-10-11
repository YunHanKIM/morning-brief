# Morning Brief — 제출 전 자가검토 체크리스트

- [ ] `npm run build` 통과 (TypeScript 타입 오류·ESLint 오류 없음)
- [ ] 기존 코드 스타일(shadcn/ui 사용법, Tailwind 유틸리티 우선)과 일치하는가
- [ ] 시크릿(Telegram 토큰, cron 토큰, API 키)이 클라이언트 코드·git 이력에 없는가 (`.env*`는 gitignore, `.env.example`만 커밋)
- [ ] 접근성 기본(레이블, 포커스, 대비)이 지켜졌는가
- [ ] 반응형(모바일 뷰포트)과 다크 모드를 확인했는가

## Morning Brief 전용 항목

- [ ] 새 위젯이 `fetch → normalize → render` 구조를 따르고 `registry.ts`에 등록됐는가
- [ ] 외부 API 응답을 zod로 검증하는가, 검증 실패 시 해당 위젯만 오류 상태가 되는가
- [ ] 위젯 로딩·빈 데이터·오류 세 가지 상태가 모두 있는가
- [ ] 외부 호출에 타임아웃이 있는가
- [ ] `/api/cron/*`이 토큰 없이 호출되면 `401`을 반환하는가
- [ ] 위젯 하나를 강제로 실패시켜도 브리핑이 생성되고 Telegram 전송이 되는가
- [ ] 새/변경된 동작을 `docs/ai`의 관련 문서(09, 06 등)에 반영했는가

# Morning Brief — 변경 이력

## [Unreleased]

- 대시보드에서 고른 도시를 서버 저장소(`brief-city`)에 저장하고, 자동 브리핑이 저장된 도시 > `BRIEF_CITY` > 서울 순으로 사용. 공개 데모라 누구나 바꿀 수 있음(의도된 선택)
- 예약 실행을 GitHub Actions cron에서 Cloudflare Workers Cron(`worker/`)으로 이전. 2026-10-20 브리핑이 09:30이 아닌 14:08 KST에 도착했고(GitHub이 예약 런을 4시간 38분 늦게 생성), 이전 cron도 1~3시간씩 밀렸다. 워크플로는 수동 실행 전용(`workflow_dispatch`)으로 축소

- docs/ai 하네스 문서 골격 추가 (코드 없음)

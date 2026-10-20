# Morning Brief — 변경 이력

## [Unreleased]

- 예약 실행을 GitHub Actions cron에서 Cloudflare Workers Cron(`worker/`)으로 이전. 2026-10-20 브리핑이 09:30이 아닌 14:08 KST에 도착했고(GitHub이 예약 런을 4시간 38분 늦게 생성), 이전 cron도 1~3시간씩 밀렸다. 워크플로는 수동 실행 전용(`workflow_dispatch`)으로 축소

- docs/ai 하네스 문서 골격 추가 (코드 없음)

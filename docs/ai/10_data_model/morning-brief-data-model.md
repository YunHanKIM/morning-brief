# Morning Brief — 데이터 모델

저장소는 Upstash Redis(REST)이고, 개발·테스트에서는 `SNAPSHOT_STORE=memory`로 메모리 저장소를 쓴다. 인터페이스는 `src/storage/snapshotStore.ts`.

| 키 | 값 | 비고 |
|----|----|------|
| `brief:YYYY-MM-DD` | 하루치 브리핑(`Brief`) JSON | 같은 날짜는 덮어쓴다 |
| `briefs` | 정렬 집합(점수 = `YYYYMMDD`, 값 = 날짜) | 이력 목록. 최근 날짜부터 조회 |
| `brief-city` | 자동 브리핑 도시(`City`) JSON | 대시보드에서 도시를 고르면 갱신. 읽을 때마다 `parseCity`로 검증 |

`Brief` = `{ date, city, widgets(위젯별 ok/error), results(위젯 결과) }` (`src/brief/generateBrief.ts`).

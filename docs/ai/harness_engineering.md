# Morning Brief — AI 하네스

이 폴더는 AI 워커(frontend-expert 등)가 morning-brief 작업 전 읽는 정본 문서 모음이다.
Morning Brief는 공개 API 데이터를 모아 매일 아침 요약을 대시보드와 Telegram으로 제공하는 포트폴리오 프로젝트다.

> 현재 단계: **MVP 구현·배포 완료**(위젯 4종, 브리핑 생성·저장·Telegram 전송, 대시보드, Cloudflare Cron 예약 실행).
> 아래 "초안" 문서는 확정된 기획(2026-10-11)을 적은 것이며, 문서 안의 "현재"와 "계획" 표기를 구분해 읽는다.
> 구현이 진행되면 실제 코드와 대조해 갱신한다.

| 폴더 | 용도 | 상태 |
|------|------|------|
| `01_project_overview/` | 프로젝트 목적·핵심 흐름·범위 | 초안 |
| `02_tech_stack/` | 언어·프레임워크·버전 | 초안 |
| `03_directory_structure/` | 디렉터리 배치 규약 | 초안(계획) |
| `04_coding_standards/` | 코딩 규칙 | 초안 |
| `05_prompt_templates/` | 반복 작업용 프롬프트 템플릿 | 미정 |
| `06_domain_playbooks/` | 도메인별 작업 규칙 (위젯 플러그인, 알림) | 미정 |
| `06_page_playbooks/` | 화면(페이지)별 작업 규칙 | 미정 |
| `07_review_checklist/` | 제출 전 자가검토 체크리스트 | 초안 |
| `08_domain_glossary/` | 용어 단일 출처 | 초안 |
| `09_api_contract/` | 외부 API 소비 계약 + 내부 cron 엔드포인트 | 초안 |
| `10_data_model/` | 브리핑 스냅샷·위젯 결과 모델 | 작성됨 |
| `11_changelog/` | 변경 이력 | 초안 |
| `12_known_issues/` | 함정·안티패턴 | 미정 |
| `13_deploy_runbook/` | 배포 절차 | 초안 |

> 불일치 발견 시: 실제 코드를 따르고 불일치를 보고한다. 문서를 임의로 고치지 않는다.

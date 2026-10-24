# supabase-expert — build & run

아래는 Supabase CLI 의 일반 형태이며 **설치된 CLI 의 `--help`로 확인한 뒤** 사용한다.
CLI 나 Docker 가 없으면 "미검증"으로 보고한다. 설치 · 연결은 `develop/globalcommerce_develop.md`.

| 목적 | 명령 | 비고 |
|---|---|---|
| 로컬 스택 시작 | `supabase start` | Docker 필요 |
| 마이그레이션 생성 | `supabase migration new <name>` | 새 파일만 추가 |
| 로컬 DB 재현 | `supabase db reset` | 로컬 데이터 초기화 — 로컬 한정 |
| DB 테스트 | `supabase test db` | `supabase/tests/` pgTAP |
| 타입 생성 | `supabase gen types typescript --local > apps/web/types/supabase.ts` | 커밋 대상 (GC-06-002) |
| RLS 회귀 | `pnpm test:rls` | `tests/rls/` (GC-06-003, 스크립트 이름은 GC-06-001 확정) |
| 정적 점검 | `/check db` | RLS 누락 · `true` 정책 · 실수 금액 컬럼 · `search_path` |
| 원격 적용 | `supabase db push` | **원격 변경 — 실행하지 않고 제시만** |

- 원격 프로젝트 연결 · 적용 · 삭제는 사용자 확인 대상이다.
- 키는 `.env*`에만 두고 커밋하지 않는다 (`.env.example`에 이름만).
- 코어 lite 원본을 받아 와야 하면 platform-docs 저장소를 `--add-dir`로 열어 달라고 팀장에게 요청한다 (추정해서 쓰지 않는다).

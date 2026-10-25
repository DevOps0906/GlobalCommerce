# nextjs-expert — build & run

패키지 매니저는 **pnpm**(모노레포 워크스페이스)이다. 명령은 `apps/web/package.json`의 `scripts`가 정본이다.
패키지 이름을 추정하지 않도록 경로 필터(`--filter ./apps/web`)를 쓴다.

| 목적 | 명령 | 비고 |
|---|---|---|
| 의존성 설치 | `pnpm install` (루트) | 잠금 파일이 정본 |
| 개발 서버 | `pnpm --filter ./apps/web dev` | 환경 변수는 `apps/web/.env.local` (커밋 금지) |
| 타입체크 | `pnpm --filter ./apps/web typecheck` 또는 `pnpm --filter ./apps/web exec tsc --noEmit` | 스크립트 없으면 보고 |
| 린트 | `pnpm --filter ./apps/web lint` | |
| 테스트 | `pnpm --filter ./apps/web test` | 없으면 "테스트 없음"으로 보고 |
| 빌드 | `pnpm --filter ./apps/web build` | 산출물(`.next/`) 커밋 금지 |
| 공유 패키지 영향 | `pnpm --filter "./packages/*" typecheck` | `packages/domain`을 바꿨으면 함께 |

- 환경 변수 목록은 `.env.example`이 정본이다. 값은 저장소에 두지 않는다. 브라우저에 필요한 공개 값만 `NEXT_PUBLIC_`.
- 로컬 Supabase · 워커와 함께 띄우는 방법은 `develop/globalcommerce_develop.md`.
- 실행하지 못한 명령은 "미검증"으로 쓰고 통과로 간주하지 않는다.

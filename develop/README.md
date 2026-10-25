# develop — GlobalCommerce 개발서

아마존·국내 위탁 상품을 수집해 AI로 상품명·대표 이미지·상세페이지를 만들고, 쿠팡·스마트스토어 여러 계정에 한 번에 올린 뒤 블로그·숏폼·SNS 홍보까지 자동화하는 구매대행 셀러용 SaaS(화면 표기 NOMAD AI Factory)의 개발 방법을 담은 폴더입니다. "무엇을 만드는가"는 [`products/`](../products/)의 기획서가 정본이고, 이 폴더는 "어떤 순서로, 누가, 어떻게 확인하며 만드는가"를 다룹니다.

| 항목 | 내용 |
|---|---|
| 주 사용자 | 아마존 구매대행·국내 위탁 셀러(쿠팡, 스마트스토어) |
| 코어 앱 id / DB | `globalcommerce` / Supabase 1개 프로젝트, `public` 스키마(코어 lite + 도메인) |
| 개발 작업 수 | 49개(GC-06-001~049, `products/06_AGENT_PLAN.md`), 웨이브 W0~W7 |
| 릴리스 | R1(MVP) = W0~W5, R2 = W6, R3 = W7(`products/00_DECISIONS.md` GC-D-02) |
| 로그인 | Mock(로컬 시드 계정) → G1 → Google·이메일(공개 베타 전) → G2 → 카카오·네이버. 안내서 14장 |
| 결정 정본 | [`products/00_DECISIONS.md`](../products/00_DECISIONS.md). 문서끼리 다르면 이 문서가 이김 |

## 이 폴더의 파일

| 파일 | 내용 |
|---|---|
| [`globalcommerce_develop.md`](globalcommerce_develop.md) | 개발 방법 안내서. 0장부터 순서대로 따라간다 |
| [`MULTI_AGENT.md`](MULTI_AGENT.md) | 팀 운영 규칙(팀장·고문·대리·사원·분야·검증 에이전트, 위임과 리뷰 기준) |
| [`docs/file/_index.md`](docs/file/_index.md) | 산출물 등록부. task의 "참고 문서"는 여기 등록된 ID와 경로만 쓴다 |

## 읽는 순서

| 순서 | 문서 | 왜 |
|---|---|---|
| 1 | `products/00_DECISIONS.md` | 확정 결정, 열린 결정, ID 체계, 작업·웨이브 요약 |
| 2 | `develop/globalcommerce_develop.md` 0~7장 | 준비, 로컬 DB, task 변환, 개발 사이클 |
| 3 | `develop/MULTI_AGENT.md` | 누구에게 무엇을 맡기고 어떤 리뷰를 붙이는가 |
| 4 | `products/06_AGENT_PLAN.md` | 작업별 범위와 수용 기준(task 완료 조건의 원천) |
| 5 | 그 밖의 기획서 | task 파일 "참고 문서"에 적힌 장만 |

## 벤치마크와 다른 점

platform-docs `develop/nomad-commerce/`는 베이스 레포를 복사하고 setup 스크립트로 기획서 묶음을 붙였습니다. GlobalCommerce는 기획서와 코드가 한 저장소에 있으므로 다음이 없습니다.

- setup 스크립트(`setup-*.sh`, `setup-*.ps1`)와 `*-root/` 묶음 폴더
- `build_root.py`로 만드는 산출물 복사본. 등록부가 `products/`, `docs/`, `.claude/`의 실제 파일을 가리킵니다
- `gate.sh`·`scope_check.sh` 승인 게이트와 task 폴더. 진행 기록은 `tasks/README.md` + `tasks/task-###.md` + 커밋입니다(tablet-kiosk-core 방식)

## 시작하기

```bash
claude                 # 저장소 루트에서. 팀장(주 세션) 모델은 .claude/settings.json
/agent-check           # 팀 구성 점검
/next-task 001         # 첫 작업(모노레포·CI). 이후에는 인자 없이 /next-task
/check                 # 변경 후 lint · typecheck · test · supabase test db
```

처음이라면 안내서 0장 "지금 할 일"부터 봅니다. 저장소 전체 규칙은 루트 [`CLAUDE.md`](../CLAUDE.md), 작업 목록은 [`tasks/README.md`](../tasks/README.md)입니다.

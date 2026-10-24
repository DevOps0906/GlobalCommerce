---
name: worker-expert
description: >-
  `services/worker`(Node 22 잡 워커 — 잡 루프 · 디스패처 · 크론) · `packages/{sourcing,markets,render,ai}` 작업 규약.
  잡 핸들러, 멱등 · 재시도 · 크레딧 환불 · 실행 기록 갱신, 외부 API 어댑터(아마존 데이터 · 위탁 엑셀 · 쿠팡 Wing · 네이버 커머스 · OpenAI/Anthropic/fal ·
  수출입은행 환율 · 데이터랩 · YouTube · Instagram · WordPress), Sharp 이미지 합성, Puppeteer HTML → PNG, FFmpeg 숏폼 렌더를 만들거나 고칠 때 반드시 먼저 읽을 것.
  "잡", "워커", "크론", "수집", "업로드", "어댑터", "누끼", "합성", "상세페이지 렌더", "내보내기", "숏폼", "SNS 업로드", "AI 라우터" 요청도 여기서 시작한다.
  DB 스키마 · RLS · RPC 는 supabase-expert, 화면은 nextjs-expert 다.
---

# worker-expert — `services/worker` · `packages/{sourcing,markets,render,ai}` 작업 규약

> **버전 주의**: Node · Sharp · Puppeteer · FFmpeg · 외부 API(마켓 · SNS · AI)는 바뀌기 쉽다. 새 코드를 쓰기 전 `package.json`의 실제 버전,
> 설치된 바이너리(`ffmpeg -version`), 외부 API 공식 문서를 확인한다. 확인하지 못한 API · 필드 · 한도는 "미확인"으로 보고한다.

## 0. 30초 요약

1. 모든 비동기 작업은 코어 `jobs` 큐 → 워커 핸들러. 큐 · `job_type` 이름은 `00_DECISIONS.md` 5.4 가 정본이다.
2. 핸들러는 멱등이다 — 같은 잡을 두 번 실행해도 외부 결과(마켓 상품 · SNS 게시물 · 파일)는 하나다.
3. 재시도는 분류된 오류만: 일시 오류는 백오프 + 지터, 영구 오류는 즉시 실패 + 한 줄 사유. 최종 실패면 선차감 크레딧 환불.
4. 외부 API 는 `packages/*` 어댑터 인터페이스 뒤에서만. 키 · 토큰은 실행 시점에 복호화하고 payload · 로그에 남기지 않는다.
5. 렌더(Sharp · Puppeteer · FFmpeg)는 타임아웃 · 리소스 한도 · 임시 파일 정리가 정상 경로다. 한글은 이미지 모델이 아니라 Sharp 후합성.

## 1. 요청 판별

| 요청 | 먼저 볼 곳 |
|---|---|
| 새 잡 타입 · 핸들러 | `00_DECISIONS.md` 5.4 → `products/04_API.md` 잡 절 → `references/conventions.md` §잡 수명 |
| 아마존 · 엑셀 수집 | GC-F-104 · 105, O-02(수집 방식) → §어댑터 |
| 상품명 · 금지어 | GC-D-08 · GC-D-11 → `packages/compliance` → §AI |
| 누끼 · 대표 이미지 | GC-D-09, `docs/spec/MARKET_IMAGE_SPEC.md` → §렌더 |
| 상세페이지 조립 · 마켓 이미지 | GC-D-10 → §렌더 (R2 18슬롯은 `docs/spec/DETAIL_PAGE_SYSTEM.md`) |
| 마켓 업로드 · 상태 폴링 · 내보내기 | GC-D-03, `docs/spec/MARKET_REGISTER_FORM.md` → §어댑터 · §멱등 |
| 환율 · 트렌드 크론 | GC-D-16 · GC-D-17 → §크론 |
| 워크플로우 실행 엔진 (R2) | GC-D-18 → §잡 수명 |
| 블로그 · 숏폼 · SNS (R2) | GC-D-12 · 13 · 14 → §렌더 · §어댑터 |
| 임베딩 · JSON-LD (R3) | GC-D-15 |
| 실행 · 검증 | `references/conventions.md` §실행 |

## 2. 핵심 규칙

- 폴더 구조 · 모듈 경계는 `develop/globalcommerce_develop.md`를 따른다. 새 최상위 폴더 · 새 패키지를 만들지 않는다 (필요하면 팀장에게 보고).
- 핸들러는 얇게: payload 검증(zod, `packages/domain`) → 자격증명 로드 → 어댑터 호출 → 결과 저장 · 실행 기록 갱신. 마켓 필드 매핑 · HTTP 는 어댑터 안에만.
- 외부 실패는 결과 타입(성공 / 일시 실패 / 영구 실패 + 사유)으로 받아 실행 기록에 "다음 행동" 한 줄로 남긴다 (예외를 삼키지 않는다).
- 외부 URL 요청은 `packages/net`(허용 도메인 · 타임아웃 · 재시도)을 거친다. 허용 도메인 밖은 GC010.
- 금액은 정수(원). 환율 × 원가 같은 계산은 마지막에 한 번만 반올림하고, 계산 규칙은 `packages/domain` 한 곳에 둔다.
- 가짜 어댑터는 개발 · 테스트 전용이고 운영 설정에서 빠져야 한다.

## 3. 제출 전 자가 점검

- [ ] typecheck · lint · test 결과를 보고했는가 (미실행이면 "미검증")
- [ ] 같은 잡 2회 실행 · 워커 중단 후 재시작에서 결과가 하나인가
- [ ] 최종 실패 시 크레딧 환불 · 실패 사유 한 줄이 남는가
- [ ] 키 · 토큰이 payload · 로그 · 오류 메시지에 없는가
- [ ] 렌더 산출물 규격(1080×1080, 1080×1920, 길이)을 확인했는가
- [ ] `references/pitfalls.md` 항목을 다시 훑었는가
- [ ] 근거(task ID · GC-F · GC-D · 외부 문서 링크)를 인용했는가

## 4. 참조 파일

| 파일 | 언제 |
|---|---|
| `references/conventions.md` | 잡 수명 · 멱등 · 재시도 · 어댑터 · 렌더 · 크론 · 실행 명령 |
| `references/pitfalls.md` | 구현 전 · 리뷰 전 체크리스트 |

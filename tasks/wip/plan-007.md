# GC-06-007 워커 런타임 — 구현 계획 (plan-challenger 공격용)
작성 2026-10-25 · worker-expert · 브랜치 dev/w0 · 코드 미작성. 근거: task-007, 06장 GC-06-007 행, products/CLAUDE.md 2~5절,
00장 GC-D-04 · GC-D-26 · 5.4 · 5.5, 02장 4.1~4.4 · 7 · 8절, core_lite.sql 잡 RPC(2114~2400행) · refund_credits(1663행),
gc_domain_r1.sql gc_release_held_jobs(1357행) · gc_record_step_outcome(1401행) · workflow_runs/steps(1063~1141행), @gc/domain jobs · pipelines · errors.

## 0. 코어 RPC 실제 의미 (계획의 전제 — 코드에서 확인함)

| RPC | 실제 동작 | 런타임 영향 |
|---|---|---|
| `claim_jobs(p_queue, p_worker_id, p_limit, p_job_types)` | 큐 1개, `status='queued' and run_after<=now()`, `FOR UPDATE SKIP LOCKED`, `attempts+1`, `locked_by=worker` | 조직 동시성을 모른다. 큐마다 따로 호출 |
| `heartbeat_job(id, worker, progress, msg)` | `running and locked_by=worker`일 때만 true | false = lease 잃음(회수 · 취소) → 즉시 중단 |
| `complete_job` / `fail_job` | lease 불일치면 `JB001` 예외 | lease 잃은 뒤에는 둘 다 부르지 않는다 |
| `fail_job(id, worker, err, retryable, delay)` | `retryable and attempts<max_attempts` → `queued`, `run_after=now()+delay·2^(attempts-1)`. 아니면 `failed` + **`refund_credits(credit_ledger_id, …, 'refund:job:<id>')` 자동 호출** | 환불은 이미 DB 안에서 1회(멱등 키 고정). 지터는 delay 인자로 넣는다 |
| `reap_stale_jobs(stale_s)` | 하트비트 끊긴 running → `fail_job(retryable=true, 60)` | 재시작 복구 경로. 마지막 시도였으면 최종 실패 + 환불 |
| `cancel_job(id)` | `queued`만 취소 + 자동 환불(같은 키) + 감사 | 부모 최종 실패 시 자손(보류 잡) 정리에 사용 |
| `enqueue_job(…, p_idempotency_key)` | 키가 있으면 기존 행 반환(영구 유일) | 크론 중복 방지 수단 |
| `gc_release_held_jobs(p_max)` | `run_after='infinity'` 보류 잡을 조직별 `gc_limit(org,'concurrency')` − 활성(running + 해제된 queued) 만큼, 부모 succeeded 일 때만 `run_after=now()` | 동시성 집행 주체 = DB. 워커는 5초마다 호출만 |
| `gc_record_step_outcome(step, done/failed/skipped, msg)` | 단계 종료 · 뒤 단계 skipped · 실행 집계(멱등) | 실행 기록 헬퍼가 감싼다 |
**결론 1 (환불)**: 런타임은 `refund_credits`를 직접 부르지 않는다. 최종 실패는 반드시 `fail_job`을 거치고 그 안의 자동 환불(키 `refund:job:<id>`)이 "환불 1행"을 보장한다.
직접 부르면 같은 키면 무해, 다른 키면 `CR003` 예외라 이중 호출은 득이 없다. 페르소나 지시("워커가 refund_credits 1회")와 문구가 다르므로 **팀장 확인 필요** — 행위(최종 실패 → 환불 1행)는 같다.
런타임은 `payload.credit_ledger_id`와 `jobs.credit_ledger_id`가 다르면 error 로그만 남긴다(직접 보정 없음).

## 1. 모듈 배치 (`services/worker/src/runtime/`, 공용 인덱스 없음)

| 파일 | 책임 |
|---|---|
| `main.ts` | `startWorker()`: env 로드 → 로거 → 클라이언트 → 로더 → 루프 · 유지 작업 · 크론 시작 → 신호 처리 |
| `worker-id.ts` | `${WORKER_ID}:${hostname}:${pid}:${uuid 8자}` — 프로세스마다 유일(env 기본값 `main`이 레플리카끼리 겹쳐 남의 lease 를 건드리는 사고 차단) |
| `logger.ts` | JSON 한 줄 stdout(`process.stdout.write`), 레벨, `child({jobId, jobType, orgId})`, 키 이름 기반 가림(`key|token|secret|password|authorization|credential|cookie`), 문자열 2KB 절단, payload 통째 기록 금지 |
| `supabase.ts` | service_role 클라이언트(아래 7절) |
| `store.ts` | `JobStore` 인터페이스(아래 9절) + `SupabaseJobStore`(rpc · 테이블 호출만) |
| `rows.ts` | `jobs` · `workflow_runs` · `workflow_run_steps` 행 zod 스키마(경계 검증) |
| `loader.ts` | `src/*/handler.{ts|js}` · `src/*/cron.{ts|js}` 스캔 · 동적 import · 검증 |
| `define.ts` | 핸들러 · 크론 작성자용 `defineHandlers()` · `defineCrons()` 타입 헬퍼와 오류 클래스 |
| `errors.ts` | `RetryableError(reason,{retryAfterMs})`, `PermanentError(reason, code?)`, `CredentialError`(GC009) + `classify(err)` |
| `loop.ts` | claim 루프 · 슬롯 세마포어 · 큐 순회 · 유휴 백오프 · 드레인 |
| `dispatcher.ts` | 잡 1건 실행: payload 검증 → 핸들러 → 하트비트 → 완료/실패 → 최종 실패 후처리 |
| `heartbeat.ts` | 30초 타이머, 진행률 전송, 취소 확인, lease 잃음 → abort |
| `maintenance.ts` | 런타임 내부 주기 작업: 보류 해제 5초 · 회수 60초 · 고아 보류 잡 정리 60초 |
| `cron.ts` | `cron.ts` 스펙 스케줄링 · 슬롯 멱등 enqueue |
| `workflow.ts` | 실행 기록 헬퍼(핸들러가 쓰는 유일한 실행 기록 인터페이스) |
| `*.test.ts`, `__tests__/` | 단위 · PGlite 통합 테스트(소유 경로 안) |
`services/worker/src/index.ts`는 `startWorker()` 호출 3줄로 교체(스텁 주석이 007 교체를 명시. 소유 표에 없어 **팀장 확인 필요**).

## 2. 핸들러 · 크론 자동 로드와 매핑 규칙
- 스캔: `dirname(import.meta.url)/..` 의 1단계 하위 폴더 중 `runtime` 제외, 파일 `handler.<ext>` · `cron.<ext>`. ext 는 런타임 자기 파일 확장자로 결정(dev `tsx` = `.ts`, 빌드 = `.js`). `*.test.*` 무시. 폴더 이름 = 영역(로그용).
- 핸들러 모듈 계약: `export const handlers = defineHandlers({ "title.generate": { handle, timeoutMs?, onFinalFailure? } })`.
  - 키는 `isJobType()` 통과 필수, 큐는 `queueOf()`로 유도(핸들러가 큐를 적지 않는다 → 5.4 외 이름 불가).
  - 같은 `job_type`이 두 영역에 있으면 **기동 실패**. 키가 JobType 이 아니거나 `handlers` export 가 없으면 기동 실패.
  - 폴더 이름과 job_type 접두사 일치는 강제하지 않는다(02장 2절: `ai/`가 `title.*`·`image.*`를 가짐).
- payload: R1 타입은 `jobPayloadSchemas[jobType].safeParse` → 실패면 영구 실패(`잘못된 payload: <경로>` 한 줄, 값은 기록 안 함). 핸들러는 타입이 붙은 payload 를 받는다.
  스키마가 없는 타입(R2 · R3)은 핸들러가 `schema`를 주지 않으면 기동 실패.
- 폴링 큐: R1 잡 타입이 하나라도 있는 큐(`gc.import`, `gc.ai`, `gc.detail`, `gc.upload`, `gc.export`, `gc.cron`). 핸들러가 없는 잡을 claim 하면 **영구 실패**(conventions "조용히 건너뛰지 않는다").
  `WORKER_ROLE=media`(R2)는 `gc.content` + `p_job_types={shorts.render}`만, `main`은 `gc.content`에서 `shorts.render`를 뺀 목록을 `p_job_types`로 준다(R2 때 활성).
  위험: 롤링 배포 중 구버전 레플리카가 새 타입을 영구 실패시킬 수 있음 → **열린 질문 Q6**.

## 3. 루프 · 하트비트 · lease 타이밍 (값은 제안)

| 항목 | 값 | 근거 |
|---|---|---|
| 동시 실행 슬롯 | `WORKER_CONCURRENCY`(env 기본 4) | 프로세스 전체 상한. 조직 상한과 별개 |
| claim | 빈 슬롯 n>0이면 큐를 라운드로빈(시작 큐 회전)하며 `claim_jobs(q, id, n)` | 큐 하나가 독점하지 않게 |
| 유휴 백오프 | 0.5초 → 2배 → 최대 5초, claim 성공 시 0.5초로 | DB 부하(레플리카당 최대 ~12 rpc/s, 유휴 시 ~1.2 rpc/s) |
| 하트비트 | 30초(02장 4.1). 진행률 `<단계>:<done>/<total>`은 다음 하트비트에 실음(즉시 전송은 5초 스로틀) | |
| 하트비트 false | 즉시 abort(사유 `lease_lost`), complete/fail 호출 안 함 | 회수 · 다른 워커가 가져감 |
| 하트비트 rpc 오류 | 연속 실패가 90초 넘으면 abort | 네트워크 단절 시 중복 실행 창 축소 |
| 핸들러 타임아웃 | 핸들러 `timeoutMs`, 기본 10분 | 초과 → abort → 일시 오류 |
| 회수 | 모든 레플리카가 60초마다 `reap_stale_jobs(120)` | **02장 4.4는 600초** — 하트비트 30초의 4배로 낮춤. 문서 변경 필요(`[DECISION]` 후보, Q3) |

## 4. 조직 동시성 (GC-D-04, GC008)
- **집행 주체는 DB**: Route Handler 가 동시성 대상 잡(`title.generate`, `image.cutout`, `image.compose`, `detail.assemble`)을 `run_after='infinity'`로 넣고(202 + GC008),
  워커 `maintenance.ts`가 **5초마다** `gc_release_held_jobs(200)`을 부른다. 여러 레플리카가 동시에 불러도 조직별 advisory lock + `SKIP LOCKED`라 안전.
- 워커는 조직 수를 세지 않는다. 해제된 수만큼만 claim 가능하므로 pro(2)는 레플리카 수와 무관하게 running ≤ 2.
- 재시도 대기(`fail_job` 재큐)와 회수된 잡은 `run_after`가 유한이라 계속 "활성"으로 세져 자리를 지킨다(의도대로).
- 권고(nextjs 쪽 결정): 대상 잡은 **항상 보류로 넣고** 디스패처가 풀게 한다. Route Handler 가 "빈자리면 바로 now()"로 넣으면 그 판단과 디스패처 사이 경합으로 한도를 넘을 수 있다(지연 ≤5초 비용).
- DB 함수에 대해 supabase-expert 에게 넘길 의심점(아래 Q1·Q2): 활성 수가 **앱의 모든 잡**(업로드 · 수집 포함)을 세 AI 잡이 업로드에 막힘 / `gc_limit`이 `-1`(무제한)이면 `v_free<0`이라 영원히 안 풀림.

## 5. 취소 · 재시도 분류 · 최종 실패 후처리
- **취소**: 하트비트마다(그리고 `ctx.throwIfCanceled()` 호출 시) `payload.run_id`의 `workflow_runs.cancel_requested_at`을 읽어, 있으면 `ctx.signal` abort(사유 `canceled`).
  잡은 `fail_job(retryable=false, 'canceled_by_user')` → `failed` + 자동 환불. 실행 중 잡을 `canceled`로 만드는 코어 RPC 가 없어 `failed`로 남는다(Q4). 대기 · 보류 잡 취소는 Route Handler 의 `cancel_job`.
- **분류(`errors.ts classify`)**

| 입력 | 결과 |
|---|---|
| `RetryableError`, HTTP 429 · 5xx 를 담은 어댑터 오류, 타임아웃 abort, Node 시스템 오류 `ECONNRESET`·`ETIMEDOUT`·`ECONNREFUSED`·`EAI_AGAIN`·`UND_ERR_*`, `packages/net` `NET_TIMEOUT` | 일시 → `fail_job(true, delay)` |
| `PermanentError`, `CredentialError`(GC009), zod 오류, `GC010`, 핸들러 없음, payload 실패, 취소 | 영구 → `fail_job(false)` |
| 그 밖의 분류 안 된 예외 | **영구**(사유 "분류되지 않은 오류", 스택은 로그만) — 버그가 재시도를 태우지 않게. 공격 받을 지점(Q7) |
| lease 잃음 | 아무 RPC 도 부르지 않음 |
- **지연 · 지터**: `fail_job`이 `delay·2^(attempts-1)`을 곱하므로 기본 delay 60초(코어 기본)에 ±20% 지터를 곱해 넘긴다. `Retry-After`가 있으면 `ceil(retryAfter / 2^(attempts-1))`(최소 1초)로 역산해 실제 대기가 Retry-After 이상이 되게.
- **재시도 횟수**: 런타임은 정하지 않는다. `jobs.max_attempts`(enqueue 때 Route Handler 가 02장 4.2 값을 넣음)를 따른다. "재시도 3회"가 max_attempts 3인지 4인지 표 해석이 모호 → Q5(도메인 상수 `MAX_ATTEMPTS` 필요, 005 요청).
- **last_error · 단계 사유**: 한 줄, ≤500자, 비밀 가림 적용 후. 스택은 로거로만.
- **최종 실패 후처리**(fail_job 결과 `status='failed'`일 때, 각 단계는 멱등):
  1. 환불: DB 가 이미 처리(1절 결론 1).
  2. 자손 정리: `parent_job_id = 이 잡`인 `queued` 잡을 `cancel_job`(재귀, 깊이 ≤10). 각자 원장으로 환불(02장 4.1 "앞 잡 최종 실패 → 자손 cancel_job").
  3. 실행 기록: `payload.step_id`가 있으면 기본으로 `gc_record_step_outcome(step,'failed',사유)`. 한 단계에 잡이 여러 개(수집 N건 · 업로드 배치)인 핸들러는 `onFinalFailure`로 바꿀 수 있다(GC-F-302 항목 단위 실패). 성공 시 `done` 기록은 핸들러 책임(다중 잡 단계 때문). Q8.
- **고아 보류 잡**: 부모가 `failed`/`canceled`인데 남은 보류 자식(사용자가 대기 중 부모를 취소한 경우 생김)을 60초마다 찾아 `cancel_job`. DB 쪽에서 처리하는 편이 낫다면 supabase 로 이관(Q2).

## 6. 재시작 복구 · 종료 · 크래시
- 재시작: 죽은 프로세스의 running 잡은 하트비트가 멈춘다 → 어느 레플리카든 60초 주기 `reap_stale_jobs(120)` → `queued`(+60초 지연) → 다시 claim, `attempts` 증가, 로그 `잡 재개`(attempts>1이면 dispatcher 가 `resumed=true`로 기록). 최악 복구 시간 ≈ 120+60+60초.
  "같은 worker id 면 기동 즉시 내 잡 회수" 빠른 경로는 레플리카 id 충돌 시 남의 잡을 뺏는 위험 때문에 넣지 않는다.
- SIGTERM/SIGINT: (1) claim · 크론 · 유지 작업 중지 (2) 진행 중 잡을 최대 25초 기다림 (3) 남은 잡 abort(`shutdown`) 후 5초 (4) 여전히 남은 잡은 `attempts<max`면 `fail_job(true, 5)`로 lease 반납, 마지막 시도면 손대지 않고 회수에 맡김 (5) exit 0.
  코어에 "시도 횟수 증가 없이 반납" RPC 가 없어 배포가 시도 1회를 소모한다(Q9). compose `stop_grace_period: 35s` 필요(001 요청). Railway 유예 시간 미확인.
- `unhandledRejection` · `uncaughtException`: fatal 로그 → 드레인 → exit 1(재시작 정책에 맡김). 핸들러 예외는 dispatcher 경계에서 모두 잡는다.

## 7. Supabase 클라이언트
- `@supabase/supabase-js`(버전 고정, lockfile — 정확한 버전 미확인), `createClient(supabaseUrlOf(env), SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false } })`.
- URL: `SUPABASE_URL_INTERNAL`(컨테이너는 `http://host.docker.internal:54321`, `.env.example`에 이미 있음) → 없으면 `NEXT_PUBLIC_SUPABASE_URL`(기존 `supabaseUrlOf`).
- `global.fetch`에 `AbortSignal.timeout(15s)` 래퍼(5절 외부 호출 규칙). Supabase 호출은 `packages/net`을 쓰지 않는다(사설 주소가 정상이므로).
- 서버 전용: 워커 안에만 있고 `packages/*`로 export 하지 않는다. 키는 로그 · 오류에 안 남김(가림 + 클라이언트 오류 메시지만 기록).
- 기동 시 `42501`(키 · 역할 오류)이면 즉시 기동 실패.
- DB 타입: 생성 타입이 `apps/web/types/supabase.ts`에 있어 워커가 import 할 수 없다 → 경계는 `rows.ts` zod 로 검증, 타입 공유 위치는 Q10(002 요청).

## 8. 크론 (`src/<영역>/cron.ts`)
- 계약: `export const crons = defineCrons([{ name, schedule: "30 11 * * 1-5", timezone: "Asia/Seoul", run(ctx) }])`. `ctx.enqueue({ jobType, orgId, payload, item? })`만 허용되는 부수 효과이고,
  런타임이 키 `cron:<name>:<슬롯 ISO(UTC)>[:item]`, 큐 `queueOf(jobType)`, `enqueue_job` 멱등으로 넣는다. 슬롯 = 스케줄 계산상의 예정 시각(실제 now 아님) → 레플리카 간 시계 오차에도 같은 키.
- 모든 레플리카가 같은 크론을 돌려도 `enqueue_job` 키로 잡 1개 = 실행 1번(02장 4.4 마지막 줄). 잡 없는 크론(02장 "마켓 키 점검")은 이 계약으로 못 만든다 → 해당 작업에서 잡 타입 추가 또는 리더 잠금 결정(Q11).
- 스케줄러: `croner`(타임존 지원, 의존성 0 — 버전 · 타임존 옵션 동작 미확인, 구현 전 확인). 기동 시 직전 슬롯이 1시간 안이면 1회 보충 enqueue(멱등이라 안전, 제안).
- 전역 크론(fx · trend)은 `jobs.org_id NOT NULL` 때문에 넣을 조직이 없다 → **시스템 조직**(seed 고정 id + env `SYSTEM_ORG_ID`) 필요(Q12, 002 · 001 요청). 정해지기 전 런타임은 `ctx.enqueue` 시 orgId 를 필수로 받는다.
- 런타임 내부 주기(보류 해제 · 회수 · 고아 정리)는 `cron.ts`가 아니라 `maintenance.ts`의 `setInterval`(모두 DB 쪽 멱등 · 동시 안전). 코어 스케줄(`run_monthly_credit_grants` 등)은 이 작업 범위 밖(결제 작업).

## 9. 실행 기록 헬퍼 (`workflow.ts`) 와 핸들러 컨텍스트
핸들러가 쓰는 유일한 인터페이스(직접 테이블 쓰기 금지 규약):

```ts
interface JobContext<P> {
  job: { id; orgId; jobType; attempts; maxAttempts; parentJobId; createdBy; resumed: boolean };
  payload: P;                 // zod 통과본
  signal: AbortSignal;        // canceled | lease_lost | timeout | shutdown
  log: Logger;                // child(jobId, jobType, orgId)
  db: SupabaseClient;         // 도메인 테이블 읽기/쓰기 (service_role)
  progress(pct: number, message?: string): void;
  throwIfCanceled(): Promise<void>;
  run: RunHandle | null;      // payload.run_id/step_id 가 있을 때
}
interface RunHandle {
  stepStarted(): Promise<void>;                       // steps: pending→running, job_id·started_at (전이 가드 통과 범위)
  setStepOutput(output: Json): Promise<void>;          // 재실행용 입력·출력 참조(GC-F-401)
  setProgress(p: { done; total; unit }): Promise<void>;// workflow_runs.progress_summary
  recordOutcome(o: "done" | "failed" | "skipped", msg?: string): Promise<void>; // gc_record_step_outcome
  isCancelRequested(): Promise<boolean>;
}
createSystemRun(store, { orgId, pipeline: SystemPipelineKey, name, subject, triggerSource: "system" | "schedule", steps?: string[] })
  → { runId, stepIds: Record<stepKey, uuid> }  // kind='system', SYSTEM_PIPELINES 로 position·node_type·label
```

- `createSystemRun`은 워커가 직접 시작하는 실행(크론 등)용. 사용자 행동의 실행 행은 Route Handler · RPC(`gc_create_upload_batch` 등)가 만든다.
  run + steps 두 번 insert 는 비원자 → step insert 실패 시 run 삭제로 보상. 원자 RPC `gc_create_system_run` 이 낫다(Q13). 재시도 시 중복 실행 행 방지는 호출자가 `subject.request_id`로 조회 후 생성.
- `log_tail` 추가는 다중 잡 단계에서 덮어쓰기 경합이 있어 이번에 넣지 않는다(진행 메시지는 `jobs.progress_message`로 Realtime 전달).
- `JobStore`: `rpc(name, args)`, `insert(table, rows)`, `update(table, values, eq)`, `select(table, cols, eq)` — 테이블 이름은 상수 화이트리스트.
  운영은 `SupabaseJobStore`, 통합 테스트는 `PgliteJobStore`(같은 SQL 함수를 `select * from public.claim_jobs($1..)`로 호출). 두 구현의 차이는 rpc 인자 이름 매핑 단위 테스트로 막는다.

## 10. 워크스페이스 TS 패키지 실행 (task-005 [REQUEST] 응답)
**권고: esbuild 번들(다중 엔트리 + 코드 분할), 개발은 지금처럼 tsx.**
- `@gc/domain`은 `exports`가 `.ts` 원본이라 `tsc` 산출물(`node dist`)로는 못 돈다. 선택지: (a) 운영도 `tsx` 로더 (b) 번들.
- (b) 이유: 운영 이미지에 트랜스파일러 · devDependency 없음, 기동 빠름, 결정적 산출물. 자동 로드를 위해 엔트리 = `src/index.ts` + glob `src/*/handler.ts` + `src/*/cron.ts`,
  `outdir=dist` 구조 보존, `format=esm`, `splitting=true`(런타임 모듈 단일 인스턴스 보장), `platform=node`, `target=node22`, 워크스페이스 패키지는 번들에 포함, 네이티브(`sharp`, 이후 `puppeteer`)는 external.
  로더는 dist 에서 `.js`를 같은 규칙으로 스캔 → 생성된 인덱스 파일 없음.
- 타입체크: domain 이 확장자 없는 상대 import(`./credits`)라 워커 `moduleResolution: NodeNext`로는 domain 원본에서 오류 → 워커 tsconfig 를 `module: ESNext, moduleResolution: Bundler`로(001 소유 → 요청).
- 빌드 스크립트 `services/worker/build.mjs` + package.json `build: node build.mjs`(001 소유 → 요청). 의존성 추가 요청 목록은 13절.

## 11. `packages/net` 안전 fetch
- 구성: `package.json`(`@gc/net`, `exports` 는 Node 전용 엔트리 하나. `server-only`는 일반 Node 에서 import 즉시 throw 하므로 쓰지 않고 `node:` 모듈 의존으로 브라우저 번들을 막음 — 02장 "워커 전용 진입점" 쪽), `src/{index,safe-fetch,ip,allowlist,errors}.ts`, `test/`.
- API: `createSafeFetch({ allowHosts, allowHttp?=false, timeoutMs?<=10000, maxBytes?<=2MB, maxRedirects?<=3, deps? })` → `(url, init) => Promise<{ status, headers, body: Buffer, finalUrl }>`.
  상한은 낮추기만 가능(테스트도 하한 방향 오버라이드만). 오류 `SafeFetchError{ code: "GC010" | "NET_TIMEOUT" | "NET_TOO_LARGE" | "NET_REDIRECTS" | "NET_HTTP", reason }` — 허용 밖 도메인 · 차단 IP · 금지 스킴/포트는 모두 GC010(내부 reason 구분).
- 단계(홉마다 반복):
  1. WHATWG `URL` 파싱(10진 · 8진 IP 표기는 파서가 점 표기로 정규화). 스킴 https(옵션 시 http), 포트 기본값만(443/80), userinfo 금지, 호스트 소문자 · 끝점 제거 · punycode 그대로 비교.
  2. 허용 목록: 정확 일치 또는 `.example.com` 형태 명시 접미사만. 목록은 호출자(어댑터)가 준다 — net 패키지는 업무 도메인을 모른다.
  3. IP 리터럴이면 바로 4번. 아니면 `dns.promises.lookup(host, { all: true, verbatim: true })` 결과 **전부** 검사, 하나라도 차단이면 거부.
  4. 차단 범위(`node:net` 파싱 + 자체 CIDR 표): v4 `0/8 10/8 100.64/10 127/8 169.254/16 172.16/12 192.0.0/24 192.0.2/24 192.168/16 198.18/15 198.51.100/24 203.0.113/24 224/4 240/4`,
     v6 `::/128 ::1/128 fc00::/7 fe80::/10 ff00::/8 2001:db8::/32 100::/64`, **IPv4 매핑 `::ffff:0:0/96`·NAT64 `64:ff9b::/96`·6to4 `2002::/16`은 내장 v4 를 꺼내 v4 표로 재검사**.
  5. **IP 고정**: `node:https/http.request`에 `lookup` 옵션으로 검증한 IP 하나만 돌려주는 함수를 넘김 → 소켓은 검증한 주소로만 연결(두 번째 DNS 해석 없음 = 리바인딩 무력화). TLS `servername`·인증서 검증은 원래 호스트 이름.
  6. 리다이렉트: 수동(`301/302/303/307/308`), 최대 3회, `Location`을 현재 URL 기준으로 해석해 1~5를 다시. 다른 origin 이면 `authorization`·`cookie` 헤더 제거. 4번째 → `NET_REDIRECTS`.
  7. 크기: `content-length` > 2MB 면 즉시 거부, 아니면 스트림 누적 바이트가 2MB 넘는 순간 소켓 파괴 → `NET_TOO_LARGE`. `accept-encoding: identity`(압축 폭탄 회피).
  8. 시간: 전체(모든 홉 + 본문) 10초 하나의 `AbortSignal.timeout` → `NET_TIMEOUT`.
- 테스트 가능성: `deps = { resolve, transport }` 주입. 리바인딩 테스트 = 첫 해석 공인 IP · 두 번째 해석 127.0.0.1을 주는 resolver 로, 해석 1회/홉 + transport 가 받은 연결 IP = 검증한 공인 IP 를 assert.
  리다이렉트 · 크기 · 시간 테스트 = 로컬 HTTP 서버 + "어떤 IP 든 127.0.0.1 로 연결" 테스트 transport(검증 로직은 가짜 공인 IP 로 그대로 돈다). 운영 코드에 사설 허용 스위치는 두지 않는다.
- 미확인: 환경 변수 프록시(`HTTPS_PROXY`)는 `node:https`가 무시 — 운영(Railway)에서 프록시 불필요 가정.

## 12. Dockerfile (`services/worker/Dockerfile`, GC-D-26 로컬 · Railway 공용)

```
FROM node:22-bookworm-slim AS base        # 버전 태그 고정(다이제스트 고정은 구현 시 확인)
  corepack enable && corepack prepare pnpm@10.28.0 --activate
FROM base AS build
  COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
  COPY services/worker/package.json services/worker/ ; COPY packages/*/package.json (domain, net)
  RUN pnpm install --frozen-lockfile --filter @gc/worker...
  COPY services/worker packages/domain packages/net
  RUN pnpm --filter @gc/worker build
  RUN pnpm --filter @gc/worker deploy --prod /out   # pnpm 10 은 inject-workspace-packages 또는 --legacy 필요(미확인, 구현 시 확인)
FROM node:22-bookworm-slim AS runtime
  apt: fonts-noto-cjk fontconfig tini ca-certificates (--no-install-recommends, 목록 정리)
  COPY --from=build /out/node_modules ./node_modules ; COPY --from=build services/worker/dist ./dist
  RUN node -e "import('sharp').then(s=>process.exit(s.default.versions.vips?0:1))" && fc-list | grep -qi "Noto Sans CJK KR"
  ENV NODE_ENV=production ; USER node ; ENTRYPOINT ["tini","--"] ; CMD ["node","dist/index.js"]
  HEALTHCHECK: 루프가 15초마다 /tmp/worker-alive 갱신, 60초 넘으면 unhealthy (공개 포트 없음)
```
- 비밀 0: `ARG`/`ENV`에 키 없음, `.env*` 복사 없음(`.dockerignore` 001 이 이미 제외), 런타임 `env_file`로만.
- Sharp 0.34 는 linux glibc 사전 빌드 libvips 를 optional dep 로 받음 → 컨테이너 안에서 설치하므로 플랫폼 일치. 이미지 빌드 시 `sharp` 로드 검사로 확인.
- 글꼴: Debian 패키지는 "Noto Sans **CJK** KR"(이름 다름). 023 이 파일 경로로 지정하거나, 렌더 패키지가 Noto Sans KR 파일을 자산으로 가져오는지 023 과 맞출 것(Q14).
- Chromium(Puppeteer)은 025 가, FFmpeg 는 040 이 1줄 요청으로 추가(06장 2.1). 이번 이미지는 Node 22 · Sharp · 한글 글꼴만.
- 클라우드 환경은 이미지 저장소 차단 → 빌드는 Docker Desktop 에서 대표님 확인(미검증으로 보고).

## 13. 소유 경로 밖 요청 (`[REQUEST]` 초안)
1. `[REQUEST] GC-06-007 services/worker/package.json: deps @gc/domain·@gc/net(workspace:*), @supabase/supabase-js, croner, sharp(0.34.x) / dev esbuild / build "node build.mjs"` → 001(팀장 승인 시 007 수정, task-002 선례)
2. `[REQUEST] GC-06-007 services/worker/tsconfig.json: module ESNext + moduleResolution Bundler` → 001
3. `[REQUEST] GC-06-007 services/worker/build.mjs 신설` · `src/index.ts` 교체 → 팀장
4. `[REQUEST] GC-06-007 docker-compose.yml worker: stop_grace_period 35s, restart unless-stopped` → 001
5. `[REQUEST] GC-06-007 supabase: gc_release_held_jobs 활성 수를 동시성 대상 잡 타입으로 한정, gc_limit -1 처리, 고아 보류 잡 정리, (선택) gc_create_system_run · 실행 중 잡 취소 · 무벌점 lease 반납 함수` → supabase-expert(002)
6. `[REQUEST] GC-06-007 supabase/seed.sql: 시스템 조직 고정 id` + `.env.example`/env.ts `SYSTEM_ORG_ID` → 002 · 001
7. `[REQUEST] GC-06-007 packages/domain: CONCURRENCY_JOB_TYPES, MAX_ATTEMPTS(02장 4.2) 상수` → 005
8. `[REQUEST] GC-06-007 DB 생성 타입을 워커도 쓰는 위치로` → 002
9. `[REQUEST] GC-06-007 scripts/db: PGlite Supabase 스텁 · 마이그레이션 적용 함수를 export`(없으면 테스트 헬퍼에 복제) → 002
10. 02장 4.4 `reap_stale_jobs(600)` → 120초로 문서 수정(`[DECISION]` 필요) → 팀장

## 14. 테스트 전략
- 단위(가짜 store · 가짜 시계 `vi.useFakeTimers`): 로더(중복 · 비 JobType 키 · runtime 제외 · ext 선택), 분류표 전 행, dispatcher(lease 잃음 시 RPC 0회, JB001 처리, 취소 → fail(false), 최종 실패 → 자손 cancel · step failed, **`refund_credits` 직접 호출 0회**),
  루프(동시 실행 ≤ WORKER_CONCURRENCY, 라운드로빈, 백오프, 드레인 순서), 하트비트 30초 · false 시 abort, 크론(두 인스턴스 같은 슬롯 키, `30 11 * * 1-5` KST = 02:30 UTC), 로거 가림, SupabaseJobStore rpc 이름 · `p_*` 인자 매핑.
- 통합(PGlite + `20261025000001` + `20261025000002` + `seed.sql`, gen-types 의 Supabase 스텁 재사용): **가능** — task-002 가 같은 방식으로 smoke 115건 통과. 한계: 단일 연결이라 `SKIP LOCKED`·advisory lock 경합은 재현 불가,
  `now()`가 트랜잭션 시각이라 대기 대신 `run_after`·`heartbeat_at`을 SQL 로 과거로 당겨 시간 경과를 흉내. 다중 레플리카 경합은 Docker Desktop 수동 확인으로 보완.
- `packages/net`: IP 표(경계값 · 매핑 · NAT64 · 6to4 · 10진 표기 호스트), 허용 목록(`https://ok.com@evil.com`, 대소문자, 끝점, 접미사 오매칭 `evilok.com`), 해석 결과 일부 사설 → 거부, 리바인딩, 리다이렉트 3회 통과 · 4회 거부 · 사설/허용 밖으로 리다이렉트 거부, 2MB(content-length · 무길이 스트림), 10초(기본값 assert + 200ms 오버라이드).

## 15. 단계 → 확인 (수용 기준 대응)

| # | 단계 | 확인 | 수용 기준 |
|---|---|---|---|
| 1 | 요청 1~4 승인 · 의존성 설치 | `pnpm install` 성공, lockfile diff | 전제 |
| 2 | logger · errors · rows · store · supabase · worker-id | 단위 테스트(가림, 분류, 매핑) | /check |
| 3 | loader · define | 픽스처 영역 2개로 로드 · 중복 기동 실패 테스트 | 핸들러 · 크론 자동 로드 |
| 4 | dispatcher · heartbeat · loop | 단위 + PGlite: `claim_jobs`·`heartbeat_job`·`complete_job`·`fail_job` 호출과 상태 assert, `grep` 로 5개 RPC 사용 확인 | 코어 RPC 사용 |
| 5 | maintenance(보류 해제 · 회수 · 고아) | PGlite: pro 조직에 `title.generate` 보류 5건 → 틱 → running ≤2 · 나머지 `run_after=infinity` assert, 1건 완료 → 틱 → 1건 추가 | GC-D-04 · GC008 |
| 6 | 재시작 복구 | PGlite: 런타임 A claim → `crash()`(타이머만 멈춤) → `heartbeat_at` 과거로 → 런타임 B 회수 틱 → `run_after` 당김 → B 완료, attempts=2 · `잡 재개` 로그 assert. Docker Desktop: `docker compose kill worker` → `up` → 로그(대표님) | 재시작 후 재개 |
| 7 | 최종 실패 · 환불 | PGlite: `consume_credits` 원장 → max_attempts 3 잡 → 일시 실패 3회 → `status=failed`, `credit_ledger where refund_of=원장` **1행**, 후처리 재실행해도 1행 | 3회 실패 환불 1행 |
| 8 | workflow 헬퍼 | PGlite: `createSystemRun` → runs(kind `system`) 1 · steps N 행, `recordOutcome` 집계 assert | 실행 기록 헬퍼 |
| 9 | cron | 단위: 슬롯 키 · 타임존 · 두 인스턴스 enqueue 1행(PGlite `enqueue_job` 멱등) | 크론 자동 로드 · 중복 없음 |
| 10 | packages/net | `pnpm --filter ./packages/net test`: 사설 IP(169.254.169.254, 10/8, ::1, ::ffff:10.0.0.1) 거부, 리바인딩, 리다이렉트 · 2MB · 10초 | 안전 fetch 3개 행 |
| 11 | Dockerfile | 내용 점검(Node 22 · sharp 로드 검사 · 글꼴 검사 · USER node · 비밀 0) + Docker Desktop `docker compose build worker` · `up worker` 후 `host.docker.internal:54321` 잡 처리 로그(대표님, 클라우드는 미검증) | 이미지 · compose · Railway 공용 |
| 12 | 검증 | `pnpm --filter ./services/worker typecheck/lint/test/build`, `pnpm --filter ./packages/net typecheck/lint/test` 결과 원문 보고 | /check |
| 13 | 리뷰 | review-expert · security-auditor · test-writer 판정을 task 로그에 | 리뷰 기록 |

## 16. 열린 질문 · 가정 (팀장 확인 필요)
- Q1 `gc_release_held_jobs`가 앱 모든 잡을 활성으로 셈 → 업로드 10건 중이면 pro 의 AI 가공이 멈춤. 대상 잡 타입으로 한정할지.
- Q2 `gc_limit=-1`(무제한) 시 해제 안 됨 · 고아 보류 잡 정리를 DB 와 워커 중 어디서. Q3 회수 임계 120초(문서 600초) 승인 여부.
- Q4 실행 중 취소 시 잡 상태 `failed`(+환불) 허용 여부, 단계 `canceled` 기록 경로(RPC 없음).
- Q5 02장 "재시도 N회" ↔ `max_attempts` 해석(N 또는 N+1). 수용 기준은 "3회 실패 → 환불"이라 max_attempts=3 가정.
- Q6 핸들러 없는 잡 = 영구 실패 규칙이 롤링 배포에서 신규 타입을 죽일 위험(대안: `p_job_types`로 로드된 타입만 claim + 미처리 잡 경고 로그).
- Q7 분류 안 된 예외를 영구로 볼지 일시로 볼지(계획은 영구).
- Q8 성공 시 `done` 기록은 핸들러, 최종 실패 시 `failed`는 런타임 기본 — 다중 잡 단계의 집계 규칙(04장 3절과 대조 필요). Q9 종료 · 배포가 시도 1회 소모(무벌점 반납 RPC 부재).
- Q10 DB 생성 타입 공유 위치. Q11 잡 없는 크론의 단일 실행 수단. Q12 전역 크론용 시스템 조직. Q13 `createSystemRun` 원자성. Q14 "Noto Sans KR" vs "Noto Sans CJK KR".
- 가정: `refund_credits` 직접 호출 없이 `fail_job` 자동 환불로 수용 기준 충족 / 코어 lite 는 수정하지 않음 / 외부 API 실호출 없음 / 버전(supabase-js · croner · esbuild · sharp)은 설치 시 2주 이상 된 고정 버전으로 확인.

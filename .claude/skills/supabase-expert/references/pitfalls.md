# supabase-expert — pitfalls (리뷰 1순위 체크리스트)

| # | 함정 | 증상 · 위험 | 확인 방법 |
|---|---|---|---|
| 1 | 테이블에 RLS 미설정 | 공개 키로 전 조직 데이터 접근 | `enable row level security` 유무 (`/check db`) |
| 2 | 정책이 `true`로 열려 있음 | 사실상 무방비 | 정책 using/with check |
| 3 | 조직 · 역할 판정 출처가 사용자 수정 가능 값 | 다른 조직 데이터 접근, 슈퍼 어드민 사칭 | `user_metadata` · 쿠키 사용 여부 |
| 4 | update 정책에 with check 누락 | 행을 다른 조직으로 옮김 | update 정책 |
| 5 | 정책 컬럼 인덱스 없음 | 전 쿼리 지연 | `org_id` 인덱스 |
| 6 | 정책 안에서 같은 테이블을 다시 조회 | 무한 재귀 · 성능 저하 | 정책 하위 쿼리, `security definer` 헬퍼 사용 |
| 7 | 기존 마이그레이션 · 코어 lite 복사본 수정 | 환경 간 스키마 불일치, 코어 정본과 어긋남 | git 이력의 기존 파일 변경 |
| 8 | 금액 · 크레딧 컬럼을 `numeric`/`float`로 | 앱 정수와 불일치 · 오차 | 컬럼 타입 |
| 9 | 크레딧 잔액 확인과 차감을 따로 실행 | 동시 요청으로 이중 사용 · 음수 잔액 | 조건부 갱신 · 행 잠금, 잔액 check 제약 |
| 10 | 실패 잡 환불이 두 번 일어남 | 크레딧 증식 | 환불 원장의 원 차감 참조 고유 제약 |
| 11 | 플랜 한도를 앱에서만 검사 | 요청 위조로 한도 초과 (GC002 · GC003) | 트리거 · RPC 집행 여부 |
| 12 | 잡 claim 경쟁 | 같은 잡 두 워커가 처리 → 중복 등록 · 중복 차감 | `skip locked` · 조건부 갱신 · lease |
| 13 | 웹훅 이벤트 id 고유 제약 누락 | 재전송으로 크레딧 두 번 지급 | `webhook_events` 제약 |
| 14 | `market_listings` (상품, 계정) 고유 제약 누락 | 재전송이 마켓에 중복 등록 | 제약 유무 |
| 15 | 자격증명 평문 컬럼 · 사용자 select 가능 | 마켓 키 · SNS 토큰 유출 | `encrypted_credentials` 정책 · 뷰 |
| 16 | `security definer` 함수에 `search_path` 미고정 · 호출자 확인 없음 | 권한 상승 | 함수 정의 |
| 17 | 공용 테이블(`fx_rates` 등)에 사용자 쓰기 허용 | 환율 조작 → 마진 계산 오염 | insert/update 정책 |
| 18 | Realtime publication 에 불필요한 테이블 · RLS 미적용 확인 | 다른 조직 진행률 노출 | publication 목록 |
| 19 | service role 키 노출 | 전권 노출 | Grep `service_role`, 환경 변수 |
| 20 | 생성 타입을 직접 수정 | 재생성 시 소실 | 타입 파일 diff |
| 21 | 시드에 실데이터 · 키 · 실제 계정 | 정보 유출 | seed 파일 |

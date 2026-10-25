/**
 * @gc/domain — 웹 · 워커가 공유하는 도메인 상수 · 스키마 · 계산(GC-06-005).
 * 서버 비밀 · 외부 호출 · Node 전용 API 를 넣지 않는다(클라이언트 번들에서도 import 가능).
 * 하위 경로(`@gc/domain/nav` 등)로 필요한 모듈만 가져올 수도 있다.
 */
export * from "./plans";
export * from "./credits";
export * from "./margin";
export * from "./markets";
export * from "./jobs";
export * from "./errors";
export * from "./status";
export * from "./pipelines";
export * from "./nav";
export * from "./schemas";

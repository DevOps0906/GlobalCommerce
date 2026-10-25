import { MOBILE_TABS_R1, visibleNav, type Release } from "@gc/domain";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell";

// 현재 릴리스: R1 메뉴만 그린다(R2 · R3 숨김, 00장 5.2절).
const CURRENT_RELEASE: Release = "R1";

export default function AppLayout({ children }: { children: ReactNode }) {
  // 운영자 여부는 서버 `session_context`에서 온다 — 인증(GC-06-006) 연결 전까지 false.
  const groups = visibleNav({ release: CURRENT_RELEASE, isPlatformAdmin: false });
  return (
    <AppShell groups={groups} tabs={MOBILE_TABS_R1}>
      {children}
    </AppShell>
  );
}

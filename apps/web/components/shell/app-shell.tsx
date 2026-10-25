"use client";

import type { MobileTab, NavGroup } from "@gc/domain";
import { useCallback, useState, type ReactNode } from "react";
import { BottomTabs } from "./bottom-tabs";
import { IconRail } from "./icon-rail";
import { MenuDrawer } from "./menu-drawer";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

/**
 * 공용 셸(GC-D-20): 모바일 하단 탭 · 태블릿 아이콘 레일 + 햄버거 · 데스크탑 사이드바.
 * 메뉴는 서버가 `visibleNav`(`@gc/domain`)로 걸러 넘긴다. 이 컴포넌트는 릴리스 · 역할을 판단하지 않는다.
 */
export function AppShell({
  groups,
  tabs,
  creditBalance,
  userName,
  children,
}: {
  groups: readonly NavGroup[];
  tabs: readonly MobileTab[];
  creditBalance?: number;
  userName?: string;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const main = groups.filter((g) => g.section === "main");
  const account = groups.filter((g) => g.section === "account");
  const railItems = main.flatMap((g) => g.items);

  return (
    <div className="flex min-h-dvh">
      <Sidebar main={main} account={account} />
      <IconRail items={railItems} onOpenMenu={openMenu} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar creditBalance={creditBalance} userName={userName} onOpenMenu={openMenu} />
        <main className="min-w-0 flex-1 p-4 pb-[calc(var(--spacing-tabbar)+1rem)] tablet:p-6 tablet:pb-6 desktop:p-8">{children}</main>
      </div>
      <BottomTabs tabs={tabs} onOpenMenu={openMenu} />
      <MenuDrawer open={menuOpen} onClose={closeMenu} groups={groups} />
    </div>
  );
}

"use client";

import type { MobileTab } from "@gc/domain";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/cn";
import { NavIcon } from "./nav-icon";

/** 모바일(~767px) 하단 탭 5개, 높이 56px. `href`가 null 인 탭(더보기)은 전체 메뉴 서랍을 연다. */
export function BottomTabs({ tabs, onOpenMenu }: { tabs: readonly MobileTab[]; onOpenMenu: () => void }) {
  const pathname = usePathname() ?? "";
  const tabClass = "flex min-h-tabbar flex-col items-center justify-center gap-0.5 text-caption font-medium";
  return (
    <nav
      aria-label="하단 탭"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] tablet:hidden"
    >
      {tabs.map((tab) => {
        if (tab.href === null) {
          return (
            <button key={tab.key} type="button" onClick={onOpenMenu} aria-haspopup="dialog" className={cn(tabClass, "text-ink-sub")}>
              <NavIcon name={tab.icon} size={20} />
              {tab.label}
            </button>
          );
        }
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link key={tab.key} href={tab.href} aria-current={active ? "page" : undefined} className={cn(tabClass, active ? "text-accent-strong" : "text-ink-sub")}>
            <NavIcon name={tab.icon} size={20} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

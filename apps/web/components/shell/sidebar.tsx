"use client";

import type { NavGroup } from "@gc/domain";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { cn } from "../../lib/cn";
import { NavList } from "./nav-list";

const COLLAPSED_KEY = "gc.sidebar.collapsed";

/** 데스크탑(1200px~) 사이드바 240px. 접으면 64px 레일. 접기 상태(UI 편의)만 localStorage, 실패하면 펼침. */
export function Sidebar({ main, account }: { main: readonly NavGroup[]; account: readonly NavGroup[] }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      // 저장소를 못 읽으면 펼침 유지
    }
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      // 저장 실패는 무시(이번 방문에서만 유지)
    }
  }

  return (
    <nav
      aria-label="제품 메뉴"
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-line bg-surface px-3 py-4 desktop:flex",
        collapsed ? "w-rail px-2" : "w-sidebar",
      )}
    >
      <div className={cn("flex items-center gap-2.5 pb-3.5", collapsed ? "flex-col" : "px-2")}>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink font-display text-[20px] text-surface">N</span>
        {collapsed ? null : (
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="whitespace-nowrap text-body font-extrabold">NOMAD AI Factory</span>
            <span className="text-caption text-ink-faint">디지털노마드연구소</span>
          </span>
        )}
      </div>
      <NavList groups={main} collapsed={collapsed} />
      <div className="mt-auto flex flex-col gap-0.5 pt-4">
        <NavList groups={account} collapsed={collapsed} />
        <Button variant="ghost" icon={collapsed} className={collapsed ? undefined : "justify-start gap-2.5 px-2.5 text-ink-faint"} onClick={toggle} aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"} aria-expanded={!collapsed}>
          {collapsed ? <ChevronsRight aria-hidden="true" size={18} /> : <ChevronsLeft aria-hidden="true" size={18} />}
          {collapsed ? null : <span>사이드바 접기</span>}
        </Button>
      </div>
    </nav>
  );
}

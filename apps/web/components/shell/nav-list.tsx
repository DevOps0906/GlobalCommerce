"use client";

import { findNavItem, type NavGroup } from "@gc/domain";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/cn";
import { Badge } from "../ui/badge";
import { NavIcon } from "./nav-icon";

export function useActiveNavKey(): string | null {
  const pathname = usePathname();
  return pathname ? (findNavItem(pathname)?.key ?? null) : null;
}

const itemBase = "relative flex min-h-touch items-center gap-2.5 rounded-lg px-2.5 text-body font-medium transition-colors";

/** 라벨이 있는 메뉴 목록(사이드바 · 서랍). 서버에서 이미 걸러 준 groups 만 그린다. */
export function NavList({ groups, collapsed = false, onNavigate }: { groups: readonly NavGroup[]; collapsed?: boolean; onNavigate?: () => void }) {
  const activeKey = useActiveNavKey();
  return (
    <>
      {groups.map((group) => (
        <div key={group.key} className="flex flex-col gap-0.5">
          {group.label && !collapsed ? <p className="mt-3.5 mb-1 px-2.5 text-caption font-bold tracking-wide text-ink-faint">{group.label}</p> : null}
          {group.items.map((item) => {
            const active = item.key === activeKey;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                aria-label={collapsed ? item.label : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  itemBase,
                  collapsed && "justify-center px-0",
                  active ? "bg-accent-tint text-ink shadow-[inset_3px_0_0_var(--color-accent)]" : "text-ink-sub hover:bg-accent-tint hover:text-ink",
                )}
              >
                <NavIcon name={item.icon} />
                {collapsed ? null : <span>{item.label}</span>}
                {item.badge && !collapsed ? <Badge className="ml-auto">{item.badge}</Badge> : null}
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );
}

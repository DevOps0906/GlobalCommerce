"use client";

import type { NavItem } from "@gc/domain";
import Link from "next/link";
import { Button } from "../ui/button";
import { cn } from "../../lib/cn";
import { NavIcon } from "./nav-icon";
import { useActiveNavKey } from "./nav-list";

/** 태블릿(768~1199px) 아이콘 레일 64px + 전체 메뉴 서랍을 여는 햄버거. */
export function IconRail({ items, onOpenMenu }: { items: readonly NavItem[]; onOpenMenu: () => void }) {
  const activeKey = useActiveNavKey();
  return (
    <nav
      aria-label="제품 메뉴"
      className="sticky top-0 hidden h-dvh w-rail shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-line bg-surface py-3.5 tablet:flex desktop:hidden"
    >
      <Button variant="ghost" icon onClick={onOpenMenu} aria-label="전체 메뉴 열기" aria-haspopup="dialog">
        <NavIcon name="menu" size={20} />
      </Button>
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-label={item.label}
            title={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "grid size-touch place-items-center rounded-lg transition-colors",
              active ? "bg-accent-tint text-ink shadow-[inset_3px_0_0_var(--color-accent)]" : "text-ink-sub hover:bg-accent-tint hover:text-ink",
            )}
          >
            <NavIcon name={item.icon} size={20} />
          </Link>
        );
      })}
    </nav>
  );
}

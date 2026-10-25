"use client";

import type { NavGroup } from "@gc/domain";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { NavList } from "./nav-list";

/** 모바일 "더보기" · 태블릿 햄버거가 여는 전체 메뉴 서랍. Esc · 바깥 · 메뉴 선택으로 닫힌다. */
export function MenuDrawer({ open, onClose, groups }: { open: boolean; onClose: () => void; groups: readonly NavGroup[] }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 desktop:hidden">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-ink/40" />
      <div role="dialog" aria-modal="true" aria-label="전체 메뉴" className="absolute inset-y-0 left-0 flex w-sidebar max-w-[85vw] flex-col gap-0.5 overflow-y-auto bg-surface px-3 py-4">
        <div className="flex items-center justify-between pb-2">
          <span className="px-2 text-body font-extrabold">NOMAD AI Factory</span>
          <Button ref={closeRef} variant="ghost" icon onClick={onClose} aria-label="메뉴 닫기">
            <X aria-hidden="true" size={18} />
          </Button>
        </div>
        <NavList groups={groups} onNavigate={onClose} />
      </div>
    </div>
  );
}

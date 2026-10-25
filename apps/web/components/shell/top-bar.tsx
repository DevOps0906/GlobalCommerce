"use client";

import { findNavItem } from "@gc/domain";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { Button } from "../ui/button";
import { NavIcon } from "./nav-icon";

/**
 * 상단 바. 모바일: 햄버거 + 페이지 제목 + 검색, 태블릿: 햄버거는 레일에 있으므로 제목 + 검색,
 * 데스크탑: 검색 입력 모양 버튼. 검색 · 알림 · 크레딧 데이터는 이후 화면 작업에서 연결한다(자리만 둠).
 */
export function TopBar({ creditBalance, userName, onOpenMenu }: { creditBalance?: number; userName?: string; onOpenMenu: () => void }) {
  const pathname = usePathname();
  const title = (pathname ? findNavItem(pathname)?.label : null) ?? "NOMAD AI Factory";
  return (
    <header className="sticky top-0 z-20 flex h-topbar items-center gap-2 border-b border-line bg-surface px-3 tablet:px-6 desktop:px-8">
      <Button variant="ghost" icon onClick={onOpenMenu} aria-label="전체 메뉴 열기" aria-haspopup="dialog" className="tablet:hidden">
        <NavIcon name="menu" size={20} />
      </Button>
      <p className="min-w-0 flex-1 truncate text-section font-extrabold desktop:hidden">{title}</p>
      <button
        type="button"
        aria-label="검색"
        className="hidden h-10 max-w-110 flex-1 items-center gap-2.5 rounded-lg border border-line-strong bg-surface px-3 text-left text-body text-ink-faint desktop:flex"
      >
        <Search aria-hidden="true" size={16} />
        <span className="flex-1">상품, 실행, 설정 검색</span>
        <kbd className="rounded border border-line-strong px-1.5 text-caption text-ink-sub">Ctrl K</kbd>
      </button>
      <span className="hidden desktop:ml-auto desktop:block" />
      <Button variant="ghost" icon aria-label="검색 열기" className="desktop:hidden">
        <Search aria-hidden="true" size={18} />
      </Button>
      {creditBalance === undefined ? null : (
        <Link href="/billing" className="inline-flex min-h-touch items-center gap-1.5 rounded-lg px-2 text-caption font-semibold text-accent-strong hover:bg-accent-tint">
          <span>크레딧</span>
          <span className="num">{creditBalance.toLocaleString("ko-KR")}</span>
        </Link>
      )}
      <Button variant="ghost" icon aria-label="알림">
        <Bell aria-hidden="true" size={18} />
      </Button>
      <span className="hidden items-center gap-2 pr-1 text-body font-semibold desktop:flex">
        <span aria-hidden="true" className="grid size-7.5 place-items-center rounded-full bg-ink text-caption font-bold text-surface">
          {(userName ?? "사용자").slice(0, 2)}
        </span>
        {userName ?? "사용자"}
      </span>
    </header>
  );
}

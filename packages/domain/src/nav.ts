/**
 * 사이드바 · 하단 탭 메뉴 정의(메뉴 배열은 이 파일 한 곳, 06장 1절 "공유 등록 지점 없음").
 *
 * 정본: docs/design/dashboard/Sidebar.dc.html(메뉴 순서 · 그룹 · 라벨), products/00_DECISIONS.md 5.2절(화면 ID · 경로 · 릴리스),
 *       products/03_SCREENS_UX.md GC-DF-08(R1 모바일 하단 탭 홈 · 상품 · 업로드 · 실행 · 더보기, 제안).
 * 규칙: 현재 릴리스보다 뒤의 메뉴는 숨긴다(잠금 배지 아님). 플랜 잠금은 숨기지 않고 화면에서 배지로(products/CLAUDE.md 2절 범위).
 * `adminOnly`는 표시용이다. 실제 접근 판정은 서버(`is_platform_admin`)가 한다.
 * `icon`은 Lucide 아이콘 이름(kebab-case). 디자인 SVG 모양에 가장 가까운 것을 골랐다(제안).
 */
import type { Release } from "./credits";

export type ScreenId = `GC-S-${string}`;

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: string;
  release: Release;
  adminOnly: boolean;
  screenId: ScreenId;
  /** 라벨 옆 보조 배지 문구(예: 슈퍼 어드민 "운영자") */
  badge?: string;
}

export interface NavGroup {
  key: string;
  /** 그룹 제목. null 이면 제목 없이 맨 위(대시보드) */
  label: string | null;
  /** main = 본문 메뉴, account = 사이드바 하단(플랜 카드 아래) */
  section: "main" | "account";
  items: readonly NavItem[];
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    key: "home",
    label: null,
    section: "main",
    items: [{ key: "dashboard", label: "대시보드", href: "/dashboard", icon: "house", release: "R1", adminOnly: false, screenId: "GC-S-01" }],
  },
  {
    key: "products",
    label: "상품",
    section: "main",
    items: [
      { key: "sourcing", label: "소싱·수집", href: "/sourcing", icon: "globe", release: "R1", adminOnly: false, screenId: "GC-S-02" },
      { key: "products", label: "상품 관리", href: "/products", icon: "package", release: "R1", adminOnly: false, screenId: "GC-S-03" },
      { key: "upload", label: "마켓 업로드", href: "/upload", icon: "upload", release: "R1", adminOnly: false, screenId: "GC-S-06" },
    ],
  },
  {
    key: "content",
    label: "콘텐츠",
    section: "main",
    items: [
      { key: "blog", label: "블로그 발행", href: "/content/blog", icon: "file-text", release: "R2", adminOnly: false, screenId: "GC-S-07" },
      { key: "shorts", label: "숏폼 영상", href: "/content/shorts", icon: "smartphone", release: "R2", adminOnly: false, screenId: "GC-S-08" },
      { key: "sns", label: "SNS 배포", href: "/content/sns", icon: "share-2", release: "R2", adminOnly: false, screenId: "GC-S-09" },
    ],
  },
  {
    key: "automation",
    label: "자동화",
    section: "main",
    items: [
      { key: "workflows", label: "워크플로우", href: "/workflows", icon: "workflow", release: "R2", adminOnly: false, screenId: "GC-S-10" },
      { key: "runs", label: "실행 기록", href: "/runs", icon: "activity", release: "R1", adminOnly: false, screenId: "GC-S-11" },
    ],
  },
  {
    key: "insights",
    label: "인사이트",
    section: "main",
    items: [
      { key: "search", label: "상품 검색·GEO", href: "/insights/search", icon: "search", release: "R3", adminOnly: false, screenId: "GC-S-12" },
    ],
  },
  {
    key: "account",
    label: null,
    section: "account",
    items: [
      { key: "settings", label: "설정", href: "/settings/general", icon: "sliders-horizontal", release: "R1", adminOnly: false, screenId: "GC-S-13" },
      { key: "billing", label: "플랜·결제", href: "/billing", icon: "credit-card", release: "R1", adminOnly: false, screenId: "GC-S-14" },
      {
        key: "admin",
        label: "슈퍼 어드민",
        href: "/admin/users",
        icon: "shield-check",
        release: "R1",
        adminOnly: true,
        screenId: "GC-S-15",
        badge: "운영자",
      },
    ],
  },
];

/** 모바일 하단 탭 5개(R1, GC-DF-08 제안). `more` 는 전체 메뉴 시트를 연다. */
export interface MobileTab {
  key: string;
  label: string;
  href: string | null;
  icon: string;
}

export const MOBILE_TABS_R1: readonly MobileTab[] = [
  { key: "dashboard", label: "홈", href: "/dashboard", icon: "house" },
  { key: "products", label: "상품", href: "/products", icon: "package" },
  { key: "upload", label: "업로드", href: "/upload", icon: "upload" },
  { key: "runs", label: "실행", href: "/runs", icon: "activity" },
  { key: "more", label: "더보기", href: null, icon: "menu" },
];

const RELEASE_ORDER: Readonly<Record<Release, number>> = { R1: 1, R2: 2, R3: 3 };

export function isReleased(itemRelease: Release, currentRelease: Release): boolean {
  return RELEASE_ORDER[itemRelease] <= RELEASE_ORDER[currentRelease];
}

/**
 * 보이는 메뉴만 남긴다: 현재 릴리스 이후 메뉴 숨김, 운영자 아니면 adminOnly 숨김, 빈 그룹 제거.
 * isPlatformAdmin 은 서버 `session_context`에서 온 값만 넣는다(쿠키 · 브라우저 저장소 값 금지).
 */
export function visibleNav(opts: { release: Release; isPlatformAdmin: boolean }): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => isReleased(item.release, opts.release) && (!item.adminOnly || opts.isPlatformAdmin)),
  })).filter((group) => group.items.length > 0);
}

/** 경로에 해당하는 메뉴(활성 표시용). 가장 긴 접두사 일치. */
export function findNavItem(pathname: string): NavItem | null {
  let best: NavItem | null = null;
  let bestLength = -1;
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      // 설정(/settings/[section]) · 어드민(/admin/...)은 섹션 전체를 한 메뉴로 본다.
      const base = item.href.startsWith("/settings/") ? "/settings" : item.href.startsWith("/admin/") ? "/admin" : item.href;
      if ((pathname === base || pathname.startsWith(`${base}/`)) && base.length > bestLength) {
        best = item;
        bestLength = base.length;
      }
    }
  }
  return best;
}

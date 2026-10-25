import { describe, expect, it } from "vitest";
import { MOBILE_TABS_R1, NAV_GROUPS, findNavItem, visibleNav } from "../src/nav";
import { readRepoFile } from "./helpers";

const allItems = NAV_GROUPS.flatMap((g) => g.items);

describe("메뉴 순서 · 라벨 = Sidebar.dc.html", () => {
  const html = readRepoFile("docs/design/dashboard/Sidebar.dc.html");
  const fromDesign = [...html.matchAll(/<a href="(\w+)\.dc\.html"(?:(?!<\/a>)[\s\S])*?<span style="position: relative;">([^<]+)<\/span>/g)].map((m) => ({
    file: `${m[1]}.dc.html`,
    label: m[2] as string,
  }));

  it("13개 메뉴, 순서와 라벨이 같다", () => {
    expect(fromDesign.length).toBe(13);
    expect(allItems.map((i) => i.label)).toEqual(fromDesign.map((d) => d.label));
  });

  it("그룹 제목이 디자인에 있다", () => {
    for (const g of NAV_GROUPS) if (g.label) expect(html).toContain(`>${g.label}<`);
  });

  it("경로 · 릴리스 · 화면 ID = 00장 5.2절", () => {
    const decisions = readRepoFile("products/00_DECISIONS.md");
    const rows = [...decisions.matchAll(/^\| (GC-S-\d{2}) \| [^|\n]+ \| ([^|\n]+) \| [^|\n]+ \| ([^|\n]+) \| (R\d) \|$/gm)].map((m) => ({
      id: m[1] as string,
      path: m[2] as string,
      design: m[3] as string,
      release: m[4] as string,
    }));
    for (const item of allItems) {
      const row = rows.find((r) => r.id === item.screenId);
      expect(row, item.key).toBeDefined();
      if (!row) continue;
      expect(row.release).toBe(item.release);
      const routeBase = item.href.replace(/\/(general|users)$/, "");
      expect(row.path).toContain(`\`${routeBase}`);
      // 디자인 파일도 같은 화면
      const designFile = fromDesign[allItems.indexOf(item)]?.file;
      expect(row.design).toContain(designFile ?? "?");
    }
  });

  it("슈퍼 어드민만 adminOnly", () => {
    expect(allItems.filter((i) => i.adminOnly).map((i) => i.key)).toEqual(["admin"]);
  });
});

describe("visibleNav — 릴리스 전 메뉴 숨김, 어드민 판정", () => {
  it("R1 일반 사용자: 콘텐츠 · 인사이트 그룹 없음, 워크플로우 없음, 어드민 없음", () => {
    const groups = visibleNav({ release: "R1", isPlatformAdmin: false });
    expect(groups.map((g) => g.key)).toEqual(["home", "products", "automation", "account"]);
    const keys = groups.flatMap((g) => g.items.map((i) => i.key));
    expect(keys).toEqual(["dashboard", "sourcing", "products", "upload", "runs", "settings", "billing"]);
  });

  it("R1 운영자: 슈퍼 어드민 보임", () => {
    const keys = visibleNav({ release: "R1", isPlatformAdmin: true }).flatMap((g) => g.items.map((i) => i.key));
    expect(keys).toContain("admin");
  });

  it("R2 는 콘텐츠 · 워크플로우, R3 는 검색까지", () => {
    const r2 = visibleNav({ release: "R2", isPlatformAdmin: false }).flatMap((g) => g.items.map((i) => i.key));
    expect(r2).toEqual(expect.arrayContaining(["blog", "shorts", "sns", "workflows"]));
    expect(r2).not.toContain("search");
    const r3 = visibleNav({ release: "R3", isPlatformAdmin: false }).flatMap((g) => g.items.map((i) => i.key));
    expect(r3).toContain("search");
  });

  it("모바일 하단 탭 5개(R1 메뉴만)", () => {
    expect(MOBILE_TABS_R1.map((t) => t.label)).toEqual(["홈", "상품", "업로드", "실행", "더보기"]);
    const r1Hrefs = visibleNav({ release: "R1", isPlatformAdmin: false }).flatMap((g) => g.items.map((i) => i.href));
    for (const t of MOBILE_TABS_R1) if (t.href) expect(r1Hrefs).toContain(t.href);
  });

  it("활성 메뉴 찾기", () => {
    expect(findNavItem("/products/abc/images")?.key).toBe("products");
    expect(findNavItem("/settings/markets")?.key).toBe("settings");
    expect(findNavItem("/admin/users")?.key).toBe("admin");
    expect(findNavItem("/runs/123")?.key).toBe("runs");
    expect(findNavItem("/productsx")).toBeNull();
  });
});

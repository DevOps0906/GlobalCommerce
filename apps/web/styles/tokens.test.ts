import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../..");
const readme = readFileSync(path.join(root, "docs/design/dashboard/README.md"), "utf8");
const tokens = readFileSync(path.join(__dirname, "tokens.css"), "utf8").toLowerCase();

// README "디자인 토큰" 표의 hex 값 전부(색 14개)가 tokens.css 에 있어야 한다.
const section = readme.slice(readme.indexOf("## 디자인 토큰"));
const hexes = [...new Set((section.match(/#[0-9A-Fa-f]{6}/g) ?? []).map((h) => h.toLowerCase()))];

describe("tokens.css", () => {
  it("README 토큰 표의 색 값을 모두 포함한다", () => {
    expect(hexes).toHaveLength(14);
    const missing = hexes.filter((h) => !tokens.includes(h));
    expect(missing).toEqual([]);
  });
  it("README 서체 · 핵심 숫자 크기를 포함한다", () => {
    for (const f of ["noto sans kr", "bebas neue", "jetbrains mono"]) expect(tokens).toContain(f);
    for (const v of ["--text-metric: 44px", "--text-metric: 52px", "--text-metric: 68px"]) expect(tokens).toContain(v);
  });
  it("중단점은 tablet 768 · desktop 1200 두 개만, 다크 정의가 있다", () => {
    expect(tokens).toContain("--breakpoint-tablet: 768px");
    expect(tokens).toContain("--breakpoint-desktop: 1200px");
    expect([...tokens.matchAll(/--breakpoint-(?!\*)[\w-]+:/g)]).toHaveLength(2);
    expect(tokens).toContain('[data-theme="dark"]');
  });
});

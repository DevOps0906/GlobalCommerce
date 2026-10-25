import { MOBILE_TABS_R1, visibleNav } from "@gc/domain";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppShell } from "./app-shell";

const R23_LABELS = ["블로그 발행", "숏폼 영상", "SNS 배포", "워크플로우", "상품 검색·GEO"];

function render(isPlatformAdmin: boolean) {
  const groups = visibleNav({ release: "R1", isPlatformAdmin });
  return renderToStaticMarkup(
    <AppShell groups={groups} tabs={MOBILE_TABS_R1}>
      <p>본문</p>
    </AppShell>,
  );
}

describe("공용 셸 메뉴", () => {
  it("R1 메뉴만 렌더하고 R2 · R3 메뉴는 0개", () => {
    const html = render(false);
    for (const label of R23_LABELS) expect(html).not.toContain(label);
    for (const label of ["대시보드", "소싱·수집", "상품 관리", "마켓 업로드", "실행 기록", "설정", "플랜·결제"]) expect(html).toContain(label);
  });
  it("슈퍼 어드민 메뉴는 운영자일 때만", () => {
    expect(render(false)).not.toContain("슈퍼 어드민");
    expect(render(true)).toContain("슈퍼 어드민");
  });
  it("하단 탭은 5개", () => {
    expect(MOBILE_TABS_R1).toHaveLength(5);
    const html = render(false);
    const nav = html.slice(html.indexOf('aria-label="하단 탭"'));
    expect(nav.slice(0, nav.indexOf("</nav>")).match(/<(a|button) /g)).toHaveLength(5);
  });
});

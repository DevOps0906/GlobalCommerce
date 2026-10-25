import { MOBILE_TABS_R1, visibleNav } from "@gc/domain";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// 프로덕션 빌드에서는 404. 셸 · 토큰 확인용 스모크는 기동 시 ENABLE_DEV_COMPONENTS=1 로만 연다.
export const dynamic = "force-dynamic";

const SWATCHES = [
  ["bg", "bg-bg"],
  ["surface", "bg-surface"],
  ["line", "bg-line"],
  ["line-strong", "bg-line-strong"],
  ["ink", "bg-ink"],
  ["ink-sub", "bg-ink-sub"],
  ["ink-faint", "bg-ink-faint"],
  ["accent", "bg-accent"],
  ["accent-strong", "bg-accent-strong"],
  ["accent-tint", "bg-accent-tint"],
  ["success", "bg-success"],
  ["info", "bg-info"],
  ["danger", "bg-danger"],
  ["warning", "bg-warning"],
] as const;

export default async function DevComponentsPage({ searchParams }: { searchParams: Promise<{ admin?: string }> }) {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEV_COMPONENTS !== "1") notFound();
  const { admin } = await searchParams;
  const groups = visibleNav({ release: "R1", isPlatformAdmin: admin === "1" });

  return (
    <AppShell groups={groups} tabs={MOBILE_TABS_R1} creditBalance={1240} userName="리치노마드">
      <div className="flex flex-col gap-6">
        <h1 data-testid="page-title" className="text-title font-extrabold">
          컴포넌트 · 토큰 확인
        </h1>

        <section className="rounded-xl border border-line bg-surface p-4">
          <h3 className="mb-3 text-section font-bold">핵심 숫자</h3>
          <p data-testid="metric" className="num font-display text-metric text-ink">
            1,240
          </p>
          <p className="text-body text-ink-sub">본문 14px · 표 13px · 보조 12px</p>
          <p className="text-table text-ink-sub">표 본문 13px</p>
        </section>

        <section className="rounded-xl border border-line bg-surface p-4">
          <h3 className="mb-3 text-section font-bold">색 토큰</h3>
          <ul className="grid grid-cols-2 gap-3 tablet:grid-cols-4 desktop:grid-cols-7">
            {SWATCHES.map(([name, cls]) => (
              <li key={name} className="flex flex-col gap-1">
                <span className={`h-10 rounded-lg border border-line ${cls}`} />
                <span className="text-caption text-ink-sub">{name}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-4">
          <Button variant="primary">생성 시작</Button>
          <Button>저장하기</Button>
          <Button variant="ghost">취소하기</Button>
          <Badge tone="success">완료</Badge>
          <Badge tone="info">진행 중</Badge>
          <Badge tone="danger">실패</Badge>
          <Badge tone="warning">확인 필요</Badge>
          <Badge>운영자</Badge>
        </section>
      </div>
    </AppShell>
  );
}

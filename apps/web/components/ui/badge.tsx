import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

// 상태색은 배지 · 진행 표시에만 쓴다. 색만으로 구분하지 않도록 글자(필요하면 아이콘)를 함께 둔다.
const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-semibold", {
  variants: {
    tone: {
      neutral: "border border-line-strong text-ink-sub",
      success: "bg-success/10 text-success",
      info: "bg-info/10 text-info",
      danger: "bg-danger/10 text-danger",
      warning: "bg-warning/10 text-warning",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

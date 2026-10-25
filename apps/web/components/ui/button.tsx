import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, Ref } from "react";
import { cn } from "../../lib/cn";

// 주 버튼은 진한 포인트 토큰(AA). 민트 채움 위에는 흰 글자를 쓰지 않는다.
export const buttonVariants = cva(
  "inline-flex min-h-touch items-center justify-center gap-2 rounded-lg px-4 text-body font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-accent-strong text-on-strong hover:opacity-90",
        secondary: "border border-line-strong bg-surface text-ink hover:bg-accent-tint",
        ghost: "text-ink-sub hover:bg-accent-tint hover:text-ink",
      },
      icon: { true: "min-w-touch px-0", false: "" },
    },
    defaultVariants: { variant: "secondary", icon: false },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { ref?: Ref<HTMLButtonElement> } & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, icon, type = "button", ref, ...props }: ButtonProps) {
  return <button ref={ref} type={type} className={cn(buttonVariants({ variant, icon }), className)} {...props} />;
}

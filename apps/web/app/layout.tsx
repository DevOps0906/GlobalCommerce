import type { Metadata } from "next";
import type { ReactNode } from "react";
// 서체는 @fontsource 패키지로 번들에 포함한다(런타임 외부 CSS 요청 없음). 한글은 unicode-range 조각으로 나뉘어 필요한 것만 받는다.
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/500.css";
import "@fontsource/noto-sans-kr/700.css";
import "@fontsource/noto-sans-kr/800.css";
import "@fontsource/bebas-neue/400.css";
import "@fontsource/jetbrains-mono/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOMAD AI Factory",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

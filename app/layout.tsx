import type { Metadata, Viewport } from "next";
import { Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Threads 留言抽籤 · Comment Flow",
  description: "從 Threads 公開貼文留言中隨機抽出中獎者,token 留存在你的瀏覽器,絕不上傳。",
};

export const viewport: Viewport = {
  themeColor: "#ff6666",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant" className={`${notoSansTC.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

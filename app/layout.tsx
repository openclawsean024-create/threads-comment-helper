import type { Metadata, Viewport } from "next";
import "./globals.css";

// Noto Sans TC via Google Fonts = 10+ woff2 subsets = ~560 KB cold-cache FCP killer.
// Skip the webfont entirely — system fallback stack (PingFang TC on macOS,
// Microsoft JhengHei on Windows, system-ui elsewhere) renders Traditional Chinese
// natively with zero font-network cost. Lighthouse cold-cache mobile Performance
// went from 73 → 99 after this change.
const fontStack = [
  "system-ui",
  "-apple-system",
  "BlinkMacSystemFont",
  '"PingFang TC"',
  '"Microsoft JhengHei"',
  '"Noto Sans TC"',
  '"Heiti TC"',
  "sans-serif",
].join(", ");

export const metadata: Metadata = {
  title: "Threads 留言抽籤 · Comment Flow",
  description: "從 Threads 公開貼文留言中隨機抽出中獎者,token 留存在你的瀏覽器,絕不上傳。",
};

export const viewport: Viewport = {
  themeColor: "#ff6666",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-Hant"
      className="h-full antialiased"
      style={{ ["--font-stack" as string]: fontStack }}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}

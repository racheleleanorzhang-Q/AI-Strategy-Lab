import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Strategy Lab | 策略模拟台",
  description: "基于世界模型的 AI 产品策略模拟台 - 在上线前推演定价、免费额度、模型成本策略",
  openGraph: {
    title: "AI Strategy Lab | 策略模拟台",
    description: "基于世界模型的 AI 产品策略模拟台 - 在上线前推演定价、免费额度、模型成本策略",
    type: "website",
    url: "https://racheleleanorzhang-q.github.io/AI-Strategy-Lab/",
    siteName: "AI Strategy Lab",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Strategy Lab | 策略模拟台",
    description: "基于世界模型的 AI 产品策略模拟台 - 在上线前推演定价、免费额度、模型成本策略",
  },
  alternates: {
    canonical: "https://racheleleanorzhang-q.github.io/AI-Strategy-Lab/",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

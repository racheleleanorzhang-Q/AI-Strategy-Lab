import type { Metadata } from "next";
import PortfolioStrategyDemo from "@/components/portfolio/PortfolioStrategyDemo";

export const metadata: Metadata = {
  title: "产品组合经营策略 | AI Strategy Lab",
  description: "基于家庭 One ID 与用户旅程的产品组合经营策略模拟场景（Mock 演示）",
};

export default function PortfolioStrategyPage() {
  return <PortfolioStrategyDemo />;
}

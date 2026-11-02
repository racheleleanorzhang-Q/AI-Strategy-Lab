import ScenarioGateway from "@/components/ScenarioGateway";
import StrategySimulator from "@/components/StrategySimulator";

export default function Home() {
  return (
    <main>
      <ScenarioGateway />
      <div id="simulator">
        <StrategySimulator />
      </div>
    </main>
  );
}

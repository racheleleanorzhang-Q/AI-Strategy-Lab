"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Brain, Cpu, AlertTriangle, ChevronDown } from "lucide-react";
import type { ApiModelInfo } from "@/lib/engine/apiClient";

const typeIcons: Record<string, React.FC<{ className?: string }>> = {
  "规则引擎": Zap,
  "传统ML": Brain,
  "深度学习": Cpu,
};

interface ModelSelectorProps {
  models: ApiModelInfo[];
  selectedModel: string;
  onSelect: (modelId: string) => void;
  loading?: boolean;
}

export function ModelSelector({
  models,
  selectedModel,
  onSelect,
  loading = false,
}: ModelSelectorProps) {
  const selected = models.find((m) => m.id === selectedModel);

  if (models.length === 0) {
    return (
      <Card className="rounded-[32px] border border-amber-200 bg-amber-50 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            暂无可用模型，请检查后端服务
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-slate-700">选择策略引擎</div>
      <div className="relative">
        <select
          value={selectedModel}
          onChange={(e) => onSelect(e.target.value)}
          disabled={loading}
          className={`w-full appearance-none rounded-2xl border px-4 py-3 pr-10 text-left text-sm transition-all focus:outline-none focus:ring-2 ${
            loading
              ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
              : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 focus:border-indigo-400 focus:ring-indigo-100 cursor-pointer"
          }`}
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.icon} {model.name} · {model.type} · {model.estimated_latency_ms}ms
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </div>
      </div>
      {selected && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <span>{selected.icon}</span>
          <span className="flex-1">{selected.description}</span>
          <span className="shrink-0 text-slate-400">{selected.estimated_latency_ms}ms</span>
        </div>
      )}
    </div>
  );
}

"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Brain, Cpu, AlertTriangle } from "lucide-react";
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
      <div className="text-sm font-medium text-slate-700">选择模拟引擎</div>
      <div className="grid gap-2">
        {models.map((model) => {
          const Icon = typeIcons[model.type] || Zap;
          const isSelected = selectedModel === model.id;
          return (
            <button
              key={model.id}
              onClick={() => onSelect(model.id)}
              disabled={loading}
              className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                isSelected
                  ? "border-indigo-400 bg-indigo-50 shadow-sm ring-1 ring-indigo-200"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              } ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${
                  isSelected ? "bg-indigo-100" : "bg-slate-100"
                }`}
              >
                {model.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      isSelected ? "text-indigo-900" : "text-slate-800"
                    }`}
                  >
                    {model.name}
                  </span>
                  <Badge
                    className={`rounded-lg text-[10px] px-2 py-0 ${
                      model.type === "规则引擎"
                        ? "bg-emerald-100 text-emerald-700"
                        : model.type === "传统ML"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {model.type}
                  </Badge>
                </div>
                <div className="mt-0.5 text-xs text-slate-500 truncate">
                  {model.description}
                </div>
              </div>
              <div className="text-xs text-slate-400 shrink-0">
                {model.estimated_latency_ms}ms
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

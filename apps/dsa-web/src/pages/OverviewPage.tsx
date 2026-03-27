import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { historyApi } from '../api/history';
import type { AnalysisType, HistoryItem } from '../types/analysis';
import { Flame, Landmark, TrendingUp, ArrowRight } from 'lucide-react';
import { getSentimentColor } from '../types/analysis';

const ANALYSIS_ENTRIES: {
  type: AnalysisType;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
  bgHover: string;
}[] = [
  {
    type: 'speculation',
    title: '投机分析',
    subtitle: '事件驱动 · 2周-1月',
    description: '基于催化剂、市场情绪与事件日历的短期博弈分析',
    icon: Flame,
    path: '/speculation',
    color: 'text-orange-500',
    bgHover: 'group-hover:bg-orange-500/10',
  },
  {
    type: 'short_term',
    title: '短期分析',
    subtitle: '趋势交易 · 1天-2周',
    description: '基于均线系统、量价关系与趋势强度的技术面分析',
    icon: TrendingUp,
    path: '/short-term',
    color: 'text-cyan',
    bgHover: 'group-hover:bg-cyan/10',
  },
  {
    type: 'value',
    title: '价值分析',
    subtitle: '巴菲特风格 · 3-10年',
    description: '聚焦估值、护城河、盈利质量与安全边际的长期价值分析',
    icon: Landmark,
    path: '/value',
    color: 'text-emerald-500',
    bgHover: 'group-hover:bg-emerald-500/10',
  },
];

const ANALYSIS_TYPE_LABELS: Record<string, string> = {
  short_term: '短期',
  speculation: '投机',
  value: '价值',
};

const ANALYSIS_TYPE_PATHS: Record<string, string> = {
  short_term: '/short-term',
  speculation: '/speculation',
  value: '/value',
};

interface TypeStats {
  count: number;
  avgSentiment: number | null;
}

const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = '概览 - DSA';
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchRecent = async () => {
      setIsLoading(true);
      try {
        const response = await historyApi.getList({ limit: 20 });
        if (!cancelled) {
          setRecentHistory(response.items);
        }
      } catch {
        // Silently fail — overview is non-critical
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void fetchRecent();
    return () => { cancelled = true; };
  }, []);

  // Compute per-type stats from recent history
  const typeStats = useMemo<Record<string, TypeStats>>(() => {
    const stats: Record<string, { count: number; totalSentiment: number; sentimentCount: number }> = {};
    for (const item of recentHistory) {
      const t = item.analysisType || 'short_term';
      if (!stats[t]) stats[t] = { count: 0, totalSentiment: 0, sentimentCount: 0 };
      stats[t].count++;
      if (item.sentimentScore != null) {
        stats[t].totalSentiment += item.sentimentScore;
        stats[t].sentimentCount++;
      }
    }
    const result: Record<string, TypeStats> = {};
    for (const [key, val] of Object.entries(stats)) {
      result[key] = {
        count: val.count,
        avgSentiment: val.sentimentCount > 0 ? Math.round(val.totalSentiment / val.sentimentCount) : null,
      };
    }
    return result;
  }, [recentHistory]);

  const handleEntryClick = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate],
  );

  const handleHistoryClick = useCallback(
    (item: HistoryItem) => {
      const path = ANALYSIS_TYPE_PATHS[item.analysisType || 'short_term'] || '/short-term';
      navigate(path);
    },
    [navigate],
  );

  return (
    <div className="flex h-[calc(100vh-5rem)] w-full flex-col overflow-y-auto sm:h-[calc(100vh-5.5rem)] lg:h-[calc(100vh-2rem)]">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-8">
        <h1 className="mb-1 text-xl font-bold text-foreground">概览</h1>
        <p className="mb-6 text-sm text-secondary-text">选择分析模式开始，或查看最近分析记录</p>

        {/* Analysis entry cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ANALYSIS_ENTRIES.map(({ type, title, subtitle, description, icon: Icon, path, color, bgHover }) => {
            const stats = typeStats[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleEntryClick(path)}
                className="dashboard-card group flex flex-col items-start gap-3 p-5 text-left transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex w-full items-start justify-between">
                  <div className={`rounded-xl bg-hover p-2.5 ${color} transition-colors ${bgHover}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-secondary-text opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="w-full">
                  <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                  <p className="text-xs text-secondary-text">{subtitle}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-secondary-text/70">{description}</p>
                </div>
                {stats && stats.count > 0 && (
                  <div className="flex w-full items-center gap-3 border-t border-border/50 pt-3 text-xs text-secondary-text">
                    <span>近期 {stats.count} 次分析</span>
                    {stats.avgSentiment != null && (
                      <span className="flex items-center gap-1">
                        平均
                        <span
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                          style={{ backgroundColor: getSentimentColor(stats.avgSentiment) }}
                        >
                          {stats.avgSentiment}
                        </span>
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Recent analysis history */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">最近分析</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan/20 border-t-cyan" />
            </div>
          ) : recentHistory.length === 0 ? (
            <p className="py-8 text-center text-sm text-secondary-text">暂无分析记录</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {recentHistory.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleHistoryClick(item)}
                  className="dashboard-card flex items-center gap-3 p-3 text-left transition-all hover:shadow-md"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {item.stockName || item.stockCode}
                      </span>
                      <span className="flex-shrink-0 rounded-full bg-hover px-1.5 py-0.5 text-[10px] text-secondary-text">
                        {ANALYSIS_TYPE_LABELS[item.analysisType || 'short_term'] || '短期'}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-secondary-text">
                      <span>{item.stockCode}</span>
                      {item.operationAdvice && (
                        <span className="truncate">{item.operationAdvice}</span>
                      )}
                      <span className="ml-auto flex-shrink-0">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {item.sentimentScore != null ? (
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: getSentimentColor(item.sentimentScore) }}
                    >
                      {item.sentimentScore}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;

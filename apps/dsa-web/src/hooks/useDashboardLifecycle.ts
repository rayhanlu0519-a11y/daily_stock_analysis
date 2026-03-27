import { useEffect, useRef } from 'react';
import type { AnalysisType, TaskInfo } from '../types/analysis';
import { useTaskStream } from './useTaskStream';

type UseDashboardLifecycleOptions = {
  loadInitialHistory: () => Promise<void>;
  refreshHistory: (silent?: boolean) => Promise<void>;
  syncTaskCreated: (task: TaskInfo) => void;
  syncTaskUpdated: (task: TaskInfo) => void;
  syncTaskFailed: (task: TaskInfo) => void;
  removeTask: (taskId: string) => void;
  analysisType?: AnalysisType;
  enabled?: boolean;
};

export function useDashboardLifecycle({
  loadInitialHistory,
  refreshHistory,
  syncTaskCreated,
  syncTaskUpdated,
  syncTaskFailed,
  removeTask,
  analysisType,
  enabled = true,
}: UseDashboardLifecycleOptions): void {
  const matchesCurrentType = (task: TaskInfo): boolean => {
    if (!analysisType) return true;
    return !task.analysisType || task.analysisType === analysisType;
  };
  const removalTimeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void loadInitialHistory();
  }, [enabled, loadInitialHistory]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshHistory(true);
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, [enabled, refreshHistory]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshHistory(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, refreshHistory]);

  useEffect(() => {
    return () => {
      removalTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      removalTimeoutsRef.current = [];
    };
  }, []);

  const scheduleTaskRemoval = (taskId: string, delayMs: number) => {
    const timeoutId = window.setTimeout(() => {
      removeTask(taskId);
      removalTimeoutsRef.current = removalTimeoutsRef.current.filter((item) => item !== timeoutId);
    }, delayMs);

    removalTimeoutsRef.current.push(timeoutId);
  };

  useTaskStream({
    onTaskCreated: (task) => {
      if (matchesCurrentType(task)) syncTaskCreated(task);
    },
    onTaskStarted: (task) => {
      if (matchesCurrentType(task)) syncTaskUpdated(task);
    },
    onTaskCompleted: (task) => {
      if (matchesCurrentType(task)) {
        syncTaskUpdated(task);
        void refreshHistory(true);
        scheduleTaskRemoval(task.taskId, 2_000);
      }
    },
    onTaskFailed: (task) => {
      if (matchesCurrentType(task)) {
        syncTaskFailed(task);
        scheduleTaskRemoval(task.taskId, 5_000);
      }
    },
    onError: () => {
      console.warn('SSE connection disconnected, reconnecting...');
    },
    enabled,
  });
}

export default useDashboardLifecycle;

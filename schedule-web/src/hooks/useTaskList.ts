import { useState, useEffect, useCallback } from 'react';
import { taskApi } from '../api/task';
import type { Task } from '../types/task';

interface Filters {
  status?: string;
  priority?: string;
  search?: string;
  page: number;
  pageSize: number;
}

interface UseTaskListReturn {
  tasks: Task[];
  total: number;
  loading: boolean;
  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;
  refresh: () => void;
  updateStatus: (id: number, status: string) => Promise<void>;
  removeTask: (id: number) => Promise<void>;
}

export function useTaskList(): UseTaskListReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFiltersState] = useState<Filters>({
    page: 1, pageSize: 10,
    status: undefined, priority: undefined, search: undefined,
  });

  const setFilters = useCallback((f: Partial<Filters>) => {
    setFiltersState(prev => ({ ...prev, ...f }));
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      let data = await taskApi.list({ status: filters.status, priority: filters.priority }) || [];
      if (filters.search) {
        const keyword = filters.search.toLowerCase();
        data = data.filter(t => t.title.toLowerCase().includes(keyword));
      }
      setTotal(data.length);
      const start = (filters.page - 1) * filters.pageSize;
      setTasks(data.slice(start, start + filters.pageSize));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const updateStatus = async (id: number, status: string) => {
    await taskApi.updateStatus(id, { status });
    fetchTasks();
  };

  const removeTask = async (id: number) => {
    await taskApi.remove(id);
    fetchTasks();
  };

  return { tasks, total, loading, filters, setFilters, refresh: fetchTasks, updateStatus, removeTask };
}

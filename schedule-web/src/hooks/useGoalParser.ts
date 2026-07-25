import { useState, useCallback } from 'react';
import { goalApi } from '../api/goal';
import type { GoalParseVO } from '../types/goal';

interface UseGoalParserReturn {
  loading: boolean;
  parseResult: GoalParseVO | null;
  error: string | null;
  parse: (rawInput: string) => Promise<GoalParseVO | null>;
  reset: () => void;
}

export function useGoalParser(): UseGoalParserReturn {
  const [loading, setLoading] = useState(false);
  const [parseResult, setParseResult] = useState<GoalParseVO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback(async (rawInput: string): Promise<GoalParseVO | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await goalApi.parse({ rawInput });
      setParseResult(res);
      return res;
    } catch {
      setError('解析失败，请重试');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setParseResult(null);
    setError(null);
  }, []);

  return { loading, parseResult, error, parse, reset };
}

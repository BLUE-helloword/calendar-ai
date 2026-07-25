export interface Goal {
  id: number;
  userId: number;
  rawInput: string;
  parsedTarget: string;
  parsedDeadline: string;
  parsedItems: string;
  status: 'PARSING' | 'CLARIFYING' | 'PARSED' | 'CONFIRMED';
  clarifyRound: number;
  partialResult: string;
  conversation: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalParseVO {
  goalId: number;
  status: string;
  parsedTarget: string;
  parsedDeadline: string;
  parsedItems: string;
  confidence: number;
  needsClarification: boolean;
  questions: string[];
  currentRound: number;
}

export interface GoalParseDTO {
  rawInput: string;
}

export interface GoalReplyDTO {
  reply: string;
}

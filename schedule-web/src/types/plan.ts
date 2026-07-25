export interface PlanVO {
  goalId: number;
  parsedTarget: string;
  planItems: PlanItem[];
}

export interface PlanItem {
  title: string;
  startTime: string;
  endTime: string;
  estimatedHours: number;
  priority: string;
  hasConflict: boolean;
  conflictDetail: string;
}

export interface PlanConfirmDTO {
  items: PlanItemInput[];
}

export interface PlanItemInput {
  title: string;
  startTime: string;
  endTime: string;
  priority?: string;
}

// ============================================
// AgentOps Lite - Session Replay Models
// ============================================

export type SessionStatus = 'active' | 'completed' | 'failed' | 'abandoned';
export type SessionStepType = 'system_prompt' | 'user_message' | 'assistant_message' | 'tool_call' | 'tool_result' | 'error' | 'state_change';

export interface Session {
  id: string;
  agentId: string;
  agentName: string;
  agentType: string;
  startTime: Date;
  endTime?: Date;
  status: SessionStatus;
  steps: SessionStep[];
  totalTokens: number;
  totalCost: number;
  model: string;
  metadata: Record<string, unknown>;
}

export interface SessionStep {
  index: number;
  timestamp: Date;
  type: SessionStepType;
  content: string;
  tokenCount: number;
  duration: number;
  stateSnapshot?: StateSnapshot;
  toolCall?: ToolCallDetail;
}

export interface StateSnapshot {
  contextWindowUsed: number;
  contextWindowMax: number;
  memoryItems: string[];
  variables: Record<string, unknown>;
  pendingToolCalls: number;
}

export interface ToolCallDetail {
  toolName: string;
  input: string;
  output?: string;
  success: boolean;
  latency: number;
}

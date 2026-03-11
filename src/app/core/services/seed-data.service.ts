import { Injectable } from '@angular/core';
import {
  Agent, AgentType, AgentStatus, AgentExecution, ExecutionStatus, AgentStep, StepPhase,
  LogEntry, LogLevel, NetworkNode, NetworkConnection, ToolUsage, ToolHeatmapCell,
  ToolDependencyLink, TaskFlow, ThoughtStep, ThoughtType, ThoughtStatus, ToolCall,
} from '../models/agent.model';
import { Alert, AlertRule, AlertType, AlertSeverity } from '../models/alert.model';
import { Session, SessionStep, SessionStepType, StateSnapshot } from '../models/session.model';
import { AuditEvent, AuditEventType, ComplianceFramework, SensitivityLevel } from '../models/audit.model';
import { AuditLogEntry } from '../models/compliance.model';
import { OtelTrace, OtelSpan, SpanKind, SpanStatusCode } from '../models/otel.model';
import {
  TaskOutcome, SLADefinition, GoalTracker, BusinessImpact, SatisfactionScore, QualityRating,
} from '../models/outcome-metrics.model';
import {
  AgentMessage, HandoffEvent, MessageType, CommunicationProtocol, MessageStatus, MessagePriority,
} from '../models/agent-communication.model';
import { HallucinationDetail, HallucinationCategory } from '../models/error-debugger.model';

// ─── Shared constants (consistent IDs across ALL features) ────────────────────
const NOW = Date.now();

const AGENTS = [
  { id: 'agent-001', name: 'Orchestrator', type: 'orchestrator' as AgentType, model: 'gpt-4o' },
  { id: 'agent-002', name: 'Researcher',   type: 'researcher'   as AgentType, model: 'claude-3.5-sonnet' },
  { id: 'agent-003', name: 'Coder',        type: 'coder'        as AgentType, model: 'gpt-4o' },
  { id: 'agent-004', name: 'Writer',       type: 'writer'       as AgentType, model: 'gemini-1.5-pro' },
  { id: 'agent-005', name: 'Analyst',      type: 'analyst'      as AgentType, model: 'gpt-4o-mini' },
  { id: 'agent-006', name: 'Reviewer',     type: 'reviewer'     as AgentType, model: 'claude-3.5-sonnet' },
  { id: 'agent-007', name: 'Planner',      type: 'orchestrator' as AgentType, model: 'gpt-4o' },
  { id: 'agent-008', name: 'Assistant',    type: 'assistant'    as AgentType, model: 'gemini-1.5-flash' },
] as const;

const TOOL_NAMES = [
  'web_search','read_file','write_file','execute_code','fetch_api',
  'database_query','send_email','analyze_sentiment','generate_embedding',
  'translate_text','render_chart','store_memory',
];

const MODELS = ['gpt-4o','gpt-4o-mini','claude-3.5-sonnet','claude-3-haiku','gemini-1.5-pro','gemini-1.5-flash'];

// ─── Helper ───────────────────────────────────────────────────────────────────
function ago(ms: number): Date { return new Date(NOW - ms); }
function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── Service ──────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class SeedDataService {

  // ════════════════════════════════════════════════════════════════════════════
  // NETWORK & AGENTS
  // ════════════════════════════════════════════════════════════════════════════

  getNetworkNodes(): NetworkNode[] {
    return [
      { id: 'orch',       name: 'Orchestrator',  type: 'orchestrator', x: 300, y:  60, status: 'active',     model: 'GPT-4o' },
      { id: 'planner',    name: 'Planner',        type: 'orchestrator', x: 520, y:  80, status: 'processing',  model: 'GPT-4o' },
      { id: 'goal',       name: 'Goal Node',      type: 'goal',         x: 150, y: 150, status: 'active' },
      { id: 'uclam',      name: 'UCLAM-4',        type: 'uclam',        x: 440, y: 200, status: 'processing',  model: 'GPT-4o' },
      { id: 'researcher', name: 'Researcher',     type: 'researcher',   x: 420, y: 320, status: 'active',     model: 'Claude-3.5' },
      { id: 'scorer',     name: 'Scorer',         type: 'scorer',       x: 160, y: 270, status: 'idle',       model: 'Claude-3.5' },
      { id: 'coder',      name: 'Coder',          type: 'coder',        x: 580, y: 320, status: 'active',     model: 'GPT-4o' },
      { id: 'writer',     name: 'Writer',         type: 'writer',       x: 290, y: 400, status: 'idle',       model: 'Gemini-1.5' },
      { id: 'reviewer',   name: 'Reviewer',       type: 'reviewer',     x: 500, y: 420, status: 'idle',       model: 'Claude-3.5' },
    ];
  }

  getNetworkConnections(): NetworkConnection[] {
    return [
      { id: 'c1',  from: 'orch',       to: 'planner',    active: true  },
      { id: 'c2',  from: 'orch',       to: 'goal',       active: true  },
      { id: 'c3',  from: 'planner',    to: 'uclam',      active: true  },
      { id: 'c4',  from: 'goal',       to: 'scorer',     active: true  },
      { id: 'c5',  from: 'uclam',      to: 'researcher', active: true  },
      { id: 'c6',  from: 'uclam',      to: 'coder',      active: true  },
      { id: 'c7',  from: 'scorer',     to: 'writer',     active: false },
      { id: 'c8',  from: 'researcher', to: 'writer',     active: true  },
      { id: 'c9',  from: 'coder',      to: 'reviewer',   active: true  },
      { id: 'c10', from: 'writer',     to: 'reviewer',   active: false },
      { id: 'c11', from: 'goal',       to: 'uclam',      active: false },
      { id: 'c12', from: 'scorer',     to: 'researcher', active: true  },
    ];
  }

  getAgents(): Agent[] {
    return AGENTS.map((a, i) => ({
      id: a.id, name: a.name, type: a.type, model: a.model,
      status: (['active','active','processing','idle','active','idle','processing','idle'] as AgentStatus[])[i],
      tokensUsed: 45000 + i * 12000,
      tokensLimit: 128000,
      costPerHour: [4.20, 2.80, 4.20, 1.15, 0.80, 2.80, 4.20, 0.35][i],
      successRate: [97.4, 94.2, 96.8, 91.3, 98.1, 95.6, 93.7, 99.2][i],
      avgResponseTime: [1840, 2310, 1950, 3120, 870, 2180, 2450, 650][i],
      tasksCompleted: [142, 87, 203, 56, 318, 74, 29, 512][i],
      tasksInQueue: [3, 1, 5, 0, 2, 1, 4, 0][i],
      lastActive: ago(i * 120000 + 30000),
    }));
  }

  getLogs(): LogEntry[] {
    const entries: Array<{ level: LogLevel; agent: number; msg: string; ago: number }> = [
      { level: 'info',    agent: 0, msg: 'Orchestrator started task delegation sequence → Research Pipeline v3', ago: 1800000 },
      { level: 'success', agent: 1, msg: 'web_search completed: "climate policy 2025" → 42 results (latency 312ms)', ago: 1650000 },
      { level: 'info',    agent: 2, msg: 'Code generation initiated for REST API module (TypeScript target)', ago: 1500000 },
      { level: 'warning', agent: 4, msg: 'Token budget at 78% — consider pruning conversation history', ago: 1350000 },
      { level: 'success', agent: 3, msg: 'Draft blog post complete — 1,842 words, readability score 74', ago: 1200000 },
      { level: 'error',   agent: 1, msg: 'fetch_api failed: 429 Too Many Requests (Brave Search API)', ago: 1050000 },
      { level: 'info',    agent: 0, msg: 'Routing task to Coder agent — Planner confidence: 0.91', ago: 900000 },
      { level: 'debug',   agent: 6, msg: 'Workflow checkpoint saved — state snapshot 14/20 steps', ago: 750000 },
      { level: 'success', agent: 5, msg: 'Code review complete: 3 issues found (1 critical, 2 warnings)', ago: 600000 },
      { level: 'warning', agent: 2, msg: 'execute_code sandbox: 438/512 MB memory used', ago: 450000 },
      { level: 'info',    agent: 4, msg: 'Sentiment analysis pipeline processing 12,400 records…', ago: 300000 },
      { level: 'success', agent: 0, msg: 'Task batch completed — 8/8 subtasks succeeded, total cost $0.84', ago: 180000 },
      { level: 'info',    agent: 7, msg: 'Assistant responding to user query (streaming mode active)', ago: 120000 },
      { level: 'debug',   agent: 1, msg: 'Memory consolidation: 24 → 12 items pruned for context efficiency', ago: 60000 },
      { level: 'info',    agent: 0, msg: 'New orchestration cycle starting — queue depth: 5 tasks', ago: 15000 },
    ];
    return entries.map((e, i) => ({
      id: `log-seed-${i + 1}`,
      timestamp: ago(e.ago),
      level: e.level,
      agentId: AGENTS[e.agent].id,
      agentName: AGENTS[e.agent].name,
      message: e.msg,
    }));
  }

  // ════════════════════════════════════════════════════════════════════════════
  // EXECUTIONS
  // ════════════════════════════════════════════════════════════════════════════

  getExecutions(): AgentExecution[] {
    const makeSteps = (count: number, baseAgo: number): AgentStep[] =>
      Array.from({ length: count }, (_, i) => ({
        stepNumber: i + 1,
        phase: (['init','plan','execute','execute','execute','respond'] as StepPhase[])[Math.min(i, 5)],
        action: ['Initialize context','Formulate plan','Execute primary tool','Analyze results','Synthesize output','Generate response'][Math.min(i, 5)],
        description: ['Loading system context and agent memory','Breaking task into sub-goals','Calling external API / running tool','Processing tool results','Combining findings into coherent output','Streaming final response to user'][Math.min(i, 5)],
        duration: 300 + i * 120,
        startTime: ago(baseAgo - i * 500),
        endTime: ago(baseAgo - i * 500 - 300),
        success: i !== 2 || count > 4,
        tokensUsed: 800 + i * 400,
        toolCalls: i === 2 ? [{ id: `tc-${baseAgo}-${i}`, tool: TOOL_NAMES[i % TOOL_NAMES.length], args: '{"query":"sample"}', result: '{"results":[]}', success: true, duration: 280 }] as ToolCall[] : [],
      }));

    return [
      { id:'exec-001', agentId:'agent-002', agentName:'Researcher',   agentType:'researcher',   taskId:'task-001', taskName:'Climate Policy Literature Review',        status:'completed',    priority:'high',     startTime:ago(7200000), endTime:ago(5400000), progress:100, steps:makeSteps(7,7200000), tokensUsed:42180, maxTokens:128000, cost:0.63, model:'claude-3.5-sonnet', tags:['research','climate'] },
      { id:'exec-002', agentId:'agent-003', agentName:'Coder',         agentType:'coder',         taskId:'task-002', taskName:'E-commerce REST API Implementation',      status:'executing',    priority:'critical', startTime:ago(3600000),                          progress:68,  steps:makeSteps(9,3600000), tokensUsed:31240, maxTokens:128000, cost:0.47, model:'gpt-4o',            tags:['coding','api'] },
      { id:'exec-003', agentId:'agent-004', agentName:'Writer',        agentType:'writer',        taskId:'task-003', taskName:'Q3 Financial Report Executive Summary',    status:'completed',    priority:'high',     startTime:ago(5400000), endTime:ago(3600000), progress:100, steps:makeSteps(6,5400000), tokensUsed:18920, maxTokens:128000, cost:0.22, model:'gemini-1.5-pro',    tags:['writing','finance'] },
      { id:'exec-004', agentId:'agent-005', agentName:'Analyst',       agentType:'analyst',       taskId:'task-004', taskName:'Customer Sentiment Analysis — Q4 Survey', status:'executing',    priority:'normal',   startTime:ago(1800000),                          progress:41,  steps:makeSteps(8,1800000), tokensUsed:12840, maxTokens:128000, cost:0.11, model:'gpt-4o-mini',       tags:['analysis'] },
      { id:'exec-005', agentId:'agent-006', agentName:'Reviewer',      agentType:'reviewer',      taskId:'task-005', taskName:'Auth Module Security Review',              status:'planning',     priority:'high',     startTime:ago(900000),                           progress:12,  steps:makeSteps(5,900000),  tokensUsed:4200,  maxTokens:128000, cost:0.06, model:'claude-3.5-sonnet', tags:['review','security'] },
      { id:'exec-006', agentId:'agent-002', agentName:'Researcher',    agentType:'researcher',    taskId:'task-006', taskName:'Market Research: AI Monitoring Tools 2025', status:'queued',       priority:'normal',   startTime:ago(300000),                           progress:0,   steps:[],                   tokensUsed:0,     maxTokens:128000, cost:0,    model:'claude-3.5-sonnet', tags:['research','market'] },
      { id:'exec-007', agentId:'agent-004', agentName:'Writer',        agentType:'writer',        taskId:'task-007', taskName:'Blog Post: ML Trends 2025',                status:'queued',       priority:'low',      startTime:ago(180000),                           progress:0,   steps:[],                   tokensUsed:0,     maxTokens:128000, cost:0,    model:'gemini-1.5-pro',    tags:['writing','blog'] },
      { id:'exec-008', agentId:'agent-003', agentName:'Coder',         agentType:'coder',         taskId:'task-008', taskName:'Payment Gateway Bug Fix',                  status:'failed',       priority:'critical', startTime:ago(9000000), endTime:ago(8100000), progress:35,  steps:makeSteps(4,9000000), tokensUsed:9800,  maxTokens:128000, cost:0.15, model:'gpt-4o',            errorMessage:'Tool execute_code failed: sandbox OOM after 512MB', tags:['coding','bugfix'] },
      { id:'exec-009', agentId:'agent-005', agentName:'Analyst',       agentType:'analyst',       taskId:'task-009', taskName:'Data Pipeline Optimization Analysis',       status:'initializing', priority:'normal',   startTime:ago(120000),                           progress:5,   steps:makeSteps(2,120000),  tokensUsed:1200,  maxTokens:128000, cost:0.01, model:'gpt-4o-mini',       tags:['analysis','pipeline'] },
      { id:'exec-010', agentId:'agent-004', agentName:'Writer',        agentType:'writer',        taskId:'task-010', taskName:'Internal Documentation Update',             status:'cancelled',    priority:'low',      startTime:ago(14400000),endTime:ago(13800000),progress:22, steps:makeSteps(3,14400000),tokensUsed:6200,  maxTokens:128000, cost:0.07, model:'gemini-1.5-pro',    tags:['writing','docs'] },
      { id:'exec-011', agentId:'agent-006', agentName:'Reviewer',      agentType:'reviewer',      taskId:'task-011', taskName:'Frontend Component Code Review',           status:'completed',    priority:'normal',   startTime:ago(10800000),endTime:ago(9000000), progress:100, steps:makeSteps(6,10800000),tokensUsed:22400, maxTokens:128000, cost:0.34, model:'claude-3.5-sonnet', tags:['review','frontend'] },
      { id:'exec-012', agentId:'agent-001', agentName:'Orchestrator',  agentType:'orchestrator',  taskId:'task-012', taskName:'Multi-Agent Research Pipeline Coordination', status:'queued',      priority:'critical', startTime:ago(60000),                            progress:0,   steps:[],                   tokensUsed:0,     maxTokens:128000, cost:0,    model:'gpt-4o',            tags:['orchestration'] },
    ];
  }

  // ════════════════════════════════════════════════════════════════════════════
  // TASK FLOWS
  // ════════════════════════════════════════════════════════════════════════════

  getTaskFlows(): TaskFlow[] {
    const thoughtAction: Record<ThoughtType, string> = {
      reasoning:      'Analytical reasoning',
      tool_call:      'Executing tool',
      observation:    'Processing observation',
      decision:       'Decision point',
      final_response: 'Generating response',
    };
    const makeThoughts = (steps: Array<{ type: ThoughtType; content: string; tool?: string; toolIn?: string; toolOut?: string }>): ThoughtStep[] =>
      steps.map((s, i): ThoughtStep => ({
        stepNumber: i + 1, type: s.type, status: 'completed' as ThoughtStatus,
        reasoning: s.content,
        action: s.tool ? `Execute: ${s.tool}` : thoughtAction[s.type],
        ...(s.tool    ? { toolCalled: s.tool }  : {}),
        ...(s.toolIn  ? { toolArgs: s.toolIn }  : {}),
        ...(s.toolOut ? { result: s.toolOut }   : {}),
        confidence: parseFloat((0.82 + (i % 17) * 0.01).toFixed(2)),
        startTime: ago(3600000 - i * 60000),
        duration: 400 + i * 80,
        tokensUsed: 600 + i * 200,
      }));

    return [
      {
        id:'flow-001', agentId:'agent-002', agentName:'Researcher', agentType:'researcher',
        model:'claude-3.5-sonnet', status:'completed',
        userPrompt:'Summarize the latest academic papers on transformer architecture improvements in 2025.',
        systemContext:'You are a research agent with access to web search and academic databases.',
        thoughts: makeThoughts([
          { type:'reasoning',      content:'I need to search for recent papers on transformer improvements published in 2025. I\'ll use web_search with site:arxiv.org for reliable sources.' },
          { type:'tool_call',      content:'Searching arXiv for transformer architecture papers from 2025', tool:'web_search', toolIn:'{"query":"transformer architecture improvements 2025 site:arxiv.org","limit":10}', toolOut:'{"results":[{"title":"FlashAttention-3","url":"arxiv.org/2501.xxxxx"},{"title":"MoE-LLaMA-4","url":"arxiv.org/2502.xxxxx"}],"count":10}' },
          { type:'observation',    content:'Found 10 results. Top papers: FlashAttention-3 (memory efficiency), MoE-LLaMA-4 (mixture of experts scaling), RoPE-Extended (positional encoding). Will fetch full abstracts.' },
          { type:'tool_call',      content:'Fetching paper details from arXiv', tool:'fetch_api', toolIn:'{"url":"https://arxiv.org/abs/2501.xxxxx"}', toolOut:'{"abstract":"FlashAttention-3 achieves 2.8x speedup on H100 GPUs by exploiting WGMMA instructions..."}' },
          { type:'reasoning',      content:'Synthesizing findings across papers. Common themes: (1) memory efficiency, (2) MoE scaling, (3) longer context windows. FlashAttention-3 is the most impactful.' },
          { type:'decision',       content:'Summary should lead with FlashAttention-3 as the headline innovation, followed by MoE scaling trends and context window extensions. Audience: ML engineers.' },
          { type:'final_response', content:'**2025 Transformer Architecture Highlights**\n\n1. **FlashAttention-3** (Jan 2025) — 2.8× speedup on H100s via WGMMA tensor core exploitation...' },
        ]),
        finalResponse:'**2025 Transformer Architecture Highlights** — FlashAttention-3, MoE scaling, extended context windows up to 2M tokens.',
        totalDuration:14200, totalTokens:8840, totalCost:0.13,
        startTime:ago(7200000), endTime:ago(7200000-14200),
        loopCount:1, maxDepth:3, toolsUsed:['web_search','fetch_api'], tags:['research','ai'],
      },
      {
        id:'flow-002', agentId:'agent-003', agentName:'Coder', agentType:'coder',
        model:'gpt-4o', status:'completed',
        userPrompt:'Implement a rate-limiter middleware for our Express.js API using a sliding window algorithm.',
        systemContext:'You are a senior backend engineer. Output production-ready TypeScript.',
        thoughts: makeThoughts([
          { type:'reasoning',   content:'Sliding window rate limiter requires tracking request timestamps per client. I\'ll use Redis for distributed state and implement the algorithm with sorted sets.' },
          { type:'tool_call',   content:'Looking up Redis sorted set sliding window implementation patterns', tool:'web_search', toolIn:'{"query":"redis sorted set sliding window rate limiter typescript 2024"}', toolOut:'{"results":[{"title":"Redis Rate Limiting Patterns","snippet":"Use ZADD + ZREMRANGEBYSCORE for O(log N) operations"}]}' },
          { type:'observation', content:'Redis ZADD/ZREMRANGEBYSCORE pattern confirmed. Will implement: 1) Remove old timestamps, 2) Count current window, 3) Add new timestamp if allowed.' },
          { type:'tool_call',   content:'Executing code to validate the algorithm', tool:'execute_code', toolIn:'{"code":"const redis = new Redis(); // test sliding window","lang":"typescript"}', toolOut:'{"output":"Tests passed: 3/3 — 100 req/min enforced correctly"}' },
          { type:'decision',    content:'Implementation validated. Will wrap in Express middleware factory pattern with configurable windowMs and max parameters.' },
          { type:'final_response', content:'```typescript\nimport { Redis } from "ioredis";\nexport function slidingWindowLimiter(max: number, windowMs: number) {\n  const redis = new Redis();\n  return async (req, res, next) => {\n    const key = `rl:${req.ip}`;\n    const now = Date.now();\n    // ...implementation\n  };\n}\n```' },
        ]),
        finalResponse:'Sliding window rate limiter implemented with Redis sorted sets — 100 req/min, TypeScript, production-ready.',
        totalDuration:8900, totalTokens:5420, totalCost:0.08,
        startTime:ago(14400000), endTime:ago(14400000-8900),
        loopCount:1, maxDepth:2, toolsUsed:['web_search','execute_code'], tags:['coding','backend'],
      },
      {
        id:'flow-003', agentId:'agent-005', agentName:'Analyst', agentType:'analyst',
        model:'gpt-4o-mini', status:'completed',
        userPrompt:'Analyze NPS survey data from Q4 2024 and identify key drivers of dissatisfaction.',
        thoughts: makeThoughts([
          { type:'reasoning',   content:'NPS analysis requires segmenting detractors (0-6), passives (7-8), and promoters (9-10). I should look for common themes in detractor comments.' },
          { type:'tool_call',   content:'Querying survey database for Q4 2024 NPS responses', tool:'database_query', toolIn:'{"sql":"SELECT score, comment FROM nps_surveys WHERE period=\'Q4-2024\'","limit":5000}', toolOut:'{"rows":4832,"nps_score":34,"detractors":1820,"promoters":2140}' },
          { type:'tool_call',   content:'Running sentiment analysis on detractor comments', tool:'analyze_sentiment', toolIn:'{"texts":["<1820 comments>"],"model":"multilingual"}', toolOut:'{"themes":{"price":0.42,"support":0.31,"features":0.18,"bugs":0.09}}' },
          { type:'observation', content:'Top dissatisfiers: Pricing (42% of detractors), Support responsiveness (31%), Missing features (18%), Bugs (9%). Pricing is the dominant driver.' },
          { type:'decision',    content:'Recommend: (1) Pricing tier review, (2) Support SLA improvement, (3) Feature voting program. Estimate 8–12 point NPS improvement potential.' },
          { type:'final_response', content:'**Q4 2024 NPS Analysis** — Score: 34 (Industry avg: 41)\n\nTop dissatisfaction drivers:\n1. **Pricing** (42%) — "Too expensive for the value"\n2. **Support** (31%) — "Response times exceed 48h"\n\n**Recommendations**: Introduce mid-tier pricing ($49/mo), target <4h first response...' },
        ]),
        finalResponse:'NPS 34 — top drivers: pricing (42%), support (31%). Recommendations delivered with estimated 8–12pt improvement potential.',
        totalDuration:6700, totalTokens:3280, totalCost:0.02,
        startTime:ago(18000000), endTime:ago(18000000-6700),
        loopCount:1, maxDepth:2, toolsUsed:['database_query','analyze_sentiment'], tags:['analysis','nps'],
      },
    ];
  }

  // ════════════════════════════════════════════════════════════════════════════
  // TOOLS
  // ════════════════════════════════════════════════════════════════════════════

  getToolUsage(): ToolUsage[] {
    const tools: Array<{ toolId: string; toolName: string; category: ToolUsage['category']; callCount: number; successRate: number; avgLatency: number; p95Latency: number; costPerCall: number; agentDist: Record<string,number> }> = [
      { toolId:'web_search',         toolName:'Web Search',          category:'api',           callCount:1842, successRate:94.2, avgLatency:312,  p95Latency:820,  costPerCall:0.001, agentDist:{'agent-001':120,'agent-002':980,'agent-003':180,'agent-005':562} },
      { toolId:'read_file',          toolName:'Read File',           category:'storage',       callCount:3210, successRate:99.1, avgLatency:24,   p95Latency:85,   costPerCall:0.0001,agentDist:{'agent-001':80,'agent-002':320,'agent-003':1840,'agent-006':970} },
      { toolId:'write_file',         toolName:'Write File',          category:'storage',       callCount:2180, successRate:98.7, avgLatency:31,   p95Latency:92,   costPerCall:0.0001,agentDist:{'agent-003':1420,'agent-004':640,'agent-006':120} },
      { toolId:'execute_code',       toolName:'Execute Code',        category:'compute',       callCount:984,  successRate:87.4, avgLatency:2840, p95Latency:8200, costPerCall:0.012, agentDist:{'agent-003':820,'agent-005':164} },
      { toolId:'fetch_api',          toolName:'Fetch API',           category:'api',           callCount:2640, successRate:91.8, avgLatency:480,  p95Latency:1420, costPerCall:0.0005,agentDist:{'agent-001':240,'agent-002':840,'agent-003':360,'agent-004':180,'agent-005':1020} },
      { toolId:'database_query',     toolName:'Database Query',      category:'data',          callCount:1560, successRate:96.3, avgLatency:142,  p95Latency:380,  costPerCall:0.002, agentDist:{'agent-001':120,'agent-005':1440} },
      { toolId:'send_email',         toolName:'Send Email',          category:'communication', callCount:312,  successRate:99.7, avgLatency:890,  p95Latency:2100, costPerCall:0.001, agentDist:{'agent-001':312} },
      { toolId:'analyze_sentiment',  toolName:'Analyze Sentiment',   category:'analysis',      callCount:720,  successRate:98.2, avgLatency:540,  p95Latency:1280, costPerCall:0.003, agentDist:{'agent-005':720} },
      { toolId:'generate_embedding', toolName:'Generate Embedding',  category:'compute',       callCount:4820, successRate:99.4, avgLatency:88,   p95Latency:210,  costPerCall:0.0001,agentDist:{'agent-001':240,'agent-002':2180,'agent-005':2400} },
      { toolId:'translate_text',     toolName:'Translate Text',      category:'analysis',      callCount:480,  successRate:97.5, avgLatency:320,  p95Latency:740,  costPerCall:0.002, agentDist:{'agent-004':480} },
      { toolId:'render_chart',       toolName:'Render Chart',        category:'analysis',      callCount:168,  successRate:95.8, avgLatency:1240, p95Latency:2800, costPerCall:0.005, agentDist:{'agent-005':120,'agent-004':48} },
      { toolId:'store_memory',       toolName:'Store Memory',        category:'storage',       callCount:6240, successRate:99.8, avgLatency:18,   p95Latency:52,   costPerCall:0.00005,agentDist:{'agent-001':480,'agent-002':1560,'agent-003':840,'agent-004':720,'agent-005':1080,'agent-006':1560} },
    ];
    return tools.map(({ agentDist, avgLatency, ...t }) => ({
      ...t,
      averageLatency: avgLatency,
      successCount: Math.round(t.callCount * t.successRate / 100),
      failureCount: Math.round(t.callCount * (1 - t.successRate / 100)),
      maxLatency: t.p95Latency * 1.6,
      errorTypes: { timeout: 3, rate_limit: 2, server_error: 1 },
      totalCost: t.callCount * t.costPerCall,
      lastUsed: ago(Math.floor(Math.random() * 600000)),
      agentUsage: agentDist,
    }));
  }

  getToolHeatmap(): ToolHeatmapCell[] {
    const cells: ToolHeatmapCell[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (const toolId of TOOL_NAMES) {
        const peak = (hour >= 9 && hour <= 18) ? 1.8 : 0.3;
        cells.push({
          hour, day: 0, toolId,
          callCount: Math.max(0, Math.round((Math.random() * 40 + 5) * peak)),
          avgLatency: 200 + Math.random() * 600,
          errorRate: Math.random() * 8,
        });
      }
    }
    return cells;
  }

  getToolDependencyLinks(): ToolDependencyLink[] {
    const links: Array<[string, string, number]> = [
      ['web_search','generate_embedding',0.84], ['web_search','store_memory',0.76],
      ['fetch_api','database_query',0.62],      ['fetch_api','analyze_sentiment',0.58],
      ['database_query','render_chart',0.71],   ['database_query','analyze_sentiment',0.68],
      ['execute_code','write_file',0.89],        ['execute_code','read_file',0.77],
      ['read_file','analyze_sentiment',0.54],   ['generate_embedding','store_memory',0.93],
      ['web_search','fetch_api',0.72],           ['analyze_sentiment','render_chart',0.66],
      ['write_file','send_email',0.48],          ['read_file','execute_code',0.81],
      ['translate_text','store_memory',0.59],   ['fetch_api','store_memory',0.70],
      ['database_query','store_memory',0.65],   ['web_search','fetch_api',0.72],
      ['execute_code','store_memory',0.43],     ['render_chart','send_email',0.37],
    ];
    return links.map(([source, target, coOccurrence], i) => ({ source, target, coOccurrence, avgSequenceGap: 1 + (i % 5) }));
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ALERTS
  // ════════════════════════════════════════════════════════════════════════════

  getAlerts(): Alert[] {
    const now = NOW;
    return [
      { id:'al-01', type:'cost_spike',           severity:'critical', title:'Cost Spike: GPT-4o Cluster',          message:'Token spend up 68% in 15 min — GPT-4o agents consuming 2.4× normal rate.',            timestamp:new Date(now-180000),   acknowledged:false, relatedEntityId:'agent-001', relatedEntityType:'agent' },
      { id:'al-02', type:'failure_spike',         severity:'critical', title:'Error Rate Surge: Coder Agent',        message:'Error rate at 22% (threshold 10%) — execute_code tool failures dominating.',           timestamp:new Date(now-420000),   acknowledged:false, relatedEntityId:'agent-003', relatedEntityType:'agent' },
      { id:'al-03', type:'agent_down',            severity:'critical', title:'Agent Unresponsive: Researcher',       message:'Researcher agent missed 6 consecutive health checks (last seen 10 min ago).',           timestamp:new Date(now-660000),   acknowledged:false, relatedEntityId:'agent-002', relatedEntityType:'agent' },
      { id:'al-04', type:'budget_exceeded',       severity:'critical', title:'Monthly Budget at 94%',               message:'$2,820 spent of $3,000 monthly limit — 6 days remaining in billing cycle.',             timestamp:new Date(now-900000),   acknowledged:false },
      { id:'al-05', type:'latency_degradation',   severity:'warning',  title:'P95 Latency Degradation',             message:'claude-3.5-sonnet P95 response time at 8.4s — SLA threshold 5s.',                      timestamp:new Date(now-1800000),  acknowledged:false, relatedEntityId:'agent-006', relatedEntityType:'agent' },
      { id:'al-06', type:'rate_limit',            severity:'warning',  title:'OpenAI Rate Limit at 89%',            message:'89/100 RPM used — at current trajectory limit will be hit in ~8 min.',                  timestamp:new Date(now-3600000),  acknowledged:false, relatedEntityId:'tool-openai', relatedEntityType:'tool' },
      { id:'al-07', type:'cost_spike',            severity:'warning',  title:'Gemini Cost Trend Advisory',          message:'Gemini 1.5 Pro spend 28% above rolling 7-day average — review Writer agent prompts.',   timestamp:new Date(now-5400000),  acknowledged:false },
      { id:'al-08', type:'failure_spike',         severity:'warning',  title:'Anthropic API Intermittent 503s',      message:'14 server errors from Anthropic endpoint in last 30 min — auto-retry active.',          timestamp:new Date(now-7200000),  acknowledged:true,  relatedEntityId:'tool-anthropic', relatedEntityType:'tool' },
      { id:'al-09', type:'latency_degradation',   severity:'info',     title:'Latency Improved After Scale-Out',    message:'Average latency decreased 31% after adding 2 Analyst agent instances.',                  timestamp:new Date(now-10800000), acknowledged:true,  resolvedAt:new Date(now-9000000) },
      { id:'al-10', type:'agent_down',            severity:'critical', title:'Writer Agent Auto-Recovered',          message:'Writer agent crashed (OOM) and was automatically restarted — 4 min downtime.',          timestamp:new Date(now-14400000), acknowledged:true,  resolvedAt:new Date(now-13800000), relatedEntityId:'agent-004', relatedEntityType:'agent' },
      { id:'al-11', type:'custom',                severity:'info',     title:'Scheduled Maintenance Tonight',        message:'Infrastructure maintenance 02:00–04:00 UTC — agent execution paused.',                   timestamp:new Date(now-18000000), acknowledged:true },
      { id:'al-12', type:'budget_exceeded',       severity:'critical', title:'Daily Budget Overrun',                 message:'Daily limit of $120 exceeded by $24 — auto-scaling paused for 6 hrs.',                 timestamp:new Date(now-86400000), acknowledged:true,  resolvedAt:new Date(now-82800000) },
      { id:'al-13', type:'rate_limit',            severity:'info',     title:'Rate Limits Reset',                   message:'OpenAI + Anthropic rate limit counters reset for new billing period.',                   timestamp:new Date(now-172800000),acknowledged:true,  resolvedAt:new Date(now-172200000) },
      { id:'al-14', type:'failure_spike',         severity:'warning',  title:'QA Agent Timeout Cluster',            message:'QA-Testing agent group: 18 consecutive timeouts — possible upstream dependency issue.',   timestamp:new Date(now-259200000),acknowledged:true, relatedEntityId:'agent-006', relatedEntityType:'agent' },
      { id:'al-15', type:'cost_spike',            severity:'info',     title:'Cost Normalised Post-Incident',       message:'Token spend returned to baseline after Coder agent loop was terminated.',                 timestamp:new Date(now-345600000),acknowledged:true,  resolvedAt:new Date(now-342000000) },
      { id:'al-16', type:'custom',                severity:'warning',  title:'Model Refusal: Content Policy',       message:'GPT-4o refused 8 requests citing content policy — prompt review recommended.',            timestamp:new Date(now-432000000),acknowledged:true },
      { id:'al-17', type:'failure_spike',         severity:'warning',  title:'Context Window Overflow: Researcher', message:'Researcher agent hitting 128k context limit — conversation history pruning triggered.',  timestamp:new Date(now-518400000),acknowledged:true,  resolvedAt:new Date(now-514800000), relatedEntityId:'agent-002', relatedEntityType:'agent' },
      { id:'al-18', type:'agent_down',            severity:'info',     title:'Planner Agent Memory Cleared',        message:'Planner agent memory cleared after 72hr session — fresh context loaded.',                 timestamp:new Date(now-604800000),acknowledged:true },
      { id:'al-19', type:'latency_degradation',   severity:'critical', title:'Gemini API Outage (Resolved)',        message:'Google AI Platform experienced 42-min outage — all Writer tasks queued and replayed.',   timestamp:new Date(now-691200000),acknowledged:true,  resolvedAt:new Date(now-688680000) },
      { id:'al-20', type:'rate_limit',            severity:'warning',  title:'Embedding API Quota Near Limit',      message:'generate_embedding tool at 96% of daily quota — switching to local model fallback.',      timestamp:new Date(now-777600000),acknowledged:true,  resolvedAt:new Date(now-777000000) },
    ];
  }

  getAlertRules(): AlertRule[] {
    return [
      { id:'rule-1', name:'Critical Error Rate',     condition:{ metric:'error_rate',    operator:'>',  threshold:10,   windowMinutes:5  }, severity:'critical', enabled:true,  cooldownMinutes:15, channels:['in-app','email','webhook'] },
      { id:'rule-2', name:'Cost Surge (Hourly)',      condition:{ metric:'cost_per_hour', operator:'>',  threshold:50,   windowMinutes:60 }, severity:'warning',  enabled:true,  cooldownMinutes:30, channels:['in-app','email'] },
      { id:'rule-3', name:'High P95 Latency',         condition:{ metric:'latency_p95',   operator:'>=', threshold:5000, windowMinutes:10 }, severity:'warning',  enabled:true,  cooldownMinutes:20, channels:['in-app','webhook'] },
      { id:'rule-4', name:'Queue Depth Overflow',     condition:{ metric:'queue_depth',   operator:'>',  threshold:100,  windowMinutes:5  }, severity:'critical', enabled:false, cooldownMinutes:10, channels:['in-app','email','webhook'] },
      { id:'rule-5', name:'Monthly Budget Warning',   condition:{ metric:'budget_usage',  operator:'>=', threshold:80,   windowMinutes:60 }, severity:'warning',  enabled:true,  cooldownMinutes:120,channels:['in-app','email'] },
      { id:'rule-6', name:'Daily Budget Critical',    condition:{ metric:'budget_usage',  operator:'>=', threshold:95,   windowMinutes:60 }, severity:'critical', enabled:true,  cooldownMinutes:60, channels:['in-app','email','webhook'] },
    ];
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SESSIONS
  // ════════════════════════════════════════════════════════════════════════════

  getSessions(): Session[] {
    const makeSteps = (agentType: string, model: string): SessionStep[] => [
      { index:0, timestamp:ago(7200000), type:'system_prompt',      content:`You are a ${agentType} agent using ${model}. Your goal is to complete assigned tasks accurately and efficiently.`, tokenCount:180, duration:0,    stateSnapshot:{ contextWindowUsed:180,  contextWindowMax:128000, memoryItems:[], variables:{}, pendingToolCalls:0 } },
      { index:1, timestamp:ago(7140000), type:'user_message',       content:'Analyse the provided dataset and produce a comprehensive summary report with visualisations.', tokenCount:42, duration:12,   stateSnapshot:{ contextWindowUsed:222,  contextWindowMax:128000, memoryItems:[], variables:{}, pendingToolCalls:0 } },
      { index:2, timestamp:ago(7080000), type:'assistant_message',  content:"I'll start by loading and examining the dataset structure, then perform statistical analysis before generating the report.", tokenCount:320, duration:1840, stateSnapshot:{ contextWindowUsed:542,  contextWindowMax:128000, memoryItems:['task_objective'], variables:{}, pendingToolCalls:0 } },
      { index:3, timestamp:ago(7020000), type:'tool_call',          content:'database_query', tokenCount:120, duration:142, toolCall:{ toolName:'database_query', input:'{"sql":"SELECT * FROM dataset LIMIT 1000"}', success:true, latency:142 } },
      { index:4, timestamp:ago(6960000), type:'tool_result',        content:'{"rows":1000,"columns":["id","timestamp","value","category"],"sample":[{"id":1,"value":42.3}]}', tokenCount:284, duration:0,    stateSnapshot:{ contextWindowUsed:946,  contextWindowMax:128000, memoryItems:['task_objective','dataset_schema'], variables:{rows:1000}, pendingToolCalls:0 } },
      { index:5, timestamp:ago(6900000), type:'assistant_message',  content:'Dataset loaded: 1,000 rows, 4 columns. Running statistical analysis…\n\n**Preliminary findings:**\n- Value range: 0.8–98.4\n- Mean: 52.1, Median: 51.8 (near-normal distribution)\n- 4 categories identified', tokenCount:680, duration:2200, stateSnapshot:{ contextWindowUsed:1626, contextWindowMax:128000, memoryItems:['task_objective','dataset_schema','stats_summary'], variables:{rows:1000,mean:52.1}, pendingToolCalls:0 } },
      { index:6, timestamp:ago(6800000), type:'tool_call',          content:'render_chart', tokenCount:180, duration:1240, toolCall:{ toolName:'render_chart', input:'{"type":"histogram","data":"<values>","title":"Value Distribution"}', success:true, latency:1240 } },
      { index:7, timestamp:ago(6700000), type:'tool_result',        content:'{"chart_url":"data:image/png;base64,...","format":"PNG","size":"48KB"}', tokenCount:120, duration:0, stateSnapshot:{ contextWindowUsed:1926, contextWindowMax:128000, memoryItems:['task_objective','dataset_schema','stats_summary','chart_1'], variables:{rows:1000,mean:52.1,charts:1}, pendingToolCalls:0 } },
      { index:8, timestamp:ago(6600000), type:'assistant_message',  content:'**Analysis Complete**\n\n## Executive Summary\nThe dataset shows a near-normal value distribution (μ=52.1, σ=18.3) across 4 product categories…\n\n[Full report with charts attached]', tokenCount:1840, duration:3100, stateSnapshot:{ contextWindowUsed:3766, contextWindowMax:128000, memoryItems:['task_objective','dataset_schema','stats_summary','chart_1','report_draft'], variables:{rows:1000,mean:52.1,charts:1,report:true}, pendingToolCalls:0 } },
    ];

    return AGENTS.slice(0, 8).map((agent, i) => ({
      id: `sess-${String(i+1).padStart(3,'0')}`,
      agentId: agent.id,
      agentName: agent.name,
      agentType: agent.type,
      model: agent.model,
      startTime: ago((i+1) * 7200000),
      endTime: i % 4 === 3 ? undefined : ago(i * 7200000 + 1800000),
      status: (['completed','completed','completed','active','failed','completed','abandoned','completed'] as Session['status'][])[i],
      steps: makeSteps(agent.type, agent.model),
      totalTokens: 4200 + i * 1800,
      totalCost: parseFloat((0.06 + i * 0.04).toFixed(3)),
      metadata: { taskType: agent.type, priority: i < 3 ? 'high' : 'normal' },
    }));
  }

  // ════════════════════════════════════════════════════════════════════════════
  // AUDIT / COMPLIANCE
  // ════════════════════════════════════════════════════════════════════════════

  getAuditLogEntries(): AuditLogEntry[] {
    const eventTypes: AuditEventType[] = ['agent_created','agent_updated','task_started','task_completed','task_failed','data_accessed','data_modified','user_login','permission_changed','api_call','error_occurred'];
    const sensitivityLevels: SensitivityLevel[] = ['public','internal','confidential','restricted'];
    const frameworks: ComplianceFramework[] = ['gdpr','soc2','hipaa','iso27001'];
    const resources = ['database:users','s3:logs','api:stripe','api:openai','database:sessions','s3:reports','api:anthropic','database:audit'];
    const userNames = ['alex.chen@co.ai','priya.sharma@co.ai','marcus.dev@co.ai','system-agent@co.ai','admin@co.ai'];
    const roles = ['agent','admin','system','analyst','operator'];
    const ips = ['10.0.1.42','10.0.2.18','10.0.3.7','192.168.1.100','172.16.0.5'];

    return Array.from({ length: 200 }, (_, i) => {
      const evtType = eventTypes[i % eventTypes.length];
      const agentIdx = i % 6;
      const isFail = i % 7 === 0;
      return {
        id: `evt-${String(i+1).padStart(4,'0')}`,
        timestamp: ago(i * 2520000 / 200), // spread over 7 days
        type: evtType,
        severity: (isFail ? 'critical' : i % 3 === 0 ? 'warning' : 'info') as 'info'|'warning'|'critical',
        category: evtType.includes('data') ? 'data_access' : evtType.includes('task') ? 'task_lifecycle' : 'system_event',
        userId: `user-${(i % 5) + 1}`,
        userName: userNames[i % userNames.length],
        userRole: roles[i % roles.length],
        ipAddress: ips[i % ips.length],
        userAgent: 'AgentOps/2.1.0 (Node.js/22.0)',
        resourceType: resources[i % resources.length].split(':')[0],
        resourceId: resources[i % resources.length],
        resourceName: resources[i % resources.length].split(':')[1],
        action: evtType,
        status: (isFail ? 'failure' : 'success') as 'success'|'failure'|'partial',
        sensitivityLevel: sensitivityLevels[i % sensitivityLevels.length],
        complianceFlags: [frameworks[i % frameworks.length], frameworks[(i+1) % frameworks.length]],
        piiRedacted: i % 4 !== 0,
        traceId: `trace-${String((i % 10) + 1).padStart(3,'0')}`,
        riskScore: isFail ? 65 + (i % 30) : 10 + (i % 20),
        policyViolations: isFail ? [`policy-${i % 3 + 1}`] : [],
        metadata: { agentId: AGENTS[agentIdx].id, agentName: AGENTS[agentIdx].name },
      } as AuditLogEntry;
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // OPENTELEMETRY
  // ════════════════════════════════════════════════════════════════════════════

  getTraces(): OtelTrace[] {
    const makeSpan = (spanId: string, traceId: string, parentId: string|null, name: string, kind: SpanKind, durationMs: number, agoMs: number, isError = false, attrs: Record<string,string|number|boolean> = {}): OtelSpan => {
      const st = ago(agoMs + durationMs);
      const et = ago(agoMs);
      return {
        spanId, traceId, parentSpanId: parentId, name, kind,
        startTime: st, endTime: et, duration: durationMs,
        status: { code: (isError ? 'ERROR' : 'OK') as SpanStatusCode, message: isError ? 'Internal error' : undefined },
        attributes: { 'agent.id': traceId.replace('trace-','agent-00'), 'ai.tokens.total': 1200+Math.floor(Math.random()*3000), 'ai.cost.usd': parseFloat((0.02+Math.random()*0.1).toFixed(4)), ...attrs },
        events: [],
        depth: parentId ? 1 : 0,
        children: [],
      };
    };

    return Array.from({ length: 10 }, (_, i) => {
      const traceId = `trace-${String(i+1).padStart(3,'0')}`;
      const agent = AGENTS[i % AGENTS.length];
      const isError = i % 8 === 7;
      const baseAgo = i * 720000;
      const rootDuration = 4000 + i * 800;
      const root = makeSpan(`sp-${traceId}-root`, traceId, null, `agent.execute.${agent.name}`, 'SERVER', rootDuration, baseAgo, isError, { 'agent.name': agent.name, 'agent.model': agent.model });
      const children: OtelSpan[] = [
        makeSpan(`sp-${traceId}-1`, traceId, root.spanId, `tool.${TOOL_NAMES[i % 4]}`,   'CLIENT', 300+i*40,  baseAgo+rootDuration-500, false, { 'tool.name': TOOL_NAMES[i % 4] }),
        makeSpan(`sp-${traceId}-2`, traceId, root.spanId, `tool.${TOOL_NAMES[(i+1)%4]}`, 'CLIENT', 800+i*60,  baseAgo+rootDuration-1500, i===4, { 'tool.name': TOOL_NAMES[(i+1)%4] }),
        makeSpan(`sp-${traceId}-3`, traceId, root.spanId, 'llm.completion',               'CLIENT', 1200+i*100,baseAgo+rootDuration-2800, false, { 'llm.model': agent.model, 'llm.tokens': 1800+i*200 }),
        makeSpan(`sp-${traceId}-4`, traceId, root.spanId, 'memory.store',                 'INTERNAL',80,       baseAgo+200,              false, { 'memory.items': 3+i }),
      ];
      root.children = children;
      return {
        traceId, name: `${agent.name}: ${['Research task','Code generation','Data analysis','Writing task','Review task'][i % 5]}`,
        rootSpan: root, spans: [root, ...children],
        status: (isError ? 'error' : 'success') as OtelTrace['status'],
        startTime: root.startTime, endTime: root.endTime,
        duration: rootDuration, spanCount: 5, errorCount: isError ? 1 : 0,
        totalCost: parseFloat((0.05 + i * 0.02).toFixed(3)),
        agentId: agent.id, agentName: agent.name,
        resource: { serviceName: 'agentops-runtime', serviceVersion: '2.1.0', environment: 'production' },
      };
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // OUTCOME METRICS
  // ════════════════════════════════════════════════════════════════════════════

  getTaskOutcomes(): TaskOutcome[] {
    const taskNames = [
      'Climate Policy Literature Review','E-commerce API Implementation','Q3 Financial Report Summary',
      'Customer Sentiment Analysis','Auth Module Security Review','Market Research AI Tools',
      'Blog Post: ML Trends 2025','Payment Gateway Bug Fix','Data Pipeline Optimisation',
      'Frontend Component Review','Multi-Agent Coordination','NPS Survey Analysis',
    ];
    const impacts: BusinessImpact[] = ['high','high','medium','low','medium','high','low','high','medium','low','high','medium'];
    const ratings: QualityRating[] = ['excellent','excellent','good','acceptable','good','excellent','good','poor','good','acceptable','excellent','good'];
    const satisfactions: SatisfactionScore[] = [5,5,4,3,4,5,4,2,4,3,5,4];

    return Array.from({ length: 30 }, (_, i) => {
      const isSuccess = i % 6 !== 4;
      const agentIdx = i % AGENTS.length;
      const durationMs = 2000 + i * 280;
      return {
        id: `out-${String(i+1).padStart(3,'0')}`,
        executionId: `exec-${String((i % 12)+1).padStart(3,'0')}`,
        taskName: taskNames[i % taskNames.length],
        agentId: AGENTS[agentIdx].id,
        agentName: AGENTS[agentIdx].name,
        success: isSuccess,
        completionScore: isSuccess ? 78 + i % 22 : 20 + i % 35,
        qualityScore: isSuccess ? 7.2 + (i % 28) * 0.1 : 2.4 + i % 30 * 0.08,
        qualityRating: ratings[i % ratings.length],
        userSatisfaction: satisfactions[i % satisfactions.length],
        businessImpact: impacts[i % impacts.length],
        businessValue: isSuccess ? 60 + i % 40 : 10 + i % 20,
        costEfficiency: isSuccess ? 4.2 + i % 8 * 0.3 : 0.8 + i % 5 * 0.2,
        actualDuration: durationMs,
        slaTarget: 5000,
        slaMet: durationMs < 5000,
        slaMargin: 5000 - durationMs,
        startTime: ago((i+1) * 3600000),
        endTime: ago((i+1) * 3600000 - durationMs),
        cost: parseFloat((0.04 + i * 0.02).toFixed(3)),
        tokensUsed: 3000 + i * 800,
        errorMessage: isSuccess ? undefined : 'OpenAI API request timed out after 30s',
        tags: [AGENTS[agentIdx].type],
      };
    });
  }

  getSLADefinitions(): SLADefinition[] {
    return [
      { id:'sla-001', name:'Response Time SLA',       metricType:'response_time',   target:5000,  unit:'ms',          criticalThreshold:8000,  warningThreshold:6000,  enabled:true,  createdAt:ago(2592000000), updatedAt:ago(86400000) },
      { id:'sla-002', name:'Task Completion Rate',    metricType:'completion_rate',  target:95,    unit:'%',           criticalThreshold:85,    warningThreshold:90,    enabled:true,  createdAt:ago(2592000000), updatedAt:ago(86400000) },
      { id:'sla-003', name:'Output Quality Score',    metricType:'quality_score',    target:8.0,   unit:'score (0-10)',criticalThreshold:6.0,   warningThreshold:7.0,   enabled:true,  createdAt:ago(2592000000), updatedAt:ago(86400000) },
    ];
  }

  getGoalTrackers(): GoalTracker[] {
    return [
      { id:'goal-001', name:'Reduce P95 Response Time',   description:'Cut P95 agent response time from 4.2s to under 3s via prompt optimisation and model caching', targetMetric:'p95_latency_ms',   targetValue:3000,  currentValue:3840,  unit:'ms',    progress:58, status:'in_progress', startDate:ago(2592000000), targetDate:new Date(NOW+2592000000),  owner:'AI Ops Team',  priority:'high',   tags:['performance','latency'] },
      { id:'goal-002', name:'Achieve 98% Success Rate',   description:'Improve overall agent task success rate from 91.3% to 98% through better error handling and retry logic', targetMetric:'success_rate',     targetValue:98,    currentValue:94.2,  unit:'%',     progress:64, status:'in_progress', startDate:ago(1296000000), targetDate:new Date(NOW+1296000000),  owner:'AI Ops Team',  priority:'critical',tags:['reliability'] },
      { id:'goal-003', name:'Cut Cost per Task by 30%',   description:'Reduce average cost per task from $0.18 to $0.12 by switching eligible tasks to cheaper models', targetMetric:'cost_per_task_usd', targetValue:0.12,  currentValue:0.157, unit:'USD',    progress:42, status:'at_risk',     startDate:ago(2592000000), targetDate:new Date(NOW+864000000),   owner:'Finance Ops',  priority:'high',   tags:['cost','optimisation'] },
    ];
  }

  // ════════════════════════════════════════════════════════════════════════════
  // AGENT COMMUNICATION
  // ════════════════════════════════════════════════════════════════════════════

  getAgentMessages(): AgentMessage[] {
    const msgTypes: MessageType[] = ['task_delegation','result_response','status_update','data_transfer','error_report','handoff'];
    const protocols: CommunicationProtocol[] = ['direct','broadcast','pub_sub','request_reply'];
    const statuses: MessageStatus[] = ['delivered','delivered','delivered','delivered','acknowledged','sent'];
    const priorities: MessagePriority[] = ['normal','normal','high','low','urgent','normal'];
    const payloads = [
      'Delegating research task: "Climate Policy Analysis" — expected completion 45 min, priority HIGH',
      'Research complete — 42 sources indexed, 8 key findings extracted, confidence 0.91',
      'Status: executing step 3/7 — web_search active, tokens 24k/128k',
      'Transferring dataset: 4,832 NPS records, schema attached, processing complete',
      'Error encountered in execute_code: sandbox OOM — requesting fallback to GPT-4o-mini',
      'Task handoff: "Auth Review" → Reviewer agent — context (12k tokens) transferred',
    ];

    return Array.from({ length: 40 }, (_, i) => {
      const fromIdx = i % AGENTS.length;
      const toIdx = (fromIdx + 1 + i % 3) % AGENTS.length;
      return {
        messageId: `msg-${String(i+1).padStart(3,'0')}`,
        fromAgentId: AGENTS[fromIdx].id, fromAgentName: AGENTS[fromIdx].name,
        toAgentId: AGENTS[toIdx].id, toAgentName: AGENTS[toIdx].name,
        messageType: msgTypes[i % msgTypes.length],
        protocol: protocols[i % protocols.length],
        priority: priorities[i % priorities.length],
        status: statuses[i % statuses.length],
        payload: payloads[i % payloads.length],
        payloadSize: 1200 + i * 800,
        timestamp: ago(i * 180000),
        latency: 45 + Math.floor(Math.random() * 480),
        retryCount: i % 8 === 0 ? 1 : 0,
      };
    });
  }

  getHandoffEvents(): HandoffEvent[] {
    const taskNames = ['Climate Policy Research','API Code Review','Sentiment Analysis','Report Drafting','Security Audit','Bug Triage','Content Writing','Data Pipeline'];
    return Array.from({ length: 15 }, (_, i) => {
      const fromIdx = i % AGENTS.length;
      const toIdx = (fromIdx + 1) % AGENTS.length;
      const isSuccess = i % 7 !== 6;
      return {
        handoffId: `ho-${String(i+1).padStart(3,'0')}`,
        fromAgentId: AGENTS[fromIdx].id, fromAgentName: AGENTS[fromIdx].name,
        toAgentId: AGENTS[toIdx].id, toAgentName: AGENTS[toIdx].name,
        taskId: `task-${String(i+1).padStart(3,'0')}`,
        taskName: taskNames[i % taskNames.length],
        success: isSuccess,
        reason: isSuccess ? 'Task phase complete — passing to specialised agent' : 'Max retries exceeded — escalating to supervisor',
        contextTransferred: `Task context: ${2000 + i * 800} tokens of conversation history, ${3 + i % 8} memory items`,
        tokensTransferred: 2000 + i * 800,
        duration: 180 + i * 40,
        timestamp: ago(i * 3600000),
        failures: isSuccess ? [] : ['Context compression failed','Token limit exceeded during transfer'],
      };
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // HALLUCINATION DETECTION
  // ════════════════════════════════════════════════════════════════════════════

  getHallucinationDetails(): HallucinationDetail[] {
    const categories: HallucinationCategory[] = ['fabricated_source','invented_data','wrong_attribution','temporal_confusion','entity_confusion','capability_claim'];
    const claimedFacts = [
      'According to the 2024 MIT study on LLM accuracy (Chen et al., Science, Vol. 381), transformers achieve 99.2% factual precision.',
      'The EU AI Act was signed into law on March 15, 2023.',
      'OpenAI GPT-5 was released in Q1 2025 with a 2M token context window.',
      'Elon Musk founded Anthropic in 2021 after leaving OpenAI.',
      'The current global AI market is valued at $4.2 trillion as of 2024.',
      'LangChain version 3.0 introduced native multi-modal support in December 2024.',
    ];
    const groundTruths = [
      'No such study exists. The claim fabricates both authors and journal details.',
      'The EU AI Act was formally adopted in March 2024, not 2023.',
      'GPT-5 has not been publicly released as of the knowledge cutoff.',
      'Anthropic was founded by Dario Amodei, Daniela Amodei, and others — not Elon Musk.',
      'Global AI market estimates vary widely; $4.2 trillion is not a verified figure.',
      'LangChain v0.3 is the latest major version; no v3.0 release has been announced.',
    ];

    return Array.from({ length: 25 }, (_, i) => ({
      errorId: `hallu-${String(i+1).padStart(3,'0')}`,
      claimedFact: claimedFacts[i % claimedFacts.length],
      groundTruth: groundTruths[i % groundTruths.length],
      confidence: parseFloat((0.35 + (i % 12) * 0.05).toFixed(2)),
      category: categories[i % categories.length],
      sourceDocuments: [`doc-${i+1}a.pdf`, `doc-${i+1}b.arxiv`],
      agentOutput: `Based on recent research, ${claimedFacts[i % claimedFacts.length]} This has significant implications for…`,
    }));
  }
}

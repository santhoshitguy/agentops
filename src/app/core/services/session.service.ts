import { Injectable, signal, computed, effect, inject } from '@angular/core';
import {
  Session,
  SessionStep,
  SessionStatus,
  SessionStepType,
  StateSnapshot,
  ToolCallDetail
} from '../models/session.model';
import { SeedDataService } from './seed-data.service';
import { DataModeService } from './data-mode.service';

// ============================================
// Session Service
// Signal-based state management for session replay
// ============================================

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly seedData = inject(SeedDataService);
  private readonly dataMode = inject(DataModeService);

  private sessionsSignal = signal<Session[]>(this.seedData.getSessions());
  private selectedSessionIdSignal = signal<string | null>(null);

  readonly sessions = this.sessionsSignal.asReadonly();

  readonly selectedSession = computed(() => {
    const id = this.selectedSessionIdSignal();
    if (!id) return null;
    return this.sessionsSignal().find(s => s.id === id) ?? null;
  });

  readonly selectedSessionId = this.selectedSessionIdSignal.asReadonly();

  constructor() {
    this.sessionsSignal.set(this.generateMockSessions());

    effect(() => {
      if (this.dataMode.isMock()) {
        this.sessionsSignal.set(this.seedData.getSessions());
      }
    });
  }

  getSessions(): Session[] {
    return this.sessionsSignal();
  }

  getSession(id: string): Session | undefined {
    return this.sessionsSignal().find(s => s.id === id);
  }

  selectSession(id: string): void {
    this.selectedSessionIdSignal.set(id);
  }

  // ============================================
  // Mock Data Generation
  // ============================================

  private generateMockSessions(): Session[] {
    const now = new Date();

    const sessionConfigs: Array<{
      agentName: string;
      agentType: string;
      model: string;
      status: SessionStatus;
      minutesAgo: number;
      durationMinutes: number;
      stepCount: number;
    }> = [
      { agentName: 'ResearchBot', agentType: 'researcher', model: 'gpt-4o', status: 'completed', minutesAgo: 5, durationMinutes: 12, stepCount: 18 },
      { agentName: 'CodeAssistant', agentType: 'coder', model: 'claude-3.5-sonnet', status: 'active', minutesAgo: 2, durationMinutes: 8, stepCount: 11 },
      { agentName: 'DataAnalyzer', agentType: 'analyst', model: 'gpt-4o', status: 'completed', minutesAgo: 30, durationMinutes: 15, stepCount: 20 },
      { agentName: 'ContentWriter', agentType: 'writer', model: 'claude-3-opus', status: 'failed', minutesAgo: 45, durationMinutes: 6, stepCount: 9 },
      { agentName: 'ReviewAgent', agentType: 'reviewer', model: 'gpt-4o-mini', status: 'completed', minutesAgo: 60, durationMinutes: 10, stepCount: 14 },
      { agentName: 'Orchestrator-1', agentType: 'orchestrator', model: 'gpt-4o', status: 'completed', minutesAgo: 90, durationMinutes: 25, stepCount: 16 },
      { agentName: 'BugHunter', agentType: 'coder', model: 'claude-3.5-sonnet', status: 'failed', minutesAgo: 120, durationMinutes: 4, stepCount: 7 },
      { agentName: 'MarketResearch', agentType: 'researcher', model: 'gpt-4o', status: 'completed', minutesAgo: 180, durationMinutes: 20, stepCount: 15 },
      { agentName: 'SQLExpert', agentType: 'analyst', model: 'claude-3.5-sonnet', status: 'abandoned', minutesAgo: 240, durationMinutes: 3, stepCount: 5 },
      { agentName: 'DocGenerator', agentType: 'writer', model: 'gpt-4o-mini', status: 'completed', minutesAgo: 300, durationMinutes: 18, stepCount: 13 },
      { agentName: 'APITester', agentType: 'coder', model: 'gpt-4o', status: 'active', minutesAgo: 1, durationMinutes: 5, stepCount: 8 },
      { agentName: 'SummaryBot', agentType: 'assistant', model: 'claude-3-haiku', status: 'completed', minutesAgo: 360, durationMinutes: 7, stepCount: 10 },
    ];

    return sessionConfigs.map((cfg, i) => {
      const startTime = new Date(now.getTime() - cfg.minutesAgo * 60000);
      const endTime = cfg.status !== 'active'
        ? new Date(startTime.getTime() + cfg.durationMinutes * 60000)
        : undefined;

      const steps = this.generateSteps(cfg.stepCount, startTime, cfg.durationMinutes, cfg.status);
      const totalTokens = steps.reduce((sum, s) => sum + s.tokenCount, 0);
      const totalCost = totalTokens * 0.000035;

      return {
        id: `session-${String(i + 1).padStart(3, '0')}`,
        agentId: `agent-${String(i + 1).padStart(3, '0')}`,
        agentName: cfg.agentName,
        agentType: cfg.agentType,
        startTime,
        endTime,
        status: cfg.status,
        steps,
        totalTokens,
        totalCost,
        model: cfg.model,
        metadata: {
          environment: i % 2 === 0 ? 'production' : 'staging',
          version: `1.${Math.floor(i / 3)}.${i % 3}`,
          region: ['us-east-1', 'eu-west-1', 'ap-southeast-1'][i % 3]
        }
      };
    });
  }

  private generateSteps(
    count: number,
    startTime: Date,
    durationMinutes: number,
    sessionStatus: SessionStatus
  ): SessionStep[] {
    const steps: SessionStep[] = [];
    const stepDuration = (durationMinutes * 60000) / count;
    let contextUsed = 1200;
    const contextMax = 128000;

    // Realistic conversation flow patterns
    const flowPatterns: SessionStepType[][] = [
      ['system_prompt', 'user_message', 'assistant_message', 'tool_call', 'tool_result', 'assistant_message', 'user_message', 'assistant_message', 'tool_call', 'tool_result', 'state_change', 'assistant_message', 'user_message', 'tool_call', 'tool_result', 'assistant_message', 'state_change', 'assistant_message', 'user_message', 'assistant_message'],
    ];

    const pattern = flowPatterns[0];

    const systemPrompts = [
      'You are a helpful AI assistant specialized in data analysis. Follow instructions carefully and use tools when needed.',
      'You are a code review agent. Analyze code for bugs, performance issues, and best practices. Use the code_executor tool to verify fixes.',
      'You are a research assistant. Search the web for relevant information and synthesize findings into clear summaries.',
    ];

    const userMessages = [
      'Can you analyze the quarterly sales data and identify the top performing regions?',
      'Find the bug in the authentication module that causes session timeouts after 5 minutes.',
      'Search for the latest research on transformer architectures published in 2024.',
      'Generate a summary report of all API endpoints and their response times.',
      'What are the memory usage patterns for the last 24 hours?',
      'Review the pull request #342 and check for any security vulnerabilities.',
      'Compare the performance metrics between v2.1 and v2.2 deployments.',
    ];

    const assistantMessages = [
      'I\'ll analyze the data using the database query tool. Let me fetch the quarterly sales figures first.',
      'Based on my analysis, the top performing regions are: US-East (34% growth), EU-West (28% growth), and AP-South (22% growth).',
      'I found a potential issue in the token refresh logic. The expiry check uses server time instead of UTC, causing premature timeouts in certain timezones.',
      'Here are the key findings from my research:\n1. Flash attention mechanisms have reduced memory usage by 40%\n2. Mixture of experts models show 3x throughput improvement\n3. New quantization techniques maintain 98% accuracy at 4-bit precision.',
      'The API performance report is ready. Average response time across all endpoints is 145ms, with the /search endpoint being the slowest at 890ms.',
      'I\'ve identified 3 critical issues in the pull request:\n1. SQL injection vulnerability in the query builder\n2. Missing rate limiting on the public API\n3. Hardcoded credentials in the test fixtures.',
      'Memory usage analysis complete. Peak usage occurs at 14:00 UTC (8.2GB), with a baseline of 3.1GB. The garbage collector runs every 45 seconds.',
    ];

    const toolNames = ['web_search', 'code_executor', 'file_reader', 'database_query'];

    const toolCalls: Array<{ name: string; input: string; output: string }> = [
      { name: 'web_search', input: '{"query": "transformer architecture research 2024", "limit": 10}', output: '{"results": [{"title": "Efficient Transformers: A Survey", "url": "https://arxiv.org/abs/2401.xxxxx", "snippet": "Recent advances in transformer efficiency..."}]}' },
      { name: 'database_query', input: '{"sql": "SELECT region, SUM(revenue) as total, COUNT(*) as deals FROM sales WHERE quarter = \'Q4\' GROUP BY region ORDER BY total DESC"}', output: '{"rows": [{"region": "US-East", "total": 2450000, "deals": 342}, {"region": "EU-West", "total": 1890000, "deals": 256}]}' },
      { name: 'code_executor', input: '{"language": "python", "code": "import ast\\nwith open(\'auth.py\') as f:\\n    tree = ast.parse(f.read())\\nfor node in ast.walk(tree):\\n    if isinstance(node, ast.Compare):\\n        print(ast.dump(node))"}', output: '{"stdout": "Compare(left=Name(id=\'token_expiry\'), ops=[Lt()], comparators=[Call(func=Attribute(value=Name(id=\'datetime\'), attr=\'now\'))])", "exit_code": 0}' },
      { name: 'file_reader', input: '{"path": "/src/api/endpoints.ts", "lines": "1-50"}', output: '{"content": "import { Router } from \'express\';\\nconst router = Router();\\n\\nrouter.get(\'/health\', (req, res) => {\\n  res.json({ status: \'ok\' });\\n});\\n// ... 44 more lines", "total_lines": 50}' },
      { name: 'database_query', input: '{"sql": "SELECT endpoint, AVG(response_time_ms) as avg_rt, P95(response_time_ms) as p95_rt FROM api_metrics WHERE timestamp > NOW() - INTERVAL \'1 day\' GROUP BY endpoint"}', output: '{"rows": [{"endpoint": "/api/search", "avg_rt": 890, "p95_rt": 2100}, {"endpoint": "/api/users", "avg_rt": 45, "p95_rt": 120}]}' },
      { name: 'web_search', input: '{"query": "CVE database SQL injection prevention best practices"}', output: '{"results": [{"title": "OWASP SQL Injection Prevention", "url": "https://owasp.org/...", "snippet": "Use parameterized queries..."}]}' },
      { name: 'code_executor', input: '{"language": "bash", "code": "grep -rn \'password\\|secret\\|api_key\' tests/ --include=*.py"}', output: '{"stdout": "tests/test_auth.py:42:    password = \\"test_password_123\\"\\ntests/test_api.py:15:    api_key = \\"sk-test-xxxxx\\"", "exit_code": 0}' },
      { name: 'file_reader', input: '{"path": "/logs/memory_usage.csv", "lines": "1-100"}', output: '{"content": "timestamp,heap_used_mb,heap_total_mb,rss_mb\\n2024-01-15T00:00:00Z,3102,4096,5200\\n2024-01-15T01:00:00Z,3150,4096,5250", "total_lines": 100}' },
    ];

    const errorMessages = [
      'Error: Connection timeout after 30000ms while querying external API. Retrying with exponential backoff...',
      'Error: Rate limit exceeded (429). Tool call quota: 95/100 per minute. Waiting 60 seconds before retry.',
      'Error: File not found: /src/legacy/deprecated_handler.ts. The file may have been moved or deleted in recent refactoring.',
      'Error: Database query failed - relation "api_metrics_v2" does not exist. Schema migration may be pending.',
    ];

    const stateChangeMessages = [
      'Context window usage exceeded 50% threshold. Summarizing earlier conversation turns.',
      'Added 3 new items to working memory: [sales_data, region_analysis, quarterly_report].',
      'Tool call budget: 8/15 remaining. Prioritizing high-value operations.',
      'Switching execution mode from "exploration" to "synthesis" based on gathered evidence.',
    ];

    let userMsgIdx = 0;
    let assistantMsgIdx = 0;
    let toolCallIdx = 0;

    for (let i = 0; i < count; i++) {
      const type = pattern[i % pattern.length];
      const timestamp = new Date(startTime.getTime() + i * stepDuration);

      let content = '';
      let tokenCount = 0;
      let duration = 0;
      let toolCall: ToolCallDetail | undefined;
      let stateSnapshot: StateSnapshot | undefined;

      switch (type) {
        case 'system_prompt':
          content = systemPrompts[Math.floor(Math.random() * systemPrompts.length)];
          tokenCount = 250 + Math.floor(Math.random() * 200);
          duration = 50;
          break;
        case 'user_message':
          content = userMessages[userMsgIdx % userMessages.length];
          userMsgIdx++;
          tokenCount = 100 + Math.floor(Math.random() * 150);
          duration = 100;
          break;
        case 'assistant_message':
          content = assistantMessages[assistantMsgIdx % assistantMessages.length];
          assistantMsgIdx++;
          tokenCount = 400 + Math.floor(Math.random() * 1600);
          duration = 800 + Math.floor(Math.random() * 3000);
          break;
        case 'tool_call': {
          const tc = toolCalls[toolCallIdx % toolCalls.length];
          toolCallIdx++;
          content = `Calling ${tc.name}`;
          tokenCount = 150 + Math.floor(Math.random() * 100);
          duration = 200 + Math.floor(Math.random() * 2000);
          toolCall = {
            toolName: tc.name,
            input: tc.input,
            output: tc.output,
            success: Math.random() > 0.15,
            latency: duration
          };
          break;
        }
        case 'tool_result': {
          const prevToolCall = toolCalls[(toolCallIdx - 1) % toolCalls.length];
          content = prevToolCall?.output ?? '{"status": "ok"}';
          tokenCount = 200 + Math.floor(Math.random() * 400);
          duration = 50;
          break;
        }
        case 'error':
          content = errorMessages[Math.floor(Math.random() * errorMessages.length)];
          tokenCount = 50 + Math.floor(Math.random() * 100);
          duration = 100;
          break;
        case 'state_change':
          content = stateChangeMessages[Math.floor(Math.random() * stateChangeMessages.length)];
          tokenCount = 30;
          duration = 10;
          break;
      }

      // Inject error on second-to-last step if session failed
      if (sessionStatus === 'failed' && i === count - 2) {
        steps.push({
          index: i,
          timestamp,
          type: 'error',
          content: errorMessages[Math.floor(Math.random() * errorMessages.length)],
          tokenCount: 80,
          duration: 100,
          stateSnapshot: undefined,
          toolCall: undefined
        });
        continue;
      }

      contextUsed += tokenCount;

      stateSnapshot = {
        contextWindowUsed: contextUsed,
        contextWindowMax: contextMax,
        memoryItems: this.getMemoryItemsForStep(i),
        variables: this.getVariablesForStep(i),
        pendingToolCalls: type === 'tool_call' ? 1 : 0
      };

      steps.push({
        index: i,
        timestamp,
        type,
        content,
        tokenCount,
        duration,
        stateSnapshot,
        toolCall
      });
    }

    return steps;
  }

  private getMemoryItemsForStep(stepIndex: number): string[] {
    const allItems = [
      'user_preferences',
      'sales_data_q4',
      'region_analysis',
      'code_review_notes',
      'api_endpoints_list',
      'security_findings',
      'performance_baseline',
      'search_results_cache',
      'error_log_summary',
      'deployment_config'
    ];
    const count = Math.min(stepIndex + 1, allItems.length);
    return allItems.slice(0, count);
  }

  private getVariablesForStep(stepIndex: number): Record<string, unknown> {
    const base: Record<string, unknown> = {
      current_task: 'analysis',
      iteration: stepIndex,
      confidence: Math.min(0.5 + stepIndex * 0.05, 0.98)
    };
    if (stepIndex > 3) {
      base['results_count'] = stepIndex * 2;
      base['execution_mode'] = stepIndex > 8 ? 'synthesis' : 'exploration';
    }
    if (stepIndex > 6) {
      base['summary_ready'] = true;
      base['tools_remaining'] = Math.max(15 - stepIndex, 0);
    }
    return base;
  }
}

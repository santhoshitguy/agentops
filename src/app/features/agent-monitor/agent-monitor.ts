import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AgentExecution,
  AgentStep,
  ExecutionStats,
  ExecutionStatus,
  StepPhase,
  AgentType,
} from '../../core/models/agent.model';
import { ExecutionTimeline } from '../../shared/components/execution-timeline/execution-timeline';
import { AgentQueuePanel } from '../../shared/components/agent-queue-panel/agent-queue-panel';
import { ExecutionStatsBar } from '../../shared/components/execution-stats-bar/execution-stats-bar';

@Component({
  selector: 'app-agent-monitor',
  standalone: true,
  imports: [
    CommonModule,
    ExecutionTimeline,
    AgentQueuePanel,
    ExecutionStatsBar,
  ],
  templateUrl: './agent-monitor.html',
  styleUrl: './agent-monitor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentMonitor implements OnInit, OnDestroy {
  private updateInterval?: ReturnType<typeof setInterval>;
  private newExecInterval?: ReturnType<typeof setInterval>;
  private execCounter = 0;

  executions = signal<AgentExecution[]>([]);

  stats = computed<ExecutionStats>(() => {
    const execs = this.executions();
    const completed = execs.filter(e => e.status === 'completed');
    const failed = execs.filter(e => e.status === 'failed');
    const running = execs.filter(e => ['executing', 'planning', 'initializing'].includes(e.status));
    const queued = execs.filter(e => e.status === 'queued');
    const allFinished = [...completed, ...failed];

    const avgDuration = allFinished.length > 0
      ? allFinished.reduce((acc, e) => {
          const d = e.endTime ? new Date(e.endTime).getTime() - new Date(e.startTime).getTime() : 0;
          return acc + d;
        }, 0) / allFinished.length
      : 0;

    const successRate = allFinished.length > 0
      ? (completed.length / allFinished.length) * 100
      : 100;

    return {
      totalExecutions: execs.length,
      running: running.length,
      queued: queued.length,
      completed: completed.length,
      failed: failed.length,
      avgDuration: Math.round(avgDuration),
      successRate,
      totalTokensUsed: execs.reduce((acc, e) => acc + e.tokensUsed, 0),
      totalCost: execs.reduce((acc, e) => acc + e.cost, 0),
      throughput: running.length + Math.random() * 2,
    };
  });

  selectedExecution = signal<AgentExecution | null>(null);

  ngOnInit(): void {
    this.generateInitialExecutions();
    this.startSimulation();
  }

  ngOnDestroy(): void {
    if (this.updateInterval) clearInterval(this.updateInterval);
    if (this.newExecInterval) clearInterval(this.newExecInterval);
  }

  onExecutionSelect(exec: AgentExecution): void {
    this.selectedExecution.set(exec);
  }

  onExecutionAction(event: { action: string; executionId: string }): void {
    this.executions.update(execs =>
      execs.map(e => {
        if (e.id !== event.executionId) return e;
        switch (event.action) {
          case 'cancel':
            return { ...e, status: 'cancelled' as ExecutionStatus, endTime: new Date() };
          case 'pause':
            return { ...e, status: 'queued' as ExecutionStatus };
          case 'start':
            return { ...e, status: 'initializing' as ExecutionStatus };
          default:
            return e;
        }
      })
    );
  }

  // ---- Data Generation ----

  private generateInitialExecutions(): void {
    const agents: { name: string; type: AgentType; model: string }[] = [
      { name: 'Orchestrator', type: 'orchestrator', model: 'GPT-4o' },
      { name: 'Researcher', type: 'researcher', model: 'Claude 3.5' },
      { name: 'Coder', type: 'coder', model: 'GPT-4o' },
      { name: 'Reviewer', type: 'reviewer', model: 'Claude 3.5' },
      { name: 'Analyst', type: 'analyst', model: 'Gemini Pro' },
      { name: 'Writer', type: 'writer', model: 'Claude 3.5' },
      { name: 'Assistant', type: 'assistant', model: 'GPT-4o-mini' },
    ];

    const tasks = [
      'Analyze user feedback sentiment',
      'Generate API documentation',
      'Review PR #4521 changes',
      'Search knowledge base for "auth patterns"',
      'Compile regression test report',
      'Optimize database query performance',
      'Draft release notes v2.4.0',
      'Process customer onboarding flow',
      'Monitor system health metrics',
      'Classify support tickets batch',
      'Extract entities from legal docs',
      'Generate code for REST endpoints',
      'Validate JSON schema compliance',
      'Summarize meeting transcripts',
    ];

    const now = Date.now();
    const executions: AgentExecution[] = [];

    // 3 completed executions
    for (let i = 0; i < 3; i++) {
      const agent = agents[i % agents.length];
      const startTime = new Date(now - (120000 + Math.random() * 300000));
      const duration = 15000 + Math.random() * 45000;
      executions.push(this.createExecution(
        agent, tasks[i], 'completed',
        startTime, new Date(startTime.getTime() + duration),
        this.generateCompletedSteps(startTime, duration),
        i === 1 ? 'high' : 'normal',
      ));
    }

    // 1 failed execution
    {
      const agent = agents[3];
      const startTime = new Date(now - 90000);
      const duration = 22000;
      executions.push(this.createExecution(
        agent, tasks[3], 'failed',
        startTime, new Date(startTime.getTime() + duration),
        this.generateFailedSteps(startTime, duration),
        'normal',
        'Tool call timeout: search_database exceeded 30s limit',
      ));
    }

    // 2 executing
    for (let i = 0; i < 2; i++) {
      const agent = agents[4 + i];
      const startTime = new Date(now - (10000 + Math.random() * 30000));
      executions.push(this.createExecution(
        agent, tasks[4 + i], 'executing',
        startTime, undefined,
        this.generateActiveSteps(startTime),
        i === 0 ? 'critical' : 'high',
      ));
    }

    // 1 planning
    {
      const agent = agents[6];
      const startTime = new Date(now - 5000);
      executions.push(this.createExecution(
        agent, tasks[6], 'planning',
        startTime, undefined,
        this.generatePlanningSteps(startTime),
        'normal',
      ));
    }

    // 3 queued
    for (let i = 0; i < 3; i++) {
      const agent = agents[i % agents.length];
      executions.push(this.createExecution(
        agent, tasks[7 + i], 'queued',
        new Date(now - Math.random() * 10000), undefined,
        [],
        i === 0 ? 'high' : i === 2 ? 'critical' : 'normal',
      ));
    }

    this.execCounter = executions.length;
    this.executions.set(executions);
  }

  private createExecution(
    agent: { name: string; type: AgentType; model: string },
    taskName: string,
    status: ExecutionStatus,
    startTime: Date,
    endTime: Date | undefined,
    steps: AgentStep[],
    priority: 'low' | 'normal' | 'high' | 'critical',
    errorMessage?: string,
  ): AgentExecution {
    const tokensUsed = steps.reduce((acc, s) => acc + s.tokensUsed, 0) || Math.floor(Math.random() * 5000);
    const maxTokens = 128000;
    let progress = 0;
    if (status === 'completed') progress = 100;
    else if (status === 'failed') progress = Math.floor(Math.random() * 60) + 20;
    else if (status === 'executing') progress = Math.floor(Math.random() * 50) + 30;
    else if (status === 'planning') progress = Math.floor(Math.random() * 20) + 5;

    this.execCounter++;
    return {
      id: `exec-${this.execCounter}`,
      agentId: `agent-${agent.name.toLowerCase()}`,
      agentName: agent.name,
      agentType: agent.type,
      taskId: `task-${this.execCounter}`,
      taskName,
      status,
      priority,
      startTime,
      endTime,
      progress,
      steps,
      tokensUsed,
      maxTokens,
      cost: tokensUsed * 0.000015,
      model: agent.model,
      errorMessage,
      tags: [],
    };
  }

  private generateCompletedSteps(startTime: Date, totalDuration: number): AgentStep[] {
    const phases: { phase: StepPhase; action: string; desc: string; fraction: number }[] = [
      { phase: 'init', action: 'initialize_context', desc: 'Loading agent context and configuration', fraction: 0.08 },
      { phase: 'init', action: 'load_memory', desc: 'Retrieving relevant memory from vector store', fraction: 0.07 },
      { phase: 'plan', action: 'analyze_task', desc: 'Decomposing task into sub-goals', fraction: 0.12 },
      { phase: 'plan', action: 'select_tools', desc: 'Identifying required tools and resources', fraction: 0.08 },
      { phase: 'execute', action: 'search_database', desc: 'Querying knowledge base with semantic search', fraction: 0.18 },
      { phase: 'execute', action: 'call_api', desc: 'Fetching external data from API endpoint', fraction: 0.15 },
      { phase: 'execute', action: 'process_results', desc: 'Analyzing and filtering retrieved data', fraction: 0.12 },
      { phase: 'respond', action: 'generate_output', desc: 'Composing structured response', fraction: 0.12 },
      { phase: 'respond', action: 'validate_output', desc: 'Running output quality checks', fraction: 0.08 },
    ];

    let elapsed = 0;
    return phases.map((p, i) => {
      const duration = Math.round(totalDuration * p.fraction * (0.8 + Math.random() * 0.4));
      const step: AgentStep = {
        stepNumber: i + 1,
        phase: p.phase,
        action: p.action,
        description: p.desc,
        duration,
        startTime: new Date(startTime.getTime() + elapsed),
        endTime: new Date(startTime.getTime() + elapsed + duration),
        success: true,
        tokensUsed: Math.floor(200 + Math.random() * 2000),
        toolCalls: p.phase === 'execute' ? [
          { id: `tc-${i}`, tool: p.action, args: '{}', duration: Math.round(duration * 0.6), success: true },
        ] : undefined,
      };
      elapsed += duration;
      return step;
    });
  }

  private generateFailedSteps(startTime: Date, totalDuration: number): AgentStep[] {
    const steps = this.generateCompletedSteps(startTime, totalDuration);
    const failStep = steps[steps.length > 3 ? 4 : steps.length - 1];
    failStep.success = false;
    failStep.retryCount = 3;
    return steps.slice(0, steps.indexOf(failStep) + 1);
  }

  private generateActiveSteps(startTime: Date): AgentStep[] {
    return [
      {
        stepNumber: 1, phase: 'init', action: 'initialize_context',
        description: 'Loading agent context and configuration',
        duration: 1200, startTime, endTime: new Date(startTime.getTime() + 1200),
        success: true, tokensUsed: 340,
      },
      {
        stepNumber: 2, phase: 'plan', action: 'analyze_task',
        description: 'Decomposing task into sub-goals',
        duration: 2800, startTime: new Date(startTime.getTime() + 1200),
        endTime: new Date(startTime.getTime() + 4000),
        success: true, tokensUsed: 1520,
      },
      {
        stepNumber: 3, phase: 'execute', action: 'search_database',
        description: 'Querying knowledge base with semantic search',
        duration: 3500, startTime: new Date(startTime.getTime() + 4000),
        endTime: new Date(startTime.getTime() + 7500),
        success: true, tokensUsed: 2100,
        toolCalls: [{ id: 'tc-active', tool: 'search_database', args: '{"query":"..."}', duration: 2800, success: true }],
      },
    ];
  }

  private generatePlanningSteps(startTime: Date): AgentStep[] {
    return [
      {
        stepNumber: 1, phase: 'init', action: 'initialize_context',
        description: 'Loading agent context and configuration',
        duration: 980, startTime, endTime: new Date(startTime.getTime() + 980),
        success: true, tokensUsed: 280,
      },
      {
        stepNumber: 2, phase: 'plan', action: 'analyze_task',
        description: 'Decomposing task into sub-goals',
        duration: 0, startTime: new Date(startTime.getTime() + 980),
        success: true, tokensUsed: 450,
      },
    ];
  }

  // ---- Live Simulation ----

  private startSimulation(): void {
    this.updateInterval = setInterval(() => {
      this.executions.update(execs =>
        execs.map(e => {
          if (e.status === 'executing') {
            const newProgress = Math.min(99, e.progress + Math.floor(Math.random() * 8) + 1);
            const newTokens = e.tokensUsed + Math.floor(Math.random() * 500);

            if (newProgress >= 95 && Math.random() > 0.7) {
              return {
                ...e,
                status: 'completed' as ExecutionStatus,
                progress: 100,
                tokensUsed: newTokens,
                cost: newTokens * 0.000015,
                endTime: new Date(),
              };
            }
            return { ...e, progress: newProgress, tokensUsed: newTokens, cost: newTokens * 0.000015 };
          }

          if (e.status === 'planning') {
            const newProgress = Math.min(25, e.progress + Math.floor(Math.random() * 5) + 1);
            if (newProgress >= 25) {
              return { ...e, status: 'executing' as ExecutionStatus, progress: 26 };
            }
            return { ...e, progress: newProgress };
          }

          if (e.status === 'initializing') {
            return { ...e, status: 'planning' as ExecutionStatus, progress: 5 };
          }

          return e;
        })
      );

      // Promote queued → initializing if active < 3
      this.executions.update(execs => {
        const activeCount = execs.filter(e => ['executing', 'planning', 'initializing'].includes(e.status)).length;
        if (activeCount < 3) {
          const firstQueued = execs.find(e => e.status === 'queued');
          if (firstQueued) {
            return execs.map(e =>
              e.id === firstQueued.id ? { ...e, status: 'initializing' as ExecutionStatus, progress: 1 } : e
            );
          }
        }
        return execs;
      });
    }, 1500);

    // Add new executions periodically
    this.newExecInterval = setInterval(() => {
      const agents = [
        { name: 'Orchestrator', type: 'orchestrator' as AgentType, model: 'GPT-4o' },
        { name: 'Researcher', type: 'researcher' as AgentType, model: 'Claude 3.5' },
        { name: 'Coder', type: 'coder' as AgentType, model: 'GPT-4o' },
        { name: 'Analyst', type: 'analyst' as AgentType, model: 'Gemini Pro' },
      ];
      const tasks = [
        'Analyze incoming data stream',
        'Generate unit test coverage',
        'Classify document batch #' + Math.floor(Math.random() * 1000),
        'Process webhook payload',
        'Evaluate model performance',
        'Extract structured data from PDF',
      ];

      const agent = agents[Math.floor(Math.random() * agents.length)];
      const task = tasks[Math.floor(Math.random() * tasks.length)];
      const priorities: Array<'low' | 'normal' | 'high' | 'critical'> = ['normal', 'normal', 'high', 'low'];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];

      const newExec = this.createExecution(agent, task, 'queued', new Date(), undefined, [], priority);
      this.executions.update(execs => [...execs, newExec]);
    }, 8000);
  }
}

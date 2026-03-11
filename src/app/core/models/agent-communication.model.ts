// ============================================
// Agent-to-Agent Communication Models
// Real-time message tracking, protocols,
// handoff events, and collaboration patterns
// ============================================

// Supported communication protocols
export type CommunicationProtocol =
    | 'direct'           // One-to-one direct message
    | 'broadcast'        // One-to-many broadcast
    | 'pub_sub'          // Publish-subscribe pattern
    | 'request_reply';   // Request-response pattern

// Message types in agent collaboration
export type MessageType =
    | 'task_delegation'   // Assigning a task to another agent
    | 'result_response'   // Returning results from a task
    | 'status_update'     // Updating status of ongoing work
    | 'data_transfer'     // Transferring data between agents
    | 'error_report'      // Reporting an error to another agent
    | 'handoff';          // Handing off control/context to another agent

// Message priority levels
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

// Message delivery status
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'acknowledged' | 'failed';

// ============================================
// Core Communication Models
// ============================================

export interface AgentMessage {
    messageId: string;
    fromAgentId: string;
    fromAgentName: string;
    toAgentId: string;
    toAgentName: string;
    messageType: MessageType;
    protocol: CommunicationProtocol;
    priority: MessagePriority;
    status: MessageStatus;
    payload: string;              // Message content/summary
    payloadSize: number;          // Size in bytes
    timestamp: Date;
    latency?: number;             // Time to deliver (ms)
    retryCount: number;
    metadata?: Record<string, any>;
}

export interface CommunicationChannel {
    channelId: string;
    fromAgentId: string;
    toAgentId: string;
    protocol: CommunicationProtocol;
    isActive: boolean;
    messageCount: number;         // Total messages sent
    totalBytes: number;           // Total data transferred
    avgLatency: number;           // Average message latency
    errorRate: number;            // Percentage of failed messages (0-1)
    lastMessageAt?: Date;
    establishedAt: Date;
}

export interface HandoffEvent {
    handoffId: string;
    fromAgentId: string;
    fromAgentName: string;
    toAgentId: string;
    toAgentName: string;
    taskId: string;
    taskName: string;
    success: boolean;
    reason: string;              // Why the handoff occurred
    contextTransferred: string;  // What context was passed
    tokensTransferred: number;   // Tokens in the transferred context
    duration: number;            // Time taken for handoff (ms)
    timestamp: Date;
    failures?: string[];         // Any issues during handoff
}

export interface CollaborationPattern {
    patternId: string;
    patternName: string;         // e.g., "Pipeline", "Fan-out", "Orchestration"
    description: string;
    participantIds: string[];    // Agent IDs involved
    messageFlow: {
        from: string;
        to: string;
        messageType: MessageType;
    }[];
    frequency: number;           // How often this pattern occurs (per hour)
    averageDuration: number;     // Average time to complete pattern (ms)
    successRate: number;         // Percentage of successful completions (0-1)
    detectedAt: Date;
    lastOccurrence?: Date;
}

// ============================================
// Analytics & Aggregation Models
// ============================================

export interface CommunicationMatrix {
    fromAgentId: string;
    toAgentId: string;
    messageCount: number;
    totalBytes: number;
    avgLatency: number;
    protocols: CommunicationProtocol[];
}

export interface ChannelMetrics {
    totalChannels: number;
    activeChannels: number;
    totalMessages: number;
    totalBytesTransferred: number;
    avgLatencyMs: number;
    errorRate: number;
    messagesPerSecond: number;
    topProtocol: CommunicationProtocol;
}

export interface HandoffMetrics {
    totalHandoffs: number;
    successfulHandoffs: number;
    failedHandoffs: number;
    successRate: number;
    avgDuration: number;
    avgTokensTransferred: number;
    topHandoffPair: { from: string; to: string } | null;
}

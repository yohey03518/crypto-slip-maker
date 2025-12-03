# Data Model: Line Execution Notification

**Feature**: Line Execution Notification  
**Branch**: 001-line-execution-notify  
**Date**: 2025-12-03

## Overview

This document defines the data entities, their relationships, validation rules, and state transitions for the Line Execution Notification feature. All entities are derived from functional requirements in the feature specification.

## Core Entities

### 1. ExecutionResult

**Purpose**: Represents the outcome of a single exchange's trade execution flow (from spec entity: "Exchange Execution Result")

**Source**: Functional Requirement FR-017 - success defined as completing without throwing exception

**TypeScript Definition**:
```typescript
interface ExecutionResult {
  exchangeName: ExchangeName;
  success: boolean;
}

type ExchangeName = 'Max' | 'Bito' | 'Hoya';
```

**Fields**:
| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `exchangeName` | `ExchangeName` | Yes | Identifier for the exchange | Must be one of: 'Max', 'Bito', 'Hoya' |
| `success` | `boolean` | Yes | Execution outcome | `true` = no exception thrown, `false` = exception thrown during execution (FR-017) |

**Validation Rules**:
- `exchangeName` must be a valid exchange identifier (compile-time enforced via TypeScript union type)
- `success` must be a boolean (no null/undefined allowed)
- No additional metadata allowed (error details stay in logs per FR-014)

**Lifecycle**: Created after each exchange completes (success or failure), immutable once created

**Example Instances**:
```typescript
{ exchangeName: 'Max', success: true }      // Max completed without exception
{ exchangeName: 'Bito', success: false }    // Bito threw exception during execution
{ exchangeName: 'Hoya', success: true }     // Hoya completed without exception
```

---

### 2. ExecutionSummary

**Purpose**: Aggregated collection of all exchange execution results for a single application run (from spec entity: "Execution Summary")

**Source**: Functional Requirement FR-010 - collect and aggregate execution results before composing message

**TypeScript Definition**:
```typescript
interface ExecutionSummary {
  results: ExecutionResult[];
  timestamp: Date;
}
```

**Fields**:
| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `results` | `ExecutionResult[]` | Yes | List of exchange execution outcomes | Length must be > 0 (at least one exchange enabled) |
| `timestamp` | `Date` | Yes | When the summary was created | Valid Date object, set to current time when summary created |

**Validation Rules**:
- `results` array must contain at least one element (FR-016: at least one exchange enabled)
- `results` array should not contain duplicate `exchangeName` values (each exchange runs once per application run)
- `results` order should match execution order (Max → Bito → Hoya per FR-015 sequential execution)

**Lifecycle**: 
1. Initialized as empty array at start of main() execution
2. Appended with ExecutionResult after each exchange completes
3. Passed to notification service after all exchanges complete
4. Immutable after notification sent

**Example Instance**:
```typescript
{
  results: [
    { exchangeName: 'Max', success: true },
    { exchangeName: 'Bito', success: true },
    { exchangeName: 'Hoya', success: false }
  ],
  timestamp: new Date('2025-12-03T10:30:45.123Z')
}
```

---

### 3. LineNotificationConfig

**Purpose**: Authentication and target information required to send push messages via Line Messaging API (from spec entity: "Line Credentials")

**Source**: Functional Requirement FR-006 - configuration via environment variables

**TypeScript Definition**:
```typescript
interface LineNotificationConfig {
  channelAccessToken: string;
  userId: string;
  timeoutMs: number;
  retryDelayMs: number;
  maxRetries: number;
}
```

**Fields**:
| Field | Type | Required | Description | Validation | Default |
|-------|------|----------|-------------|------------|---------|
| `channelAccessToken` | `string` | Yes | Line Messaging API channel access token | Non-empty string, starts with valid token prefix | From `LINE_CHANNEL_ACCESS_TOKEN` env var |
| `userId` | `string` | Yes | Target Line user ID to receive notifications | Non-empty string, valid Line user ID format (U prefix) | From `LINE_USER_ID` env var |
| `timeoutMs` | `number` | No | HTTP timeout for Line API calls in milliseconds | Positive integer | 5000 (per FR-012) |
| `retryDelayMs` | `number` | No | Delay before retry in milliseconds | Positive integer | 2000 (per FR-011) |
| `maxRetries` | `number` | No | Maximum number of retry attempts | Non-negative integer (0 = no retry) | 1 (per FR-011) |

**Validation Rules**:
- `channelAccessToken` must be non-empty string (warn if not provided per FR-006)
- `userId` must be non-empty string (warn if not provided per FR-006)
- `timeoutMs` must be positive integer > 0
- `retryDelayMs` must be non-negative integer >= 0
- `maxRetries` must be non-negative integer >= 0 (1 means 2 total attempts: initial + 1 retry)

**Lifecycle**: Loaded once at service initialization from environment variables, immutable during execution

**Example Instance**:
```typescript
{
  channelAccessToken: 'YOUR_CHANNEL_ACCESS_TOKEN_HERE',
  userId: 'U1234567890abcdef1234567890abcdef',
  timeoutMs: 5000,
  retryDelayMs: 2000,
  maxRetries: 1
}
```

**Configuration Loading**:
```typescript
// From environment variables
const config: LineNotificationConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  userId: process.env.LINE_USER_ID || '',
  timeoutMs: 5000,
  retryDelayMs: 2000,
  maxRetries: 1
};
```

---

### 4. SummaryNotificationMessage

**Purpose**: Formatted message content sent to Line containing human-readable summary (from spec entity: "Summary Notification Message")

**Source**: Functional Requirement FR-004 - concise, readable format listing successful/failed exchanges

**TypeScript Definition**:
```typescript
interface SummaryNotificationMessage {
  text: string;
  characterCount: number;
}
```

**Fields**:
| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `text` | `string` | Yes | Formatted notification message | Must not exceed 5000 characters (FR-013), non-empty |
| `characterCount` | `number` | Yes | Length of text for validation | Must equal `text.length` |

**Validation Rules**:
- `text` must be non-empty string
- `text.length` must be <= 5000 characters (Line API push message limit per FR-013)
- `characterCount` must match `text.length`
- Format must follow pattern: `[Success list] Success[, Failed list failed]` (FR-004)

**Format Specification** (from research.md):
- All success: `"Max, Bito and Hoya Success"`
- Mixed: `"Max and Bito Success, Hoya failed"`
- All failed: `"Max, Bito and Hoya failed"`
- Single success: `"Max Success"`
- Single failure: `"Max failed"`

**Lifecycle**: Generated from ExecutionSummary, sent once to Line API, discarded after send attempt

**Example Instances**:
```typescript
// All successful
{
  text: 'Max, Bito and Hoya Success',
  characterCount: 27
}

// Mixed results
{
  text: 'Max and Bito Success, Hoya failed',
  characterCount: 34
}

// All failed
{
  text: 'Max, Bito and Hoya failed',
  characterCount: 26
}
```

---

## Relationships

```
ExecutionSummary (1) ──contains──> (*) ExecutionResult
       │
       │ formatted by MessageFormatter
       ↓
SummaryNotificationMessage
       │
       │ sent using
       ↓
LineNotificationConfig ──authenticates──> Line Messaging API
```

**Relationship Details**:

1. **ExecutionSummary contains ExecutionResult** (1:many)
   - One summary contains 1-3 results (one per enabled exchange)
   - Results are ordered sequentially by execution order
   - Summary is complete only when all enabled exchanges have corresponding results

2. **ExecutionSummary formatted to SummaryNotificationMessage** (1:1)
   - One summary generates exactly one message
   - Formatting is deterministic (same summary always produces same message)
   - Message generation is pure function (no side effects)

3. **LineNotificationConfig authenticates API calls** (1:many)
   - One config used for initial attempt and retry (up to 2 calls per run)
   - Config is immutable during execution
   - Same credentials used for all retry attempts

## State Transitions

### ExecutionResult State
```
[Service Start] → [Service Executing] → [Complete without exception] → {success: true}
                                     ↓
                                [Exception thrown] → {success: false}
```

### ExecutionSummary State
```
[Empty] → [Collecting] → [Complete] → [Formatted] → [Sent]
   ↓            ↓              ↓           ↓            ↓
  []     [result added]  [all done]  [message]  [notification]
```

**State Definitions**:
- **Empty**: `results = []`, before any exchange execution
- **Collecting**: `results.length < enabled_exchanges`, exchanges still running
- **Complete**: `results.length === enabled_exchanges`, ready for notification
- **Formatted**: Message generated from complete results
- **Sent**: Notification API call attempted (success or failure)

**Invariants**:
- Summary cannot transition to Formatted until Complete
- Summary cannot transition to Sent until Formatted
- Once Sent, no further state changes (terminal state)

### LineNotificationConfig State
```
[Uninitialized] → [Loaded from env] → [Validated] → [In Use]
                                    ↓
                              [Invalid/Missing] → [Log Warning]
```

**State Definitions**:
- **Uninitialized**: Before environment variable loading
- **Loaded**: Environment variables read into config object
- **Validated**: Required fields checked (non-empty token, userId)
- **Invalid/Missing**: Missing required env vars (system logs warning per FR-006)
- **In Use**: Config passed to LineNotificationService for API calls

## Validation Summary

### Field-Level Validations
- All `ExchangeName` values: Compile-time type safety via TypeScript union types
- All numeric fields (timeoutMs, retryDelayMs, maxRetries): Runtime validation for positive/non-negative integers
- All required string fields: Non-empty validation at construction
- Message character count: Pre-send validation against 5000 character limit (FR-013)

### Entity-Level Validations
- ExecutionResult: No cross-field validations required (independent fields)
- ExecutionSummary: Results array must contain at least one element (no-op notification prevented at orchestration level per spec edge case)
- LineNotificationConfig: Token and userId must both be present or both missing (all-or-nothing for warning)
- SummaryNotificationMessage: Character count must match text length

### Business Rules
1. **Unique Exchange Results**: Each exchange name appears at most once in ExecutionSummary.results
2. **Sequential Order**: Results order matches execution order (Max → Bito → Hoya) for enabled exchanges
3. **Non-Empty Summary**: ExecutionSummary with empty results array never sent to notification service (spec edge case: "no notification sent" when no exchanges enabled)
4. **Message Format Consistency**: All messages follow consistent pattern from FR-004

## Error Handling

### Invalid Data Scenarios
| Scenario | Detection | Handling | Requirement |
|----------|-----------|----------|-------------|
| Empty results array | Before notification send | Log info, skip notification | Spec edge case: no exchanges enabled |
| Missing Line credentials | Config initialization | Log warning, skip notification | FR-006, FR-009 |
| Message exceeds 5000 chars | Before API call | Truncate/log error (should never happen with 3 exchanges) | FR-013 |
| Invalid exchange name | Compile time | TypeScript compilation error | Type safety |
| Negative timeout/delay | Config initialization | Throw error, fail fast | Defensive programming |

### Data Consistency
- **Immutability**: ExecutionResult and ExecutionSummary are immutable after creation (no setters)
- **Type Safety**: TypeScript strict mode enforces non-null fields and type correctness
- **Validation Timing**: Validate at creation time, fail fast on invalid data
- **No Silent Failures**: All validation failures logged or thrown as errors

## Performance Considerations

### Memory Footprint
- ExecutionResult: ~50 bytes per instance (string + boolean)
- ExecutionSummary: ~200 bytes (3 results + timestamp)
- SummaryNotificationMessage: ~100-500 bytes (short text)
- LineNotificationConfig: ~500 bytes (strings + numbers)
- **Total**: < 1KB per application run (negligible)

### Computational Complexity
- Result collection: O(n) where n = number of exchanges (max 3)
- Message formatting: O(n) string concatenation (max 3 exchanges)
- Validation: O(1) for all field validations
- **Overall**: O(1) effective complexity (n is bounded by 3)

## Testing Considerations

### Unit Test Cases (from TDD requirement)
1. **ExecutionResult creation**: Valid exchange names, boolean success values
2. **ExecutionSummary aggregation**: Empty → collecting → complete transitions
3. **Message formatting**: All combinations of success/failure (2^3 = 8 cases)
4. **Config validation**: Missing/invalid env vars, default values, valid configs
5. **Character limit**: Messages near 5000 character boundary

### Test Data Fixtures
```typescript
// Common test fixtures
const successResult: ExecutionResult = { exchangeName: 'Max', success: true };
const failureResult: ExecutionResult = { exchangeName: 'Bito', success: false };

const allSuccessSummary: ExecutionSummary = {
  results: [
    { exchangeName: 'Max', success: true },
    { exchangeName: 'Bito', success: true },
    { exchangeName: 'Hoya', success: true }
  ],
  timestamp: new Date('2025-12-03T10:00:00Z')
};

const mixedSummary: ExecutionSummary = {
  results: [
    { exchangeName: 'Max', success: true },
    { exchangeName: 'Bito', success: true },
    { exchangeName: 'Hoya', success: false }
  ],
  timestamp: new Date('2025-12-03T10:00:00Z')
};

const validConfig: LineNotificationConfig = {
  channelAccessToken: 'test_token_123',
  userId: 'U1234567890abcdef',
  timeoutMs: 5000,
  retryDelayMs: 2000,
  maxRetries: 1
};
```

## Files Implementing This Model

- `src/types/executionResult.ts` - ExecutionResult, ExchangeName, ExecutionSummary interfaces
- `src/config/LineConfig.ts` - LineNotificationConfig interface and environment loading
- `src/utils/messageFormatter.ts` - SummaryNotificationMessage creation and formatting logic
- `src/services/LineNotificationService.ts` - Uses all entities to send notifications
- `src/server.ts` - Creates ExecutionSummary by collecting ExecutionResult instances


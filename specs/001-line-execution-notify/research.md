# Research: Line Execution Notification

**Date**: 2025-12-03  
**Feature**: Line Execution Notification  
**Branch**: 001-line-execution-notify

## Research Tasks

### 1. Testing Framework Selection

**Decision**: Node.js native test runner (`node:test` module)

**Rationale**:
- Built-in to Node.js 18+ (no external dependencies)
- TypeScript compatible when used with `tsx` (already in devDependencies)
- Sufficient for unit, integration, and contract tests
- Zero configuration overhead
- Project already has Playwright for E2E (if needed later), so native runner for unit/integration is appropriate
- Follows KISS principle from constitution

**Alternatives Considered**:
- **Jest**: Popular but heavyweight, requires additional babel/ts-jest configuration, slower startup
- **Vitest**: Modern and fast but adds another dependency; overkill for simple service testing
- **Mocha/Chai**: Requires multiple packages; more configuration than native runner

**Implementation**:
```json
// Add to package.json scripts
"test": "node --import tsx --test 'tests/**/*.test.ts'",
"test:watch": "node --import tsx --test --watch 'tests/**/*.test.ts'"
```

### 2. Line Messaging API Integration

**Decision**: Use Line Messaging API Push Message endpoint with direct axios HTTP calls

**Rationale**:
- Per spec requirement: "I don't want to use any external library to integrate Line API"
- axios already available in project dependencies
- Simple REST API - single POST endpoint sufficient
- Matches existing patterns in codebase (MaxApi, BitoApi use axios)

**Line API Details**:
- **Endpoint**: `https://api.line.me/v2/bot/message/push`
- **Authentication**: Bearer token via `Authorization` header
- **Request Format**:
  ```json
  {
    "to": "<USER_ID>",
    "messages": [
      {
        "type": "text",
        "text": "<MESSAGE_CONTENT>"
      }
    ]
  }
  ```
- **Response**: 200 OK on success, error object with status/message on failure
- **Message Limits**: 5000 characters per text message (per spec)
- **Rate Limits**: Not a concern for single notification per run

**Environment Variables**:
- `LINE_CHANNEL_ACCESS_TOKEN`: Channel access token for authentication
- `LINE_USER_ID`: Target user ID to receive notifications

**Error Handling**:
- HTTP 400: Invalid request (bad token, invalid user ID) - log and fail
- HTTP 429: Rate limit (unlikely) - retry logic handles
- Network errors: Retry logic handles
- Timeout: 5-second timeout per spec requirement

**Alternatives Considered**:
- **Line Notify API**: Simpler but doesn't support Official Accounts; spec requires Line Messaging API
- **Webhook/Reply API**: Requires incoming message; push message is correct for autonomous notifications
- **@line/bot-sdk**: Official SDK but violates "no external library" requirement

### 3. Retry Logic with Axios

**Decision**: Implement custom retry wrapper for Line API calls

**Rationale**:
- Spec requires: "Retry once after a brief delay (e.g., 2 seconds)"
- Simple requirement doesn't justify axios-retry library
- Full control over retry logic and logging
- Constitution requires explicit logging of retry attempts

**Implementation Pattern**:
```typescript
async function sendWithRetry(
  message: string,
  config: LineConfig,
  timeout: number = 5000
): Promise<void> {
  const maxAttempts = 2; // Initial + 1 retry
  const retryDelayMs = 2000;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await axios.post(
        'https://api.line.me/v2/bot/message/push',
        {
          to: config.userId,
          messages: [{ type: 'text', text: message }]
        },
        {
          headers: {
            'Authorization': `Bearer ${config.token}`,
            'Content-Type': 'application/json'
          },
          timeout: timeout
        }
      );
      logger.info(`Line notification sent successfully on attempt ${attempt}`);
      return;
    } catch (error) {
      logger.error(`Line notification attempt ${attempt} failed`, error);
      
      if (attempt < maxAttempts) {
        logger.info(`Retrying after ${retryDelayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      } else {
        // Log full details on final failure (per spec FR-007)
        logger.error('Line notification failed after all retries', {
          request: { endpoint, headers: { Authorization: 'Bearer ***' }, body: message },
          response: error.response?.data,
          statusCode: error.response?.status
        });
        throw error;
      }
    }
  }
}
```

**Alternatives Considered**:
- **axios-retry library**: Adds dependency; overkill for simple "retry once" requirement
- **Exponential backoff**: Not needed; spec specifies fixed 2-second delay

### 4. Message Formatting Strategy

**Decision**: Template-based formatter with grouped success/failure lists

**Rationale**:
- Spec requirement: "Max and Bito Success, Hoya failed" format
- Clear, concise, human-readable
- Easy to test independently
- Fits within 5000 character limit (3 exchanges × ~20 chars = ~60 chars)

**Format Pattern**:
```
[Success exchanges] Success[, Failed exchanges failed]
```

**Examples**:
- All success: "Max, Bito and Hoya Success"
- Mixed: "Max and Bito Success, Hoya failed"
- All failed: "Max, Bito and Hoya failed"
- Single: "Max Success" or "Max failed"

**Implementation**:
```typescript
function formatSummaryMessage(results: ExecutionResult[]): string {
  const successful = results.filter(r => r.success).map(r => r.exchangeName);
  const failed = results.filter(r => !r.success).map(r => r.exchangeName);
  
  const parts: string[] = [];
  
  if (successful.length > 0) {
    parts.push(`${joinWithAnd(successful)} Success`);
  }
  
  if (failed.length > 0) {
    parts.push(`${joinWithAnd(failed)} failed`);
  }
  
  return parts.join(', ');
}

function joinWithAnd(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(' and ');
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}
```

**Alternatives Considered**:
- **JSON format**: Machine-readable but not human-friendly for Line notification
- **Bullet list**: Multi-line but unnecessarily verbose for 3 exchanges
- **Emoji indicators**: Not requested in spec; keeping it simple

### 5. Result Aggregation Pattern

**Decision**: Modify server.ts to collect results in try-catch blocks, pass to notification service

**Rationale**:
- Spec requirement: System determines success as "no exception thrown during execution flow"
- Minimal modification to existing orchestration logic
- Clear success/failure semantics already established by existing error handling
- Constitution brownfield safety: isolated change in server.ts main() function

**Implementation Pattern**:
```typescript
// In server.ts main()
const results: ExecutionResult[] = [];

for (const [name, service] of services) {
  try {
    await service.Do();
    results.push({ exchangeName: name, success: true });
  } catch (error) {
    logger.error(`${name} failed:`, error);
    results.push({ exchangeName: name, success: false });
    // Don't re-throw; continue to other exchanges
  }
}

// After all exchanges complete
if (results.length > 0) {
  const notificationService = Container.get(LineNotificationService);
  await notificationService.sendSummary(results);
}
```

**Alternatives Considered**:
- **Event emitter pattern**: Over-engineered for sequential execution
- **Promise.allSettled()**: Would change execution from sequential to concurrent (violates spec FR-015)
- **Modify service interfaces**: Would require changing existing services (violates brownfield safety)

## Dependencies

### New Dependencies Required
**None** - All requirements met with existing dependencies:
- `axios`: HTTP client for Line API
- `typedi`: Dependency injection (already used)
- `dotenv`: Environment variable loading (already used)
- Native `node:test`: Built-in testing (Node.js 18+)

### Environment Variables Added
- `LINE_CHANNEL_ACCESS_TOKEN` (required): Line Messaging API channel access token
- `LINE_USER_ID` (required): Target Line user ID for notifications

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Line API token invalid/expired | Medium | Low | Graceful error logging; trades already completed successfully |
| Network failure at notification time | Low | Low | Retry logic + timeout; trade results preserved in logs |
| Message format doesn't render well in Line | Low | Low | Simple text format tested manually before deployment |
| Modification to server.ts breaks existing flow | Low | High | Comprehensive integration tests; explicit approval gate |
| No testing framework causes TDD friction | N/A | Medium | Resolved: using native Node.js test runner |

## Testing Strategy

### Test Levels

1. **Unit Tests** (isolated, fast):
   - Message formatter: various result combinations → expected format strings
   - Result aggregation: collecting results from service execution
   - Config validation: environment variable parsing and validation

2. **Integration Tests** (with mocks):
   - LineNotificationService: HTTP calls with axios mock
   - Retry logic: simulate failures and verify retry behavior
   - Timeout handling: verify 5-second timeout enforced

3. **Contract Tests** (API structure):
   - Line API request format matches expected structure
   - Line API response handling for success/error cases

### Test Execution
```bash
npm run test          # Run all tests once
npm run test:watch    # Watch mode during development
npm run build && npm run test  # Pre-commit validation
```

## Open Questions

**None** - All NEEDS CLARIFICATION items resolved:
- ✅ Testing framework: Native Node.js test runner
- ✅ Line API integration: Direct axios calls to push message endpoint
- ✅ Retry pattern: Custom wrapper with 2-second delay
- ✅ Message format: Template-based with grouped lists
- ✅ Result collection: Try-catch in server.ts orchestration

## References

- [Line Messaging API Documentation](https://developers.line.biz/en/reference/messaging-api/#send-push-message)
- [Node.js Test Runner Documentation](https://nodejs.org/api/test.html)
- [Axios Timeout Configuration](https://axios-http.com/docs/req_config)
- Feature Specification: `specs/001-line-execution-notify/spec.md`
- Project Constitution: `.specify/memory/constitution.md`


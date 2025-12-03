# Implementation Plan: Line Execution Notification

**Branch**: `001-line-execution-notify` | **Date**: 2025-12-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-line-execution-notify/spec.md`

## Summary

Add Line Messaging API integration to send a single summary notification after all enabled exchanges (Max, Bito, Hoya) complete their trade execution flows. The notification will show which exchanges succeeded and which failed in a concise format (e.g., "Max and Bito Success, Hoya failed"). Implementation will use direct REST API calls to Line without external libraries, with retry logic and proper error handling.

## Technical Context

**Language/Version**: TypeScript 5.x with ES2022 target, Node.js 20.x  
**Primary Dependencies**: axios (HTTP client), typedi (DI container), dotenv (env config)  
**Storage**: N/A (console application, no persistent storage)  
**Testing**: Native Node.js test runner (`node:test`) with tsx for TypeScript support  
**Target Platform**: Node.js console application (Linux/macOS server)  
**Project Type**: Single project (src/ directory structure)  
**Performance Goals**: Send notification within 12 seconds after last exchange completes (5s timeout + 2s delay + 5s retry)  
**Constraints**: 5-second HTTP timeout for Line API calls, 5000 character message limit, sequential exchange execution  
**Scale/Scope**: 3 exchanges, ~100-200 LOC for notification service, single notification per run

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Check (Before Phase 0)

### ✅ Principle I: Test-Driven Development (TDD)
- **Status**: PASS with commitment
- **Plan**: All new code (LineNotificationService, result aggregation, message formatting) will be written test-first following Red-Green-Refactor
- **Test Coverage**: Unit tests (message formatting, result aggregation), logic tests (transformations, validations, integrations)
- **Test Quality**: All tests MUST contain actual logic verification (filtering, validation, formatting) rather than simple property assignment checks, per constitution test quality requirements
- **Task Requirement**: All test cases will be explicitly listed in tasks.md

### ✅ Principle II: Code Quality & Design Principles
- **Status**: PASS
- **SOLID Compliance**:
  - Single Responsibility: LineNotificationService handles only Line API communication; separate result aggregation logic
  - Open/Closed: Service interface allows extension without modification
  - Dependency Inversion: Depend on abstractions (interfaces for HTTP client, result aggregator)
- **KISS Compliance**: Simple, focused service without premature abstraction
- **Async/await**: All HTTP calls and I/O operations use async/await (already standard in codebase)

### ✅ Principle III: Brownfield Safety Protocol
- **Status**: PASS with explicit safeguards
- **Existing Code Impact**: 
  - MUST MODIFY: `src/server.ts` main() function to wrap service execution and collect results (requires explicit approval)
  - MUST NOT MODIFY: Individual exchange services (MaxSlipService, BitoSlipService, HoyaSlipService) remain unchanged
  - NEW FILES ONLY: LineNotificationService, result types, notification utilities
- **Risk Assessment**: Low risk - changes to server.ts are additive (wrapping existing calls), not modifying core logic
- **Rollback Plan**: If notification breaks, disable via environment variable; existing trade execution unaffected
- **Test Coverage**: Integration tests will verify existing service behavior unchanged

### ✅ Principle IV: Observability & Tracing
- **Status**: PASS
- **HTTP Client Logging Requirements**:
  - LineNotificationService MUST use axios with setupApiInterceptors() for automatic request/response logging
  - Request logs include: HTTP method, URL, masked headers, request body
  - Response logs include: HTTP status, response data
  - Authorization headers MUST be masked (first 10 chars + "...")
  - Consistent logging pattern across all HTTP clients (Max, Bito, Hoya, Line)
- **Logging Requirements**:
  - Service entry/exit logging for LineNotificationService
  - Log all notification attempts (success/failure)
  - HTTP logging automatically handled by axios interceptors
  - NO sensitive data in logs (Authorization headers masked by interceptor)
- **Timeout Handling**: 5-second explicit timeout configured in axios instance
- **Error Recovery**: Retry once after 2 seconds on failure; log final outcome

### Quality Gates Applicability
1. **Test Gate**: Required - all tests must pass before completion
2. **Code Quality Gate**: Required - TypeScript compilation, no linter errors
3. **Observability Gate**: Required - all service entry/exit logged, timeout handling verified

---

### Final Check (After Phase 1 Design)

**Re-evaluation Date**: 2025-12-03

### ✅ Principle I: Test-Driven Development (TDD)
- **Status**: PASS - strengthened with concrete test specifications
- **Updates**: 
  - Testing framework resolved: Native Node.js test runner (research.md)
  - Test data fixtures defined in data-model.md
  - Test quality requirements: All tests verify logic (transformations, validations, integrations) not just property assignments
  - All test scenarios documented across research, data-model, and quickstart
- **Verification**: Design includes explicit test cases for all entities, message formats, and logic flows. Tests focus on behavior verification per constitution test quality requirements.

### ✅ Principle II: Code Quality & Design Principles
- **Status**: PASS - design confirms SOLID adherence
- **Updates**:
  - Data model confirms single responsibility (ExecutionResult, ExecutionSummary, LineNotificationConfig are separate entities)
  - Message formatting extracted to separate utility (messageFormatter.ts)
  - TypeScript interfaces ensure type safety and interface segregation
  - Simple, focused entities without over-engineering (KISS verified)
- **Verification**: Source structure in plan.md shows clear separation of concerns

### ✅ Principle III: Brownfield Safety Protocol
- **Status**: PASS - minimal impact confirmed
- **Updates**:
  - Source structure explicitly lists all new files vs. modifications
  - Only one existing file requires modification: src/server.ts
  - Modification is additive (wrap existing service calls, don't change them)
  - Integration tests will verify no regression in existing exchange services
- **Verification**: Project structure section clearly separates new files from modifications

### ✅ Principle IV: Observability & Tracing
- **Status**: PASS - comprehensive logging designed
- **Updates**:
  - Logging strategy detailed in research.md (retry wrapper example includes all log points)
  - Error handling scenarios documented in data-model.md
  - Timeout handling explicit in Line API contract (5s timeout, 2s retry delay)
  - Full request/response logging on final failure meets FR-007 requirement
- **Verification**: All external calls have explicit timeouts, all error paths have logging

### Quality Gates Verification
1. **Test Gate**: Testing strategy documented in research.md with test runner, test levels, and execution commands
2. **Code Quality Gate**: TypeScript strict mode enabled in tsconfig.json, linter commands defined
3. **Observability Gate**: All service boundaries, API calls, retries, and errors have specified logging per design

**FINAL RESULT**: ✅ ALL GATES PASS - Ready to proceed to Phase 2 (Task Decomposition)

## Project Structure

### Documentation (this feature)

```text
specs/001-line-execution-notify/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── line-api.yaml    # Line Messaging API contract
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── models/                     # [No changes]
├── services/
│   ├── BitoSlipService.ts      # [No changes]
│   ├── HoyaSlipService.ts      # [No changes]
│   ├── MaxSlipService.ts       # [No changes]
│   └── LineNotificationService.ts  # [NEW] Line API integration
├── types/
│   ├── exchange.ts             # [Existing]
│   ├── marketDepth.ts          # [Existing]
│   ├── order.ts                # [Existing]
│   └── executionResult.ts      # [NEW] Exchange execution result types
├── utils/
│   ├── logger.ts               # [No changes]
│   └── messageFormatter.ts     # [NEW] Format notification messages
├── config/
│   ├── BitoApiConfig.ts        # [Existing]
│   ├── HoyaApiConfig.ts        # [Existing]
│   ├── MaxApiConfig.ts         # [Existing]
│   └── LineConfig.ts           # [NEW] Line API configuration
└── server.ts                   # [MODIFY - requires approval] Aggregate results & send notification
```

**Test Structure**: Tests are located in `Tests` subdirectories alongside source files:
- `src/services/Tests/LineNotificationService.test.ts`
- `src/utils/Tests/messageFormatter.test.ts`
- `src/config/Tests/LineConfig.test.ts`
- `src/types/Tests/executionResult.test.ts`

**Structure Decision**: Single project structure maintained (Option 1). All new code in new files except controlled modification to `src/server.ts` for result aggregation. Tests follow `Tests` subdirectory convention (e.g., `src/services/Tests/`). Brownfield safety maintained by isolating changes to new modules and minimal, explicit modifications to existing orchestration logic.

## Complexity Tracking

> **No violations requiring justification**

All constitution principles can be satisfied without complexity exceptions. Simple, focused service addition with minimal brownfield impact.

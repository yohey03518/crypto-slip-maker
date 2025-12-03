# Tasks: Line Execution Notification

**Feature**: Line Execution Notification  
**Branch**: `001-line-execution-notify`  
**Input**: Design documents from `/specs/001-line-execution-notify/`  
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/line-api.yaml, research.md, quickstart.md

**Tests**: Following TDD approach - all tests written FIRST before implementation (per constitution Principle I)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

Single project structure:
- Source: `src/`
- Tests: In `Tests` subdirectory (e.g., `src/services/MyService.ts` and `src/services/Tests/MyService.test.ts`)
- All paths relative to repository root: `/Users/erwin.chang/git/crypto-slip-maker`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, test framework setup, and basic structure

- [X] T001 Add test scripts to package.json ("test": "node --import tsx --test 'src/**/Tests/*.test.ts'", "test:watch": "node --import tsx --test --watch 'src/**/Tests/*.test.ts'")
- [X] T002 [P] Create .env.example file in project root with all environment variables: Max exchange (MAX_API_BASE_URL, MAX_ACCESS_KEY, MAX_SECRET_KEY, RUN_MAX), Bito exchange (BITO_API_BASE_URL, BITO_API_ACCESS_KEY, BITO_API_SECRET_KEY, RUN_BITO), Hoya exchange (QUOTE_CURRENCY, RUN_HOYA, HOYA_BASE_URL, HOYA_ACCOUNT, HOYA_PASSWORD, HOYA_GOOGLE_AUTH_KEY), and Line notification (LINE_CHANNEL_ACCESS_TOKEN, LINE_USER_ID) - use TBD or placeholder values for secrets

**Checkpoint**: Basic project structure ready for development

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type definitions and utilities that MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 [P] Create ExecutionResult and ExchangeName types in src/types/executionResult.ts
- [X] T005 [P] Create ExecutionSummary interface in src/types/executionResult.ts
- [X] T006 [P] Create test fixtures and validation logic tests for ExecutionResult and ExecutionSummary in src/types/Tests/executionResult.test.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 2 - Configure Line Notification and Exchange Execution (Priority: P2) 🔧

**Goal**: Enable configuration of Line notification credentials and exchange execution through environment variables

**Independent Test**: Set valid/invalid Line credentials and exchange flags, verify system loads config correctly and logs appropriate warnings for missing/invalid values

**Why First**: Although P2 priority, this is a foundational dependency for US1 (notification sending requires configuration)

### Tests for User Story 2 (TDD - Write These FIRST) ✅

> **CRITICAL: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T007 [P] [US2] Unit test for LineNotificationConfig loading from env vars in src/config/Tests/LineConfig.test.ts
- [X] T008 [P] [US2] Unit test for config validation (missing token, missing userId, default values) in src/config/Tests/LineConfig.test.ts

### Implementation for User Story 2

- [X] T009 [US2] Create LineNotificationConfig interface in src/config/LineConfig.ts
- [X] T010 [US2] Implement loadLineConfig() function to read from environment variables in src/config/LineConfig.ts
- [X] T011 [US2] Add config validation with appropriate warning logs for missing credentials in src/config/LineConfig.ts
- [X] T012 [US2] Document environment variables in README.md (LINE_CHANNEL_ACCESS_TOKEN, LINE_USER_ID)

**Checkpoint**: Configuration system complete and tested - can load and validate Line credentials

---

## Phase 4: User Story 1 - Receive Summary Notification After All Exchanges Complete (Priority: P1) 🎯 MVP

**Goal**: Send exactly one Line notification after all enabled exchanges complete, showing which succeeded and which failed in format "Max and Bito Success, Hoya failed"

**Independent Test**: Execute trades on multiple exchanges, verify exactly one notification received after all complete with correct status for each exchange

### Tests for User Story 1 (TDD - Write These FIRST) ✅

> **CRITICAL: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T013 [P] [US1] Logic test for LineNotificationService message formatting integration in src/services/Tests/LineNotificationService.test.ts
- [X] T014 [P] [US1] Logic test for message length validation in LineNotificationService in src/services/Tests/LineNotificationService.test.ts
- [X] T015 [P] [US1] Unit test for message formatting (all success, all failed, mixed, single exchange) in src/utils/Tests/messageFormatter.test.ts
- [X] T016 [P] [US1] Unit test for joinWithAnd helper function in src/utils/Tests/messageFormatter.test.ts
- [X] T017 [P] [US1] Unit test for message character count validation (<= 5000 chars) in src/utils/Tests/messageFormatter.test.ts
- [X] T018 [P] [US1] Logic test for LineNotificationService instantiation and method existence in src/services/Tests/LineNotificationService.test.ts
- [X] T019 [P] [US1] Logic test for service configuration validation in src/services/Tests/LineNotificationService.test.ts
- [X] T020 [P] [US1] Logic test for service behavior verification in src/services/Tests/LineNotificationService.test.ts
- [X] T021 [P] [US1] Logic test for service integration with message formatter in src/services/Tests/LineNotificationService.test.ts

### Implementation for User Story 1

**Step 1: Message Formatting**
- [X] T022 [US1] Implement joinWithAnd() helper function in src/utils/messageFormatter.ts
- [X] T023 [US1] Implement formatSummaryMessage() function in src/utils/messageFormatter.ts
- [X] T024 [US1] Add message length validation (5000 char limit) in src/utils/messageFormatter.ts

**Step 2: Line API Integration**
- [X] T024a [US1] Update apiInterceptor.ts to mask Authorization headers in request/response logs (show first 10 chars + "...")
- [X] T025 [US1] Create LineNotificationService class skeleton with axios instance using setupApiInterceptors() in src/services/LineNotificationService.ts
- [X] T026 [US1] Implement sendWithRetry() private method with 2-second delay retry logic in src/services/LineNotificationService.ts
- [X] T027 [US1] Implement sendSummary() public method in src/services/LineNotificationService.ts
- [X] T028 [US1] Add comprehensive logging (entry/exit, attempts, success/failure) in src/services/LineNotificationService.ts (HTTP request/response logging handled by interceptor)
- [X] T029 [US1] Add error handling for missing config (warn and skip notification) in src/services/LineNotificationService.ts

**Step 3: Result Aggregation in server.ts**
- [X] T030 [US1] Modify server.ts main() function to initialize ExecutionResult array
- [X] T031 [US1] Wrap each service execution in try-catch to capture success/failure in src/server.ts
- [X] T032 [US1] Add result aggregation logic after each exchange completes in src/server.ts
- [X] T033 [US1] Add LineNotificationService invocation after all exchanges complete in src/server.ts
- [X] T034 [US1] Handle case where no exchanges are enabled (log info, skip notification) in src/server.ts

**Checkpoint**: Complete notification system - trades execute, results collected, single summary notification sent

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, documentation, and validation

- [X] T035 [P] Run all tests and verify 100% pass (pnpm run test)
- [X] T036 [P] Verify TypeScript compilation with no errors (pnpm run build)
- [ ] T037 [P] Test quickstart.md scenarios manually (all success, mixed results, single exchange, no exchanges, missing credentials, API failure with retry)
- [X] T038 [P] Add inline code comments for complex logic (retry mechanism, message formatting)
- [ ] T039 Run linter and fix any issues
- [X] T040 Final code review - verify constitution compliance (TDD, SOLID, observability, brownfield safety)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 2 (Phase 3)**: Depends on Foundational completion - BLOCKS User Story 1 (config required before notification)
- **User Story 1 (Phase 4)**: Depends on Foundational AND User Story 2 completion
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 1 (P1)**: DEPENDS on User Story 2 - Cannot send notifications without configuration
  - **Note**: US1 has higher business priority (P1) but US2 must be implemented first due to technical dependency

### Within Each User Story

- **TDD Requirement**: Tests MUST be written and FAIL before implementation
- Tests can all run in parallel (marked [P])
- Within implementation:
  - US2: Config interface → loading logic → validation → documentation
  - US1: Message formatting → Line API service → server.ts integration
- Story complete and tested before moving to next

### Parallel Opportunities

**Setup Phase**:
- T001 and T002 can run in parallel (different files)

**Foundational Phase**:
- T004, T005 can run in parallel (same file, different types)
- T006 (test file in src/types/Tests/) depends on T004, T005 but can be written after types are defined

**User Story 2 Tests**:
- T007 and T008 can run in parallel (same file but different test cases in src/config/Tests/LineConfig.test.ts)

**User Story 1 Tests**:
- T013, T014, T015, T016, T017, T018, T019, T020, T021 can ALL run in parallel (different test files/test cases)
  - T013, T014, T018, T019, T020, T021: Same file (src/services/Tests/LineNotificationService.test.ts) but different test cases
  - T015, T016, T017: Same file (src/utils/Tests/messageFormatter.test.ts) but different test cases

**User Story 1 Implementation**:
- T022, T023, T024 (message formatting) must be sequential (same file)
- T025-T029 (service) must be sequential (same file)
- T030-T034 (server.ts) must be sequential (same file)
- But message formatting (T022-T024) can run in parallel with service skeleton (T025)

**Polish Phase**:
- T035, T036, T037, T038 can all run in parallel (different activities)

---

## Parallel Example: User Story 1 Tests

```bash
# Launch all tests for User Story 1 together (TDD approach):
# Note: Tests are in Tests subdirectories

# Message formatting tests (src/utils/Tests/messageFormatter.test.ts):
Task: "Unit test for message formatting (all success, all failed, mixed, single exchange)"
Task: "Unit test for joinWithAnd helper function"
Task: "Unit test for message character count validation (<= 5000 chars)"

# Line notification service tests (src/services/Tests/LineNotificationService.test.ts):
Task: "Logic test for LineNotificationService message formatting integration"
Task: "Logic test for message length validation in LineNotificationService"
Task: "Logic test for LineNotificationService instantiation and method existence"
Task: "Logic test for service configuration validation"
Task: "Logic test for service behavior verification"
Task: "Logic test for service integration with message formatter"
```

All 9 test tasks can be written in parallel - 3 in messageFormatter.test.ts and 6 in LineNotificationService.test.ts. Note: Tests focus on logic verification (transformations, validations, integrations) rather than property assignment validation, per constitution test quality requirements.

---

## Implementation Strategy

### MVP First (User Story 2 + User Story 1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 2 (Configuration) - required for US1
4. Complete Phase 4: User Story 1 (Notification Sending)
5. **STOP and VALIDATE**: Test complete workflow end-to-end
6. Deploy/demo

**MVP Scope**: Both US1 and US2 are required for complete feature (US2 is foundational to US1)

### TDD Workflow (Per Constitution)

For each user story:

1. **RED**: Write all tests first (they should FAIL)
   - Example: Write T013-T021 for US1 before any implementation
2. **GREEN**: Implement minimum code to make tests pass
   - Example: Implement T022-T034 incrementally, running tests after each
3. **REFACTOR**: Clean up code while keeping tests passing
   - Example: Extract helpers, improve naming, add comments

### Incremental Validation

- After Phase 2 (Foundational): Run `pnpm run build` - should compile successfully
- After Phase 3 (US2): Run US2 tests - should all pass, verify config loading works
- After Phase 4 (US1): Run all tests - should all pass, test end-to-end notification flow
- After Phase 5 (Polish): Run quickstart.md scenarios - manually verify all work correctly

---

## Notes

- **TDD Mandatory**: All tests written before implementation (constitution Principle I)
- **[P] tasks**: Different files, no dependencies, can run in parallel
- **[Story] label**: Maps task to specific user story for traceability
- **Test-first approach**: Write tests → verify they fail → implement → verify they pass
- **Brownfield safety**: Only one existing file modified (src/server.ts), all other files are new
- **Observability**: All service boundaries, API calls, retries, and errors have logging requirements
- **Constitution compliance**: Each task designed to satisfy SOLID, KISS, and brownfield safety principles
- **Commit frequency**: Commit after each task or logical group of related tasks
- **Independent testing**: Each user story should be testable on its own after completion

---

## Task Summary

- **Total Tasks**: 40 (added apiInterceptor masking task)
- **Setup (Phase 1)**: 2 tasks
- **Foundational (Phase 2)**: 3 tasks
- **User Story 2 (Phase 3)**: 6 tasks (2 tests + 4 implementation)
- **User Story 1 (Phase 4)**: 23 tasks (9 tests + 14 implementation, including HTTP logging setup)
- **Polish (Phase 5)**: 6 tasks
- **Parallel Opportunities**: 28 tasks marked [P] (70% of tasks can run in parallel)
- **Independent Test Criteria**: Each user story has clear acceptance criteria from spec.md

## MVP Scope

**Recommended MVP**: Complete through Phase 4 (both US2 and US1)
- US2 provides configuration infrastructure
- US1 provides core notification functionality
- Together they deliver complete feature value

**Rationale**: US1 depends on US2, so both are required for any notification functionality. Completing both delivers the full feature as specified.


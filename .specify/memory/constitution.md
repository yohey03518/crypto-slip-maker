<!--
Sync Impact Report
==================
Version Change: 1.0.1 → 1.0.2

Constitution Type: PATCH - Clarification update

Changes Made:
- Added test quality clarification to Principle I (TDD)
- Tests must contain logic, not just validate property assignments
- Tests should verify behavior, transformations, validations, and business logic

Principles Modified:
- Principle I: Test-Driven Development - Added test quality requirements

Sections Modified:
- Principle I: Added "Test Quality Requirements" subsection

Templates Status:
✅ plan-template.md - No changes needed (references constitution principles)
✅ spec-template.md - No changes needed (references constitution principles)
✅ tasks-template.md - No changes needed (references constitution principles)
✅ agent-file-template.md - No changes needed
✅ checklist-template.md - No changes needed

Files Requiring Updates:
✅ All test files updated to follow new test quality standards

Follow-up TODOs:
- None
-->

# Crypto-Slip-Maker Constitution

## Core Principles

### I. Test-Driven Development (TDD) - NON-NEGOTIABLE

**All new code and modifications MUST follow Test-Driven Development:**

- Tests MUST be written BEFORE implementation code
- Tests MUST fail initially (Red phase)
- Implementation MUST make tests pass (Green phase)
- Code MUST be refactored after passing (Refactor phase)
- All unit test cases MUST be explicitly listed in task specifications (`tasks.md`) to ensure consistency and repeatability
- Test coverage MUST include: unit tests (isolated components), integration tests (component interactions), contract tests (API boundaries)
- Edge cases and error scenarios MUST have corresponding test cases

**Test Quality Requirements:**

- Tests MUST contain actual logic and behavior verification
- Tests MUST NOT simply validate that properties were assigned (e.g., `assert.equal(obj.prop, value)` where `value` was just assigned)
- Tests SHOULD verify:
  - Transformations and computations (filtering, mapping, calculations)
  - Validation logic (boundary conditions, format checking)
  - Business rules and workflows
  - Error handling and edge cases
  - Integration between components
- Test names MUST clearly describe the logic being tested (e.g., "should correctly filter results using predicate" not "should have correct value")

**Rationale**: TDD ensures specification clarity before implementation, provides living documentation, enables confident refactoring, and prevents regression. Explicit test case listing in tasks ensures AI agents can regenerate code consistently. Quality tests verify behavior rather than implementation details, making tests resilient to refactoring.

### II. Code Quality & Design Principles

**All code MUST adhere to industry-standard design principles:**

- **SOLID Principles MUST be followed:**
  - Single Responsibility: Each class/module has one reason to change
  - Open/Closed: Open for extension, closed for modification
  - Liskov Substitution: Subtypes must be substitutable for base types
  - Interface Segregation: Clients should not depend on unused interfaces
  - Dependency Inversion: Depend on abstractions, not concretions
- **KISS (Keep It Simple, Stupid) MUST be applied:**
  - Prefer simple solutions over complex ones
  - Avoid premature optimization
  - Code MUST be self-documenting with clear naming
  - Comments MUST explain "why", not "what"
- **Code MUST be maintainable:**
  - Functions/methods SHOULD be < 50 lines
  - Cyclomatic complexity SHOULD be < 10
  - Meaningful variable and function names REQUIRED
  - All comments MUST be in English
- **Asynchronous Operations:**
  - Async/await MUST be used for all I/O operations
  - No blocking operations on main thread
  - All external API calls MUST be non-blocking

**Rationale**: These principles ensure long-term maintainability, reduce cognitive load, facilitate team collaboration, minimize technical debt, and ensure responsive execution in this I/O-bound console application.

### III. Brownfield Safety Protocol - NON-NEGOTIABLE

**Existing code MUST be protected from unintended changes:**

- AI agents MUST NOT modify existing code without explicit human approval
- All proposed changes to existing files MUST be presented for review before application
- New features SHOULD be implemented in new files/modules when possible
- Changes to existing code MUST include:
  - Clear justification for the change
  - Risk assessment
  - Rollback plan
  - Test coverage for affected functionality
- Refactoring of existing code REQUIRES explicit permission and comprehensive test coverage

**Rationale**: Protects production-critical existing functionality, prevents accidental breaking changes, ensures deliberate evolution of the brownfield codebase, and maintains system stability.

### IV. Observability & Tracing - NON-NEGOTIABLE

**All code MUST support debugging and monitoring:**

- **Structured Logging REQUIRED:**
  - Use the project logger utility (`src/utils/logger.js`)
  - Log levels: error, warn, info, debug
  - Include context: service name, operation, relevant IDs, timestamps
  - NO sensitive data (API keys, passwords, tokens) in logs
- **Tracing Requirements:**
  - All service entry points MUST log start/completion
  - External API calls MUST log: endpoint, duration, status
  - Error scenarios MUST log: full error context, stack trace, recovery action
  - Transaction IDs SHOULD be propagated through service calls
- **Monitoring Hooks:**
  - Key business metrics MUST be logged (trades executed, slips generated, failures)
  - Health indicators SHOULD be logged (retry counts, timeout occurrences)
- **Timeout Handling:**
  - All external API calls MUST have explicit timeouts to prevent indefinite hangs
  - Timeout values SHOULD be configurable
  - Timeout events MUST be logged
- **Error Recovery for Trading Operations:**
  - **CRITICAL - Crypto-Specific Retry Logic:**
    - Network failures MAY trigger retry logic ONLY if order execution is confirmed unsuccessful
    - MUST verify order status before retry to prevent double orders
    - MUST NOT retry if order status is unknown or confirmed successful
    - Maximum retry attempts SHOULD be configurable (default: 3)
    - Exponential backoff SHOULD be used between retries
  - All retry attempts MUST be logged with reason and outcome
  - Failed orders after all retries MUST be clearly logged for manual review

**Rationale**: Enables rapid debugging in production, facilitates root cause analysis, prevents indefinite hangs in console application, and ensures safe error recovery for financial trading operations where duplicate orders can cause monetary loss.

## Quality Gates

**The following gates MUST pass before code is considered complete:**

1. **Test Gate:**
   - All tests pass (unit, integration, contract)
   - Test coverage meets minimum thresholds (unit: 80%, integration: key flows covered)
   - No skipped or disabled tests without documented justification

2. **Code Quality Gate:**
   - TypeScript compilation succeeds with no errors
   - Linter passes with no errors (warnings acceptable with justification)
   - Code review completed and approved

3. **Observability Gate:**
   - All service entry/exit points have logging
   - Error scenarios have appropriate error logging
   - No sensitive data in logs verified
   - Timeout handling implemented for external calls

## Development Workflow

**Standard workflow for all code changes:**

1. **Planning Phase:**
   - Feature specification created (`spec.md`)
   - Implementation plan drafted (`plan.md`)
   - Tasks decomposed with explicit test cases listed (`tasks.md`)

2. **Implementation Phase:**
   - Create feature branch following pattern: `###-feature-name`
   - **Package Manager**: This project uses `pnpm` as the package manager. All package management commands MUST use `pnpm` instead of `npm` or `yarn`:
     - Install dependencies: `pnpm install`
     - Run scripts: `pnpm run <script>` or `pnpm <script>`
     - Add dependencies: `pnpm add <package>`
     - Add dev dependencies: `pnpm add -D <package>`
   - For each task:
     - Write tests FIRST (must fail)
     - Implement code to pass tests
     - Refactor while maintaining green tests
     - Update logs/tracing as needed
   - **Commit Message Requirements:**
     - Commit after each logical task completion
     - Each commit message MUST include:
       - **Conventional Commits format**: `type(scope): subject`
         - Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
       - **Subject line**: Brief description of what was done
       - **Body**: Implementation details (bullet points or paragraphs)
       - **Footer** (required): MUST include original user prompt/request for traceability
       - **Footer format**: `User-Request: "original prompt text"`
     - **Format Example:**
       ```
       feat(exchange): add retry logic for failed orders

       - Implemented exponential backoff retry
       - Added order status verification before retry
       - Logged all retry attempts
       
       Closes #123
       User-Request: "Add retry mechanism when exchange API fails"
       ```

3. **Review Phase:**
   - Self-review against constitution principles
   - Run all quality gates locally
   - Request human review for:
     - Changes to existing files (brownfield protocol)
     - New external dependencies
     - Security-sensitive code
     - Trading/order execution logic

4. **Integration Phase:**
   - Merge only after approval and all gates pass
   - Use semantic versioning for releases:
     - MAJOR: Breaking changes (API changes, config changes)
     - MINOR: New features, backward compatible
     - PATCH: Bug fixes, documentation, refactoring
   - Tag releases in Git following `vX.Y.Z` pattern

**Rationale for Commit Traceability**: Including the original user prompt at the end of commit messages enables:
- Future developers to understand the business context and intent
- Tracing feature requests through to implementation
- Better historical analysis of why decisions were made
- Improved handoff documentation for brownfield maintenance
- Clean separation between implementation details and original requirements

## Governance

**This constitution supersedes all other practices and is enforced as follows:**

1. **Enforcement:**
   - All pull requests MUST verify compliance with constitution principles
   - AI agents MUST check against constitution before proposing changes
   - Non-compliance MUST be justified or corrected before merge

2. **Amendment Process:**
   - Constitution changes require documentation of rationale
   - Version MUST be bumped following semantic versioning:
     - MAJOR: Removal/redefinition of existing principles
     - MINOR: New principles or material expansions
     - PATCH: Clarifications, wording improvements
   - Amendment requires human approval
   - Migration plan REQUIRED for breaking changes

3. **Compliance Reviews:**
   - Constitution compliance checked at each feature specification
   - Code reviews verify adherence to all applicable principles
   - Violations require documented justification and approval

4. **Complexity Justification:**
   - Any violation of simplicity (KISS) MUST be justified in implementation plan
   - Trade-offs between principles MUST be explicitly documented
   - Alternative simpler approaches MUST be considered and documented if rejected

**Version**: 1.0.2 | **Ratified**: 2025-12-03 | **Last Amended**: 2025-12-03

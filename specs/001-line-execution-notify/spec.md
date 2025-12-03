# Feature Specification: Line Execution Notification

**Feature Branch**: `001-line-execution-notify`  
**Created**: December 3, 2025  
**Status**: Draft  
**Input**: User description: "I want to have a Line notification for the execution result of each exchang so that I can know which one success or which is failed. I don't want to use any external library to integrate Line API. I want to integrate the REST API directly in the project."

## Clarifications

### Session 2025-12-03

- Q: Which Line Messaging API notification method should be used? → A: Push message to a specific user ID (requires LINE_USER_ID)
- Q: When a Line API notification fails, should the system retry? → A: Retry once after a brief delay (e.g., 2 seconds)
- Q: What HTTP timeout should be used for Line API calls? → A: 5 seconds
- Q: What is the maximum message length for Line notifications? → A: 5000 characters
- Q: Should the notification message include error details when exchanges fail? → A: No - only show success/failed status (details in logs)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Receive Summary Notification After All Exchanges Complete (Priority: P1)

When all enabled exchanges finish their trade execution flows, the system administrator receives a single Line notification summarizing which exchanges succeeded and which failed, formatted as a concise message like "Max and Bito Success, Hoya failed."

**Why this priority**: This is the core functionality that provides a consolidated view of all trade execution results in a single notification, eliminating notification noise and giving the administrator a complete picture at once.

**Independent Test**: Can be fully tested by executing trades on multiple exchanges and verifying that exactly one notification is received after all complete, containing the correct status for each exchange. Delivers immediate value by providing complete execution status in a single glance.

**Acceptance Scenarios**:

1. **Given** three exchanges (Max, Bito, Hoya) are executed in one run, **When** all executions complete with Max success, Bito success, and Hoya failure, **Then** a single Line notification is sent with message "Max and Bito Success, Hoya failed"
2. **Given** only two exchanges (Max and Bito) are enabled for execution, **When** both complete successfully, **Then** the notification message shows "Max and Bito Success"
3. **Given** all enabled exchanges succeed, **When** executions complete, **Then** the notification shows all exchange names followed by "Success"
4. **Given** all enabled exchanges fail, **When** executions complete, **Then** the notification shows all exchange names followed by "failed"
5. **Given** only one exchange is enabled, **When** execution completes, **Then** the notification shows that single exchange name with its status

---

### User Story 2 - Configure Line Notification Credentials (Priority: P2)

The system administrator can configure Line notification credentials through environment variables to specify which Line account or channel receives the summary notification.

**Why this priority**: Required for initial setup but can be configured once, making it lower priority than the actual notification functionality. The feature cannot work without this, but it's a one-time setup task.

**Independent Test**: Can be fully tested by setting environment variables with valid Line credentials and verifying that the system can authenticate with Line API. Delivers value by enabling the notification system to connect to Line services.

**Acceptance Scenarios**:

1. **Given** valid Line channel access token is provided via environment variable, **When** the system initializes, **Then** the notification service successfully authenticates with Line API
2. **Given** invalid Line credentials are provided, **When** the system attempts to send the summary notification, **Then** appropriate error logging occurs
3. **Given** no Line credentials are configured, **When** all trades complete, **Then** the system logs a warning and continues normal operation without sending notifications

---

### Edge Cases

- What happens when the Line API is unreachable or returns an error? System retries once after 2 seconds, logs the notification failure if both attempts fail, but all trade operations should have already completed successfully
- What happens when some exchanges complete while others are still executing? System waits for all enabled exchanges to finish before sending the single summary notification
- What happens when the notification message exceeds Line API message length limits (5000 characters)? System should format the message to fit within the limit while preserving all exchange status information, prioritizing status over verbosity
- What happens when Line credentials expire or become invalid? System should log authentication errors but trade execution results are preserved in logs
- What happens when network connectivity is intermittent at notification time? System attempts initial send with 5-second timeout, retries once after 2 seconds if failed (with 5-second timeout), and logs the final result
- What happens when only one exchange is enabled? System still sends a notification with that single exchange's status

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST send exactly one Line notification after all enabled exchanges complete their trade execution flows
- **FR-002**: System MUST wait for all enabled exchanges to finish (either success or failure) before sending the summary notification
- **FR-003**: System MUST include the status (success or failed) of each executed exchange in the summary notification
- **FR-004**: System MUST format the summary message in a concise, readable format listing successful exchanges together and failed exchanges together (e.g., "Max and Bito Success, Hoya failed")
- **FR-005**: System MUST integrate with Line Messaging API using direct REST API calls without external libraries
- **FR-006**: System MUST allow configuration of Line notification credentials through environment variables (LINE_CHANNEL_ACCESS_TOKEN and LINE_USER_ID)
- **FR-007**: System MUST log all notification attempts (both successful and failed) for audit purposes
- **FR-008**: System MUST support sending notifications through Line Messaging API channel (Official Account)
- **FR-009**: System MUST handle Line API errors gracefully without impacting the visibility of trade execution results in logs
- **FR-010**: System MUST collect and aggregate execution results from all exchanges before composing the summary message
- **FR-011**: System MUST retry Line notification once after a 2-second delay if the initial attempt fails, then log final failure if retry also fails
- **FR-012**: System MUST use a 5-second HTTP timeout for all Line API calls
- **FR-013**: System MUST ensure notification messages do not exceed 5000 characters (Line API push message limit)
- **FR-014**: System MUST include only exchange names and success/failed status in notifications, without error details (error details remain in logs only)

### Key Entities

- **Exchange Execution Result**: Represents the outcome of a single exchange's trade execution flow, containing exchange identifier (Max, Bito, Hoya) and execution status (success or failed)
- **Execution Summary**: Aggregated collection of all exchange execution results for a single application run, used to compose the final notification message
- **Line Credentials**: Contains authentication information required to send push messages to a specific user, including LINE_CHANNEL_ACCESS_TOKEN (for API authentication) and LINE_USER_ID (target recipient)
- **Summary Notification Message**: Formatted message content sent to Line containing human-readable summary of all exchange results, listing successful exchanges and failed exchanges separately

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: System administrator receives exactly one Line notification per application run, regardless of the number of enabled exchanges
- **SC-002**: Summary notification is sent (or final retry attempted) within 12 seconds after the last exchange completes its execution (5s timeout + 2s delay + 5s retry timeout)
- **SC-003**: 100% of exchange execution results (both success and failure) are included in the summary notification
- **SC-004**: System administrator can determine the status of all exchanges from the single notification message without requiring access to logs
- **SC-005**: Notification message format is consistent and parseable, clearly distinguishing successful exchanges from failed ones
- **SC-006**: Summary notification is sent even when some or all exchanges fail, ensuring visibility into all execution outcomes

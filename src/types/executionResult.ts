/**
 * Type definitions for exchange execution results and notification summaries
 */

/**
 * Exchange name identifier
 * Represents the three supported exchanges
 */
export type ExchangeName = 'Max' | 'Bito' | 'Hoya';

/**
 * Execution result for a single exchange
 * Captures whether an exchange completed successfully or failed with an exception
 */
export interface ExecutionResult {
  exchangeName: ExchangeName;
  success: boolean; // true = no exception thrown, false = exception thrown
}

/**
 * Aggregated summary of all exchange executions for a single application run
 * Used to compose the notification message after all exchanges complete
 */
export interface ExecutionSummary {
  results: ExecutionResult[];
  timestamp: Date;
}


/**
 * Message formatting utilities for Line notification summaries
 * Formats execution results into human-readable messages
 */
import type { ExecutionResult } from '../types/executionResult.js';

/**
 * Join array of strings with commas and "and" for the last item
 * Examples:
 *   ['Max'] => 'Max'
 *   ['Max', 'Bito'] => 'Max and Bito'
 *   ['Max', 'Bito', 'Hoya'] => 'Max, Bito and Hoya'
 * 
 * @param items Array of strings to join
 * @returns Formatted string with proper conjunction
 */
export function joinWithAnd(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(' and ');
  
  // For 3+ items: "A, B and C"
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

/**
 * Format execution results into a summary notification message
 * Format: "[Success exchanges] Success[, Failed exchanges failed]"
 * 
 * Examples:
 *   All success: "Max, Bito and Hoya Success"
 *   Mixed: "Max and Bito Success, Hoya failed"
 *   All failed: "Max, Bito and Hoya failed"
 *   Single: "Max Success" or "Max failed"
 * 
 * @param results Array of execution results from exchanges
 * @returns Formatted notification message
 */
export function formatSummaryMessage(results: ExecutionResult[]): string {
  // Separate successful and failed exchanges
  const successful = results
    .filter(r => r.success)
    .map(r => r.exchangeName);
  
  const failed = results
    .filter(r => !r.success)
    .map(r => r.exchangeName);
  
  const parts: string[] = [];
  
  // Add success part if any exchanges succeeded
  if (successful.length > 0) {
    parts.push(`${joinWithAnd(successful)} Success`);
  }
  
  // Add failure part if any exchanges failed
  if (failed.length > 0) {
    parts.push(`${joinWithAnd(failed)} failed`);
  }
  
  // Join parts with comma and space
  return parts.join(', ');
}

/**
 * Validate that a message is within Line API's character limit
 * Line API push messages have a maximum length of 5000 characters
 * 
 * @param message The message to validate
 * @returns true if message is within limit, false otherwise
 */
export function validateMessageLength(message: string): boolean {
  const MAX_MESSAGE_LENGTH = 5000;
  return message.length <= MAX_MESSAGE_LENGTH;
}


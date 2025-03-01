/**
 * Represents the possible states of an order across different exchanges
 */
export type Status = 'completed' | 'cancelled' | 'pending' | 'other';

/**
 * Generic order response that can be used across different exchanges.
 * Provides essential order information in a standardized format.
 */
export interface Order {
    /**
     * Unique identifier for the order
     * Using string to support different ID formats across exchanges
     */
    id: string;

    /**
     * Current status of the order in standardized format
     */
    status: Status;
} 
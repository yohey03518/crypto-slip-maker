import axios from 'axios';

const MAX_API_BASE_URL = 'https://max-api.maicoin.com';

// Helper function to format timestamp
const getTimestamp = (): string => `[${new Date().toISOString()}]`;

// Interface for the API response
interface MaxMarketDepthResponse {
    timestamp: number;
    last_update_version: number;
    last_update_id: number;
    asks: [string, string][]; // [price, amount][]
    bids: [string, string][]; // [price, amount][]
}

// Function to fetch USDT/TWD price
async function fetchUSDTPrice(): Promise<MaxMarketDepthResponse> {
    try {
        console.log(`${getTimestamp()} Starting price fetch...`);
        
        const response = await axios.get<MaxMarketDepthResponse>(
            `${MAX_API_BASE_URL}/api/v3/depth`, {
                params: {
                    market: 'usdttwd',
                    limit: 5
                }
            }
        );
        
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error(`${getTimestamp()} Error fetching price:`, error instanceof Error ? error.message : 'Unknown error');
        throw error;
    }
}

// Main execution
async function main(): Promise<void> {
    try {
        const marketDepth = await fetchUSDTPrice();
        
        // Get highest bid by sorting bids by price in descending order
        const highestBid = marketDepth.bids.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))[0][0];
        
        // Get lowest ask by sorting asks by price in ascending order
        const lowestAsk = marketDepth.asks.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))[0][0];
        
        console.log(`${getTimestamp()} Highest Bid: ${highestBid} TWD`);
        console.log(`${getTimestamp()} Lowest Ask: ${lowestAsk} TWD`);
        console.log(`${getTimestamp()} Task completed`);
    } catch (error) {
        console.error(`${getTimestamp()} Script failed`);
    }
}

main(); 
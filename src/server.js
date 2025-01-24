import axios from 'axios';

// Helper function to format timestamp
const getTimestamp = () => `[${new Date().toISOString()}]`;

// Function to fetch USDT/TWD price
async function fetchUSDTPrice() {
    try {
        console.log(`${getTimestamp()} Starting price fetch...`);
        
        const response = await axios.get('https://max-api.maicoin.com/api/v3/ticker?market=usdttwd', {
            // params: {
            //     market: 'usdttwd'
            // }
        });
        
        console.log(response.data);
        return response;
    } catch (error) {
        console.error(`${getTimestamp()} Error fetching price:`, error.message);
        throw error;
    }
}

// Main execution
async function main() {
    try {
        await fetchUSDTPrice();
        console.log(`${getTimestamp()} Task completed`);
    } catch (error) {
        console.error(`${getTimestamp()} Script failed`);
    }
}

main(); 
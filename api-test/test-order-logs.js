import fetch from 'node-fetch';

async function testOrderLogs() {
  try {
    console.log('Testing order-logs endpoint...');
    const response = await fetch('http://localhost:5000/api/order-logs');
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Order logs API response:', data);
    
    if (data.data && data.data.length > 0) {
      console.log(`Successfully retrieved ${data.data.length} order logs!`);
    } else {
      console.log('No order logs found in the response.');
    }
  } catch (error) {
    console.error('Error testing order-logs API:', error);
  }
}

testOrderLogs(); 
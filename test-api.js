import fetch from 'node-fetch';

async function testApi() {
  try {
    console.log('Testing API health...');
    const healthResponse = await fetch('http://localhost:5000/api/health');
    const healthData = await healthResponse.json();
    console.log('Health check response:', healthData);
    
    console.log('\nTesting order-logs endpoint...');
    const orderLogsResponse = await fetch('http://localhost:5000/api/order-logs');
    const orderLogsData = await orderLogsResponse.json();
    console.log('Order logs response:', orderLogsData);
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testApi(); 
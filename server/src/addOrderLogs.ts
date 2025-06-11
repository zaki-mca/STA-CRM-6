import { query } from './db';

// Generate a valid UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function addOrderLogs() {
  try {
    console.log('Adding sample order logs...');
    
    // First, get some orders from the database
    const ordersResult = await query('SELECT id FROM orders LIMIT 5');
    
    if (ordersResult.rows.length === 0) {
      console.log('No orders found. Please make sure orders exist in the database.');
      return;
    }
    
    // Create sample logs for each order
    for (const order of ordersResult.rows) {
      const orderId = order.id;
      
      // Create a log entry for today
      const today = new Date();
      const todayFormatted = today.toISOString().split('T')[0];
      
      await query(`
        INSERT INTO order_logs (id, order_id, description, log_date, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        generateUUID(),
        orderId,
        'Order received and processed',
        todayFormatted,
        today,
        today
      ]);
      
      // Create a log entry for yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayFormatted = yesterday.toISOString().split('T')[0];
      
      await query(`
        INSERT INTO order_logs (id, order_id, description, log_date, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        generateUUID(),
        orderId,
        'Order status updated to shipped',
        yesterdayFormatted,
        yesterday,
        yesterday
      ]);
    }
    
    console.log('Sample order logs added successfully!');
  } catch (error) {
    console.error('Error adding sample order logs:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
addOrderLogs(); 
"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { ClientDailyLog, OrderDailyLog, DailyLogsContextType } from "@/lib/daily-logs-types"
import { clientLogApi, orderLogApi, orderLogEntryApi } from "@/lib/api"
import { toast } from "react-toastify"

const DailyLogsContext = createContext<DailyLogsContextType | undefined>(undefined)

export function DailyLogsProvider({ children }: { children: React.ReactNode }) {
  const [clientLogs, setClientLogs] = useState<ClientDailyLog[]>([])
  const [orderLogs, setOrderLogs] = useState<OrderDailyLog[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
  // Load all logs on mount
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      setError(null)
      
      try {
        console.log('Starting to fetch logs...');
        // Fetch client logs and order logs separately to handle errors individually
        let fetchedClientLogs = []
        let fetchedOrderLogs = []
        
        try {
          const clientLogResponse = await clientLogApi.getAll()
          console.log('Raw client logs response:', clientLogResponse);
          
          // Process each client log to properly extract and format the data
          fetchedClientLogs = (clientLogResponse.data || []).map((logData: any) => {
            console.log('Processing client log data:', logData);
            
            // Calculate total clients
            let clientsCount = 0;
            
            // Ensure entries is always an array, even if it's null or undefined
            let entries = logData.entries || [];
            console.log('Client log entries in useEffect:', entries);
            console.log('Original entries count:', entries.length);
            console.log('Log entries_count from API:', logData.entries_count);
            
            // Handle case where entries array might be empty but entries_count indicates clients exist
            if (entries.length === 0 && (logData.entries_count > 0 || logData.total_entries > 0)) {
              console.log('Entries array is empty but count indicates clients exist - creating placeholders');
              
              // Create placeholder entries for the number of clients
              const count = logData.entries_count || logData.total_entries || 0;
              entries = Array.from({ length: count }, (_, i) => ({
                id: `placeholder-${logData.id}-${i}`,
                client_id: `unknown-${i}`,
                client_name: 'Unknown Client',
                client_email: '',
                added_at: new Date(),
                notes: 'Client data not fully loaded'
              }));
            }
            
            // Convert entries to our frontend format with additional data
            const clients = entries.map((entry: any) => {
              console.log('Processing client entry in useEffect:', entry);
              clientsCount++;
              
              // Make sure we extract all needed info from the entry
              // Use client_name for clientName if available, otherwise try to construct from first/last name
              const clientName = entry.client_name || 
                `${entry.first_name || ''} ${entry.last_name || ''}`.trim() ||
                'Unknown Client';
              
              return {
                id: entry.id || `temp-${Date.now()}-${Math.random()}`,
                clientId: entry.client_id,
                clientName: clientName,
                clientEmail: entry.client_email || entry.email || '',
                addedAt: entry.added_at ? new Date(entry.added_at) : new Date(),
                notes: entry.notes || ''
              };
            });
            
            // Use entries_count from API response if available, or use the count of entries we processed
            const totalClients = logData.entries_count || clientsCount || logData.total_entries || 0;
            console.log('Total clients from API:', logData.entries_count);
            console.log('Clients processed count:', clientsCount);
            console.log('Final total clients in useEffect:', totalClients);
            
            // Return properly formatted client log
            return {
              ...logData,
              id: logData.id,
              date: logData.log_date ? new Date(logData.log_date) : new Date(),
              closedAt: logData.closed_at ? new Date(logData.closed_at) : undefined,
              isClosed: !!logData.closed_at,
              clients: clients || [], // Ensure clients is always an array
              totalClients: totalClients,
              createdBy: logData.created_by || 'System'
            };
          });
        } catch (clientErr: any) {
          console.error("Failed to fetch client logs:", clientErr)
          // Continue with order logs even if client logs fail
        }
        
        try {
          console.log('Fetching order logs...');
          const orderLogResponse = await orderLogApi.getAll();
          console.log('Raw order logs response:', orderLogResponse);
          
          if (!orderLogResponse || !orderLogResponse.data) {
            throw new Error('Invalid order logs response: missing data');
          }
          
          // Process each order log by fetching detailed data including entries
          fetchedOrderLogs = [];
          
          // Process logs serially to avoid race conditions
          for (const logData of orderLogResponse.data) {
            try {
              console.log(`Fetching detailed data for order log ID: ${logData.id}`);
              
              // Use getOrderLogById to get consistent formatting with entries
              const detailedLog = await getOrderLogById(logData.id);
              
              if (detailedLog) {
                fetchedOrderLogs.push(detailedLog);
                console.log(`Successfully processed log ${logData.id} with ${detailedLog.orders?.length || 0} orders`);
              } else {
                console.error(`Failed to get detailed data for log ${logData.id}`);
                
                // Create a basic log with minimal data as fallback
                const basicLog = {
                  ...logData,
                  id: logData.id,
                  date: logData.log_date ? new Date(logData.log_date) : new Date(),
                  closedAt: logData.closed_at ? new Date(logData.closed_at) : undefined,
                  isClosed: !!logData.closed_at,
                  orders: [],
                  totalOrders: logData.entries_count || 0,
                  totalValue: 0,
                  createdBy: logData.created_by || 'System'
                };
                
                fetchedOrderLogs.push(basicLog);
              }
              
              // Add a small delay between requests to prevent overwhelming the server
              await new Promise(r => setTimeout(r, 300));
            } catch (detailErr) {
              console.error(`Error processing log ${logData.id}:`, detailErr);
            }
          }
          
          console.log('Processed order logs:', fetchedOrderLogs);
        } catch (orderErr: any) {
          console.error("Failed to fetch order logs:", orderErr);
          // Continue even if order logs fail
        }
        
        setClientLogs(fetchedClientLogs)
        setOrderLogs(fetchedOrderLogs)
        
        // Only set error if both requests failed
        if (fetchedClientLogs.length === 0 && fetchedOrderLogs.length === 0) {
          setError("Failed to fetch logs. Please check server connection.")
        }
      } catch (err: any) {
        console.error("Failed to fetch logs:", err)
        setError(err.message || "Failed to fetch logs")
      } finally {
        setLoading(false)
      }
    }
    
    fetchLogs()
  }, []);

  const createClientDailyLog = async (date: Date, firstClientId: string): Promise<string> => {
    try {
      // Create a properly formatted date string in YYYY-MM-DD format
      const formattedDate = date.toISOString().split('T')[0];
      
      // Provide all required fields for client log creation with a valid client_id
      const response = await clientLogApi.create({
        log_date: formattedDate,
        client_id: firstClientId,
        description: `Daily client log for ${formattedDate}`
      });
      
      console.log('Client log creation response:', response.data);
      
      // Check the response and extract the ID
      if (!response.data || !response.data.id) {
        throw new Error('Invalid response from server: missing log ID');
      }
      
      // Calculate total clients
      let totalClients = 0;
      
      // Ensure entries is always an array, even if it's null or undefined
      const entries = response.data.entries || [];
      console.log('Client log entries:', entries);
      
      // Process entries into our frontend format
      const clients = entries.map((entry: any) => {
        console.log('Processing client entry:', entry);
        totalClients++;
        
        return {
          id: entry.id || `temp-${Date.now()}`,
          clientId: entry.client_id,
          clientName: entry.client_name || `${entry.first_name || ''} ${entry.last_name || ''}`.trim(),
          clientEmail: entry.client_email,
          addedAt: entry.added_at ? new Date(entry.added_at) : new Date(),
          notes: entry.notes || ''
        };
      });
      
      console.log('Processed client entries:', clients);
      
      // Use entries_count from API response if available, or use our count
      const finalTotalClients = response.data.entries_count || totalClients || 1; // At least 1 since we created with first client
      console.log('Final total clients:', finalTotalClients);
      
      const newLog = {
        ...response.data,
        date: new Date(formattedDate), // Ensure we have a proper date object
        clients: clients,
        totalClients: finalTotalClients,
        isClosed: false // Initialize as not closed
      };
      
      console.log('New client log created:', newLog);
      
      setClientLogs((prev) => [...prev, newLog]);
      return newLog.id;
    } catch (err: any) {
      console.error("Failed to create client log:", err);
      throw err;
    }
  }

  const addClientToLog = async (logId: string, clientId: string, notes?: string) => {
    try {
      const response = await clientLogApi.update(logId, { 
        action: 'addClient',
        clientId, // This should match the schema that expects clientId
        notes,
        description: notes || 'Client added to log' // Add description as it's required by the schema
      });
      
      console.log('Add client to log response:', response.data);
      
      // Calculate total clients
      let totalClients = 0;
      
      // Ensure entries is always an array, even if it's null or undefined
      const entries = response.data.entries || [];
      console.log('Client log entries in addClientToLog:', entries);
      
      // Process entries into our frontend format
      const clients = entries.map((entry: any) => {
        console.log('Processing client entry in addClientToLog:', entry);
        totalClients++;
        
        // Make sure we extract all needed info from the entry
        const clientName = entry.client_name || 
          `${entry.first_name || ''} ${entry.last_name || ''}`.trim() ||
          'Unknown Client';
          
        return {
          id: entry.id || `temp-${Date.now()}`,
          clientId: entry.client_id,
          clientName: clientName,
          clientEmail: entry.client_email || entry.email || '',
          addedAt: entry.added_at ? new Date(entry.added_at) : new Date(),
          notes: entry.notes || ''
        };
      });
      
      console.log('Processed client entries in addClientToLog:', clients);
      
      // Use entries_count from API response if available, or use our count
      const finalTotalClients = response.data.entries_count || totalClients || (clients.length > 0 ? clients.length : 1);
      console.log('Final total clients in addClientToLog:', finalTotalClients);
      
      // Convert the response to our frontend format
      const updatedLog = {
        ...response.data,
        date: new Date(response.data.log_date || Date.now()),
        clients: clients,
        totalClients: finalTotalClients,
        isClosed: !!response.data.closed_at
      };
      
      console.log('Updated client log in addClientToLog:', updatedLog);
      
      setClientLogs((prev) => 
        prev.map((log) => log.id === logId ? updatedLog : log)
      );
      return updatedLog;
    } catch (err: any) {
      console.error("Failed to add client to log:", err);
      throw err;
    }
  }

  const closeClientDailyLog = async (logId: string) => {
    try {
      const response = await clientLogApi.update(logId, { 
        action: 'close',
        // Don't send closedAt from client, let server handle it
      })
      
      console.log('Close client log response:', response.data);
      
      // Calculate total clients
      let clientsCount = 0;
      
      // Ensure entries is always an array, even if it's null or undefined
      const entries = response.data.entries || [];
      console.log('Client log entries in closeClientDailyLog:', entries);
      
      // Process entries into our frontend format
      const clients = entries.map((entry: any) => {
        console.log('Processing client entry in closeClientDailyLog:', entry);
        clientsCount++;
        
        // Make sure we extract all needed info from the entry
        const clientName = entry.client_name || 
          `${entry.first_name || ''} ${entry.last_name || ''}`.trim() ||
          'Unknown Client';
        
        return {
          id: entry.id || `temp-${Date.now()}`,
          clientId: entry.client_id,
          clientName: clientName,
          clientEmail: entry.client_email || entry.email || '',
          addedAt: entry.added_at ? new Date(entry.added_at) : new Date(),
          notes: entry.notes || ''
        };
      });
      
      console.log('Processed client entries in closeClientDailyLog:', clients);
      
      // Use entries_count from API response if available, or use our count
      const finalTotalClients = response.data.entries_count || clientsCount || (clients.length > 0 ? clients.length : 1);
      console.log('Final total clients in closeClientDailyLog:', finalTotalClients);
      
      // Convert the response to our frontend format with careful null handling
      const updatedLog = {
        ...response.data,
        date: response.data.log_date ? new Date(response.data.log_date) : new Date(),
        closedAt: response.data.closed_at ? new Date(response.data.closed_at) : new Date(), // Use current time as fallback
        isClosed: true, // Force this to true since we know we just closed it
        clients: clients,
        totalClients: finalTotalClients,
        createdBy: response.data.created_by || 'System'
      };
      
      console.log('Updated client log in closeClientDailyLog:', updatedLog);
      
      setClientLogs((prev) =>
        prev.map((log) => (log.id === logId ? updatedLog : log))
      )
      
      // Show success toast
      toast.success(`Client daily log for ${updatedLog.date.toLocaleDateString()} has been closed successfully`, {
        position: "top-right",
        autoClose: 3000
      });
      
      return updatedLog
    } catch (err: any) {
      console.error("Failed to close client log:", err)
      throw err
    }
  }

  const createOrderDailyLog = async (date: Date, firstOrderId: string): Promise<string> => {
    try {
      console.log(`Creating order log for date ${date.toISOString()} with first order ${firstOrderId}`);
      
      // Ensure orderId is a string to fix the validation error
      const orderIdString = String(firstOrderId);
      
      // Create a properly formatted date string in YYYY-MM-DD format
      const formattedDate = date.toISOString().split('T')[0];
      
      // Create the order log with orders array to satisfy the new schema
      console.log('Creating the order log with orders array');
      const logResponse = await orderLogApi.create({
        log_date: formattedDate,
        description: `Daily order log for ${formattedDate}`,
        orders: [{ order_id: orderIdString }] // Include first order in the orders array
      });
      
      console.log('Order log creation response:', logResponse);
      
      if (!logResponse || !logResponse.data || !logResponse.data.id) {
        throw new Error('Invalid response from server: missing log ID');
      }
      
      const logId = logResponse.data.id;
      console.log(`Log created with ID: ${logId}`);
      
      // Wait a moment before fetching the updated log to ensure the server has processed the change
      await new Promise(r => setTimeout(r, 800));
      
      // Get the complete order log data with all entries using getOrderLogById
      // This ensures we have complete and consistent data
      const freshLog = await getOrderLogById(logId);
      console.log('Fresh log data after creation:', freshLog);
      
      if (!freshLog) {
        console.error('Failed to get fresh log data after creation');
        
        // Fallback to basic log creation with minimal data
        const basicLog = {
          ...logResponse.data,
          id: logId,
          date: new Date(formattedDate),
          orders: [],
          totalOrders: 1, // At least the initial order
          totalValue: 0,
          isClosed: false,
          createdBy: logResponse.data.created_by || 'System'
        };
        
        setOrderLogs(prev => [basicLog, ...prev]);
        return logId;
      }
      
      // Update the state with the fresh data
      setOrderLogs(prev => [freshLog, ...prev]);
      return freshLog.id;
    } catch (err: any) {
      console.error("Failed to create order log:", err);
      throw err;
    }
  }

  const addOrderToLog = async (logId: string, orderId: string, notes?: string) => {
    try {
      console.log(`Adding order ${orderId} to log ${logId} with notes: ${notes || 'none'}`);
      
      // Ensure orderId is a string to fix the validation error
      const orderIdString = String(orderId);
      
      // Add retry logic for better reliability
      let response = null;
      let attempts = 0;
      const maxAttempts = 3;
      let lastError = null;
      
      while (!response && attempts < maxAttempts) {
        attempts++;
        console.log(`Attempt ${attempts}/${maxAttempts} to add order ${orderIdString} to log ${logId}`);
        
        try {
          // Try different approaches in order
          if (attempts === 1) {
            // First attempt: Use the new orderLogEntryApi
            response = await orderLogEntryApi.addOrderToLog({
              order_log_id: logId,
              order_id: orderIdString,
              notes: notes || ''
            });
          } else if (attempts === 2) {
            // Second attempt: Try the batch API with a single order
            response = await orderLogEntryApi.addMultipleOrdersToLog({
              order_log_id: logId,
              entries: [{
                order_id: orderIdString,
                notes: notes || ''
              }]
            });
          } else {
            // Third attempt: Fall back to updating the log directly
            response = await orderLogApi.update(logId, {
              action: 'addOrder',
              orderId: orderIdString,
              notes: notes || ''
            });
          }
          
          console.log(`Attempt ${attempts} response:`, response);
          
          if (!response || !response.data) {
            console.error(`Empty response on attempt ${attempts}`);
            response = null; // Force retry
            
            if (attempts < maxAttempts) {
              // Increase wait time between retries
              await new Promise(r => setTimeout(r, 500 * attempts));
            }
          }
        } catch (err) {
          lastError = err;
          console.error(`Error on attempt ${attempts}:`, err);
          
          if (attempts < maxAttempts) {
            // Increase wait time between retries
            await new Promise(r => setTimeout(r, 500 * attempts));
          }
        }
      }
      
      if (!response || !response.data) {
        throw new Error(`Failed to add order ${orderIdString} to log after ${maxAttempts} attempts: ${lastError ? String(lastError) : 'Unknown error'}`);
      }
      
      console.log('Add order to log API response:', response);
      console.log('Add order to log data:', response.data);

      // Wait a moment before fetching the updated log to ensure the server has processed the change
      await new Promise(r => setTimeout(r, 800));
      
      // Rather than manually processing the response, use getOrderLogById to get fresh data
      // This ensures consistent data structure and processing across all functions
      const freshLog = await getOrderLogById(logId);
      
      if (!freshLog) {
        console.error('Failed to get fresh log data after adding order');
        throw new Error('Failed to refresh log data after adding order');
      }
      
      console.log('Fresh log data after adding order:', freshLog);
      console.log('Orders in fresh log:', freshLog.orders?.length || 0);
      
      // Update the log in state with the fresh data
      const updatedLogs = orderLogs.map(log => 
        log.id === logId ? freshLog : log
      );
      
      setOrderLogs(updatedLogs);
      return freshLog;
    } catch (err: any) {
      console.error(`Error adding order ${orderId} to log ${logId}:`, err);
      throw err;
    }
  }

  const closeOrderDailyLog = async (logId: string) => {
    try {
      console.log(`Closing order log ${logId}`);
      
      const response = await orderLogApi.update(logId, { 
        action: 'close',
        // Don't send closedAt from client, let server handle it
      });
      console.log('Close order log response:', response.data);
      
      if (!response.data) {
        throw new Error('Failed to close log, empty response');
      }

      // Instead of processing the response directly, fetch the fresh data
      // This ensures we get all entries properly
      const freshLog = await getOrderLogById(logId);
      
      if (!freshLog) {
        console.error('Failed to get fresh log data after closing');
        
        // Fallback to basic processing if getOrderLogById fails
        const updatedLogData = response.data;
        
        // Create a basic closed log with minimal data
        const basicLog = {
          ...updatedLogData,
          id: updatedLogData.id,
          date: updatedLogData.log_date ? new Date(updatedLogData.log_date) : new Date(),
          closedAt: updatedLogData.closed_at ? new Date(updatedLogData.closed_at) : new Date(),
          isClosed: true,
          orders: [],
          totalOrders: updatedLogData.entries_count || 0,
          totalValue: 0,
          createdBy: updatedLogData.created_by || 'System'
        };
        
        // Update the log in state
        const updatedLogs = orderLogs.map(log => 
          log.id === logId ? basicLog : log
        );
        
        setOrderLogs(updatedLogs);
        
        // Show success toast
        toast.success(`Order daily log for ${basicLog.date.toLocaleDateString()} has been closed successfully`, {
          position: "top-right",
          autoClose: 3000
        });
        
        return basicLog;
      }
      
      // Ensure the log is marked as closed
      const closedLog = {
        ...freshLog,
        isClosed: true,
        closedAt: freshLog.closed_at ? new Date(freshLog.closed_at) : new Date()
      };
      
      // Update the log in state
      const updatedLogs = orderLogs.map(log => 
        log.id === logId ? closedLog : log
      );
      
      setOrderLogs(updatedLogs);
      
      // Show success toast
      toast.success(`Order daily log for ${closedLog.date.toLocaleDateString()} has been closed successfully`, {
        position: "top-right",
        autoClose: 3000
      });
      
      return closedLog;
    } catch (err: any) {
      console.error(`Error closing order log ${logId}:`, err);
      throw err;
    }
  }

  // Function to get a specific client log by ID with complete client data
  const getLogById = async (logId: string) => {
    try {
      console.log(`Fetching detailed data for client log ID: ${logId}`);
      const response = await clientLogApi.getById(logId);
      
      if (!response.data) {
        console.error('No data returned from client log API');
        return null;
      }
      
      console.log('Log detail response:', response.data);
      
      // Process the log data exactly as we do in the initial fetch
      const logData = response.data;
      
      // Calculate total clients
      let clientsCount = 0;
      
      // Ensure entries is always an array, even if it's null or undefined
      let entries = logData.entries || [];
      console.log('Log entries in getLogById:', entries);
      console.log('Original entries count:', entries.length);
      console.log('Entries count from API:', logData.entries_count);
      
      // Handle case where entries array might be empty but entries_count indicates clients exist
      if (entries.length === 0 && (logData.entries_count > 0 || logData.total_entries > 0)) {
        console.log('Entries array is empty but count indicates clients exist - creating placeholders');
        
        // Create placeholder entries for the number of clients
        const count = logData.entries_count || logData.total_entries || 0;
        entries = Array.from({ length: count }, (_, i) => ({
          id: `placeholder-detail-${logData.id}-${i}`,
          client_id: `unknown-${i}`,
          client_name: 'Unknown Client',
          client_email: '',
          added_at: new Date(),
          notes: 'Client data not fully loaded'
        }));
      }
      
      // Convert entries to our frontend format with additional data
      const clients = entries.map((entry: any) => {
        console.log('Processing client entry in getLogById:', entry);
        clientsCount++;
        
        // Make sure we extract all needed info from the entry
        const clientName = entry.client_name || 
          `${entry.first_name || ''} ${entry.last_name || ''}`.trim() ||
          'Unknown Client';
        
        return {
          id: entry.id || `temp-detail-${Date.now()}-${Math.random()}`,
          clientId: entry.client_id,
          clientName: clientName,
          clientEmail: entry.client_email || entry.email || '',
          addedAt: entry.added_at ? new Date(entry.added_at) : new Date(),
          notes: entry.notes || ''
        };
      });
      
      // Use entries_count from API response if available, or use our count
      const totalClients = logData.entries_count || clientsCount || logData.total_entries || 0;
      console.log('Total clients from API:', logData.entries_count);
      console.log('Clients processed count:', clientsCount);
      console.log('Final total clients in getLogById:', totalClients);
      
      // Format the log data
      const formattedLog = {
        ...logData,
        id: logData.id,
        date: logData.log_date ? new Date(logData.log_date) : new Date(),
        closedAt: logData.closed_at ? new Date(logData.closed_at) : undefined,
        isClosed: !!logData.closed_at,
        clients: clients,
        totalClients: totalClients,
        createdBy: logData.created_by || 'System'
      };
      
      console.log('Formatted log data in getLogById:', formattedLog);
      
      // Don't update the state here, just return the fresh log data
      return formattedLog;
    } catch (err) {
      console.error('Error fetching log by ID:', err);
      return null;
    }
  };
  
  // Function to get a specific order log by ID with complete order data
  const getOrderLogById = async (logId: string) => {
    try {
      console.log(`Fetching detailed data for order log ID: ${logId}`);
      const response = await orderLogApi.getById(logId);
      
      if (!response || !response.data) {
        console.error('No data returned from order log API');
        return null;
      }
      
      console.log('Order log detail API response:', response);
      console.log('Order log detail data:', response.data);
      
      // Process the log data
      const logData = response.data;
      
      // Calculate total value from the orders
      let totalValue = 0;
      let ordersCount = 0;
      
      // Check for entries in the response
      let entries = [];
      
      // Try to find entries in different possible locations in the API response
      if (Array.isArray(logData.entries)) {
        console.log('Found entries array in standard location');
        entries = logData.entries;
      } else if (logData.data && Array.isArray(logData.data.entries)) {
        console.log('Found entries array in data.entries');
        entries = logData.data.entries;
      } else if (Array.isArray(logData.orders)) {
        console.log('Found orders array instead of entries');
        entries = logData.orders.map((order: any) => ({
          id: `entry-${Date.now()}-${Math.random()}`,
          order_id: order.id,
          order: order
        }));
      } else {
        // If no entries are found in the log response, try to fetch them separately
        console.log('No entries found in log response, fetching separately');
        try {
          const entriesResponse = await orderLogEntryApi.getByLogId(logId);
          if (entriesResponse && entriesResponse.data && Array.isArray(entriesResponse.data)) {
            console.log('Successfully fetched entries separately:', entriesResponse.data);
            entries = entriesResponse.data;
          } else {
            console.warn('Failed to fetch entries separately, using empty array');
            entries = [];
          }
        } catch (entriesError) {
          console.error('Error fetching entries separately:', entriesError);
          entries = [];
        }
      }
      
      console.log('Order log entries in getOrderLogById:', entries);
      console.log('Original entries count:', entries.length);
      console.log('Entries count from API:', logData.entries_count || logData.orders_count || 'not provided');

      // If we have full orders objects, we need to extract entry data from them
      if (entries.length > 0) {
        // Check if we have nested order objects
        if (entries[0].order && typeof entries[0].order === 'object') {
          console.log('Entries contain full order objects, extracting order data');
          entries = entries.map((entry: any) => {
            const order = entry.order;
            return {
              id: entry.id || `entry-id-${Date.now()}-${Math.random()}`,
              order_id: order.id,
              order_number: order.order_number || `ORD-${order.id.substring(0, 8)}`,
              client_name: order.client_name || (order.client ? order.client.name : 'Unknown Client'),
              order_total: parseFloat(order.total) || 0,
              added_at: entry.added_at || entry.addedAt || new Date(),
              notes: entry.notes || ''
            };
          });
          console.log('Extracted order entries:', entries);
        }
        // Otherwise check if we need to fetch more data from the entries
        else {
          console.log('Entries exist but no nested order objects, checking structure...');
          // Make sure each entry has the required fields
          entries = entries.map((entry: any) => {
            return {
              id: entry.id || `entry-id-${Date.now()}-${Math.random()}`,
              order_id: entry.order_id || entry.orderId,
              order_number: entry.order_number || entry.orderNumber || `ORD-${(entry.order_id || entry.orderId || '').substring(0, 8)}`,
              client_name: entry.client_name || entry.clientName || 'Unknown Client',
              order_total: parseFloat(entry.order_total || entry.orderTotal) || 0,
              added_at: entry.added_at || entry.addedAt,
              notes: entry.notes || ''
            };
          });
          console.log('Normalized entries:', entries);
        }
      }
      
      // Handle case where entries array might be empty but entries_count indicates orders exist
      if (entries.length === 0 && (logData.entries_count > 0 || logData.total_orders > 0)) {
        console.log('Entries array is empty but count indicates orders exist - creating placeholders');
        
        // Create placeholder entries for the number of orders
        const count = logData.entries_count || logData.total_orders || 0;
        entries = Array.from({ length: count }, (_, i) => ({
          id: `placeholder-order-${logData.id}-${i}`,
          order_id: `unknown-${i}`,
          order_number: 'Unknown Order',
          client_name: 'Unknown Client',
          order_total: 0,
          added_at: new Date(),
          notes: 'Order data not fully loaded'
        }));
      }
      
      // Convert entries to our frontend format with additional data
      const orders = entries.map((entry: any) => {
        console.log('Processing order entry in getOrderLogById:', entry);
        ordersCount++;
        
        // Add order total to the log total
        if (entry.order_total) {
          totalValue += parseFloat(entry.order_total);
        }
        
        // Create a safe ID for the order
        const safeOrderId = entry.order_id || `unknown-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        
        return {
          id: entry.id || `temp-order-${Date.now()}-${Math.random()}`,
          orderId: safeOrderId,
          orderNumber: entry.order_number || `ORD-${safeOrderId.substring(0, 8)}`,
          clientName: entry.client_name || 'Unknown client',
          orderTotal: entry.order_total ? parseFloat(entry.order_total) : 0,
          addedAt: entry.added_at ? new Date(entry.added_at) : new Date(),
          notes: entry.notes || ''
        };
      });
      
      // Use entries_count from API response if available, or use our count
      const totalOrders = logData.entries_count || ordersCount || logData.total_orders || 0;
      console.log('Total orders from API:', logData.entries_count);
      console.log('Orders processed count:', ordersCount);
      console.log('Final total orders in getOrderLogById:', totalOrders);
      console.log('Total value calculated:', totalValue);
      
      // Format the log data
      const formattedLog = {
        ...logData,
        id: logData.id,
        date: logData.log_date ? new Date(logData.log_date) : new Date(),
        closedAt: logData.closed_at ? new Date(logData.closed_at) : undefined,
        isClosed: !!logData.closed_at,
        orders: orders,
        totalOrders: totalOrders,
        totalValue: totalValue,
        createdBy: logData.created_by || 'System'
      };
      
      console.log('Formatted order log data in getOrderLogById:', formattedLog);
      
      // Ensure we have valid orders array
      if (!Array.isArray(formattedLog.orders)) {
        formattedLog.orders = [];
      }
      
      // Don't update the state here, just return the fresh log data
      return formattedLog;
    } catch (err) {
      console.error('Error fetching order log by ID:', err);
      return null;
    }
  };

  // Function to manually refresh order logs
  const refreshOrderLogs = async () => {
    try {
      setLoading(true);
      console.log('Manually refreshing order logs...');
      
      const response = await orderLogApi.getAll();
      console.log('Refresh order logs response:', response);
      
      if (!response || !response.data) {
        throw new Error('Invalid response when refreshing order logs');
      }
      
      // Check if data is actually an array
      const logsToProcess = Array.isArray(response.data) ? response.data : 
                           (response.data.data && Array.isArray(response.data.data)) ? response.data.data : [];
      
      if (logsToProcess.length === 0) {
        console.warn('No logs found to refresh');
        return [];
      }
      
      // Now for each log, fetch detailed data with serial execution to prevent race conditions
      const refreshedLogs = [];
      
      for (const logData of logsToProcess) {
        try {
          console.log(`Refreshing detailed data for log ${logData.id}`);
          
          // Try up to 3 times to get the full log data with all orders
          let freshLog = null;
          let attempts = 0;
          const maxAttempts = 3;
          
          while (!freshLog && attempts < maxAttempts) {
            attempts++;
            console.log(`Attempt ${attempts}/${maxAttempts} to fetch log ${logData.id}`);
            
            try {
              // Get full log data
              freshLog = await getOrderLogById(logData.id);
              
              // Check if we got all expected orders
              if (freshLog) {
                const expectedCount = freshLog.totalOrders || 0;
                const actualCount = freshLog.orders?.length || 0;
                
                if (actualCount < expectedCount && attempts < maxAttempts) {
                  console.log(`Missing orders: expected ${expectedCount}, got ${actualCount}. Retrying...`);
                  freshLog = null; // Force retry
                  await new Promise(r => setTimeout(r, 500)); // Wait before retry
                } else {
                  console.log(`Log ${logData.id} has ${actualCount}/${expectedCount} orders after ${attempts} attempt(s)`);
                }
              }
            } catch (fetchErr) {
              console.error(`Error in attempt ${attempts} for log ${logData.id}:`, fetchErr);
              await new Promise(r => setTimeout(r, 500)); // Wait before retry
            }
          }
          
          if (freshLog) {
            console.log(`Successfully refreshed log ${logData.id} with ${freshLog.orders?.length || 0} orders`);
            refreshedLogs.push(freshLog);
          } else {
            console.error(`Failed to refresh log ${logData.id} after ${maxAttempts} attempts`);
          }
        } catch (err) {
          console.error(`Error refreshing log ${logData.id}:`, err);
        }
        
        // Add a delay between log fetches to prevent race conditions
        await new Promise(r => setTimeout(r, 300));
      }
      
      console.log(`Successfully refreshed ${refreshedLogs.length} of ${logsToProcess.length} logs`);
      
      // Update the state with refreshed logs
      setOrderLogs(refreshedLogs);
      return refreshedLogs;
    } catch (err) {
      console.error('Error refreshing order logs:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Function to add multiple orders to a log at once
  const addMultipleOrdersToLog = async (logId: string, orderIds: string[], notes: string[] = []) => {
    try {
      console.log(`Adding ${orderIds.length} orders to log ${logId}`);
      
      // Track successfully added orders to avoid duplicates
      const addedOrderIds = new Set<string>();
      
      try {
        // First try: Use the batch API endpoint
        console.log('Attempting batch add with orderLogEntryApi.addMultipleOrdersToLog');
        
        // Prepare entries array with order IDs and notes
        const entries = orderIds.map((id, index) => ({
          order_id: String(id),
          notes: notes[index] || ''
        }));
        
        const response = await orderLogEntryApi.addMultipleOrdersToLog({
          order_log_id: logId,
          entries: entries
        });
        
        console.log('Batch add response:', response);
        
        if (!response || !response.data) {
          throw new Error('Empty response from batch add');
        }
        
        // Mark all orders as added if batch was successful
        orderIds.forEach(id => addedOrderIds.add(String(id)));
        console.log('All orders added successfully via batch add');
      } catch (batchError) {
        console.error('Batch add failed:', batchError);
        console.log('Falling back to adding orders one by one');
        
        // Add each order individually with a delay between requests
        for (let i = 0; i < orderIds.length; i++) {
          const orderId = String(orderIds[i]);
          
          // Skip if already added in a previous step
          if (addedOrderIds.has(orderId)) {
            console.log(`Order ${i+1}/${orderIds.length}: ${orderId} already added, skipping`);
            continue;
          }
          
          const note = notes[i] || '';
          console.log(`Adding order ${i+1}/${orderIds.length}: ${orderId}`);
          
          // Add a delay between requests to prevent race conditions
          if (i > 0) {
            await new Promise(r => setTimeout(r, 1000));
          }
          
          try {
            await addOrderToLog(logId, orderId, note);
            console.log(`Successfully added order ${i+1}`);
            addedOrderIds.add(orderId);
          } catch (singleError) {
            console.error(`Error adding order ${orderId}:`, singleError);
            // Continue with next order even if this one fails
          }
        }
      }
      
      // Check if we managed to add any orders
      if (addedOrderIds.size === 0) {
        throw new Error('Failed to add any orders to the log');
      }
      
      // Wait a moment before fetching the updated log
      await new Promise(r => setTimeout(r, 1000));
      
      // Get the fresh log data
      const freshLog = await getOrderLogById(logId);
      
      if (!freshLog) {
        console.error('Failed to get fresh log data after adding orders');
        throw new Error('Failed to refresh log data after adding orders');
      }
      
      console.log('Fresh log data after adding orders:', freshLog);
      console.log('Orders in fresh log:', freshLog.orders?.length || 0);
      console.log('Successfully added orders:', addedOrderIds.size);
      
      // Update the log in state with the fresh data
      const updatedLogs = orderLogs.map(log => 
        log.id === logId ? freshLog : log
      );
      
      setOrderLogs(updatedLogs);
      return freshLog;
    } catch (err) {
      console.error(`Error adding multiple orders to log ${logId}:`, err);
      throw err;
    }
  };

  return (
    <DailyLogsContext.Provider
      value={{
        clientLogs,
        orderLogs,
        loading,
        error,
        createClientDailyLog,
        addClientToLog,
        closeClientDailyLog,
        createOrderDailyLog,
        addOrderToLog,
        closeOrderDailyLog,
        getLogById,
        getOrderLogById,
        refreshOrderLogs,
        addMultipleOrdersToLog,
      }}
    >
      {children}
    </DailyLogsContext.Provider>
  )
}

export function useDailyLogs() {
  const context = useContext(DailyLogsContext)
  if (context === undefined) {
    throw new Error("useDailyLogs must be used within a DailyLogsProvider")
  }
  return context
}

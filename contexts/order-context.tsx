"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Order, OrderContextType } from "@/lib/order-types"
import { orderApi } from "@/lib/api"

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Load all orders on mount
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await orderApi.getAll()
        
        // Transform backend data to frontend format
        const transformedOrders = (response.data || []).map((order: any) => ({
          id: order.id,
          orderNumber: order.order_number || `ORD-${order.id.substring(0, 8)}`,
          client: {
            id: order.client_id,
            name: order.client_name || 'Unknown Client',
            email: order.client_email || '',
            address: order.client_address || '',
            phoneNumber: order.client_phone || ''
          },
          items: (order.items || []).map((item: any) => ({
            id: item.id,
            product: {
              id: item.product_id,
              name: item.product_name || 'Unknown Product',
              description: item.product_description || '',
              sellPrice: parseFloat(item.unit_price) || 0
            },
            quantity: parseInt(item.quantity) || 0,
            unitPrice: parseFloat(item.unit_price) || 0,
            total: parseFloat(item.total) || 0
          })),
          subtotal: parseFloat(order.total) || 0,
          total: parseFloat(order.total) || 0,
          status: order.status || 'pending',
          orderDate: new Date(order.order_date),
          expectedDelivery: order.expected_delivery ? new Date(order.expected_delivery) : new Date(),
          notes: order.notes || ''
        }));
        
        setOrders(transformedOrders)
      } catch (err: any) {
        console.error("Failed to fetch orders:", err)
        setError(err.message || "Failed to fetch orders")
        // Set empty array to avoid undefined errors
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchOrders()
  }, [])

  const addOrder = async (orderData: any) => {
    try {
      // Transform the data if it's in frontend format
      const apiOrderData = orderData.client_id ? orderData : {
        client_id: orderData.client.id,
        order_date: orderData.order_date || new Date().toISOString().split('T')[0],
        expected_delivery: orderData.expectedDelivery,
        status: orderData.status || 'pending',
        notes: orderData.notes,
        shipping_address: orderData.client.address,
        items: orderData.items.map((item: any) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unitPrice
        }))
      };
      
      const response = await orderApi.create(apiOrderData)
      
      // Transform backend data to frontend format
      const newOrder = {
        id: response.data.id,
        orderNumber: response.data.order_number || `ORD-${response.data.id.substring(0, 8)}`,
        client: {
          id: response.data.client_id,
          name: response.data.client_name || 'Unknown Client',
          email: response.data.client_email || '',
          address: response.data.client_address || '',
          phoneNumber: response.data.client_phone || ''
        },
        items: (response.data.items || []).map((item: any) => ({
          id: item.id,
          product: {
            id: item.product_id,
            name: item.product_name || 'Unknown Product',
            description: item.product_description || '',
            sellPrice: parseFloat(item.unit_price) || 0
          },
          quantity: parseInt(item.quantity) || 0,
          unitPrice: parseFloat(item.unit_price) || 0,
          total: parseFloat(item.total) || 0
        })),
        subtotal: parseFloat(response.data.total) || 0,
        total: parseFloat(response.data.total) || 0,
        status: response.data.status || 'pending',
        orderDate: new Date(response.data.order_date),
        expectedDelivery: response.data.expected_delivery ? new Date(response.data.expected_delivery) : new Date(),
        notes: response.data.notes || ''
      }
      
      setOrders((prev) => [...prev, newOrder])
      return newOrder
    } catch (err: any) {
      console.error("Failed to add order:", err)
      throw err
    }
  }

  const updateOrder = async (id: string, orderData: any) => {
    try {
      // Transform the data if it's in frontend format
      const apiOrderData = orderData.client_id ? orderData : {
        client_id: orderData.client.id,
        order_date: orderData.order_date || new Date().toISOString().split('T')[0],
        expected_delivery: orderData.expectedDelivery,
        status: orderData.status || 'pending',
        notes: orderData.notes,
        shipping_address: orderData.client.address,
        items: orderData.items.map((item: any) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unitPrice
        }))
      };
      
      const response = await orderApi.update(id, apiOrderData)
      
      // Transform backend data to frontend format
      const updatedOrder = {
        id: response.data.id,
        orderNumber: response.data.order_number || `ORD-${response.data.id.substring(0, 8)}`,
        client: {
          id: response.data.client_id,
          name: response.data.client_name || 'Unknown Client',
          email: response.data.client_email || '',
          address: response.data.client_address || '',
          phoneNumber: response.data.client_phone || ''
        },
        items: (response.data.items || []).map((item: any) => ({
          id: item.id,
          product: {
            id: item.product_id,
            name: item.product_name || 'Unknown Product',
            description: item.product_description || '',
            sellPrice: parseFloat(item.unit_price) || 0
          },
          quantity: parseInt(item.quantity) || 0,
          unitPrice: parseFloat(item.unit_price) || 0,
          total: parseFloat(item.total) || 0
        })),
        subtotal: parseFloat(response.data.total) || 0,
        total: parseFloat(response.data.total) || 0,
        status: response.data.status || 'pending',
        orderDate: new Date(response.data.order_date),
        expectedDelivery: response.data.expected_delivery ? new Date(response.data.expected_delivery) : new Date(),
        notes: response.data.notes || ''
      }
      
      setOrders((prev) =>
        prev.map((order) => (order.id === id ? updatedOrder : order)),
      )
      return updatedOrder
    } catch (err: any) {
      console.error("Failed to update order:", err)
      throw err
    }
  }

  const deleteOrder = async (id: string) => {
    try {
      await orderApi.delete(id)
      setOrders((prev) => prev.filter((order) => order.id !== id))
    } catch (err: any) {
      console.error("Failed to delete order:", err)
      throw err
    }
  }

  const updateOrderStatus = async (id: string, status: Order["status"]) => {
    try {
      const response = await orderApi.updateStatus(id, status)
      
      // Find the existing order
      const existingOrder = orders.find(order => order.id === id)
      
      if (!existingOrder) {
        throw new Error(`Order with ID ${id} not found`)
      }
      
      // Transform backend data to frontend format
      const updatedOrder = {
        ...existingOrder,
        status: response.data.status || 'pending',
        orderDate: new Date(response.data.order_date),
        expectedDelivery: response.data.expected_delivery ? new Date(response.data.expected_delivery) : existingOrder.expectedDelivery
      }
      
      setOrders((prev) => prev.map((order) => (order.id === id ? updatedOrder : order)))
      return updatedOrder
    } catch (err: any) {
      console.error("Failed to update order status:", err)
      throw err
    }
  }

  return (
    <OrderContext.Provider
      value={{
        orders,
        loading,
        error,
        addOrder,
        updateOrder,
        deleteOrder,
        updateOrderStatus,
      }}
    >
      {children}
    </OrderContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrderProvider")
  }
  return context
}

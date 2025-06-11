"use client"

// Simplified toast implementation
import { useState, useEffect } from "react"

type ToastProps = {
  title: string
  description?: string
  duration?: number
}

// Create a simple toast state
let toastQueue: ToastProps[] = []
let listeners: Function[] = []

export function toast(props: ToastProps) {
  toastQueue.push(props)
  listeners.forEach((listener) => listener(toastQueue))

  // Auto-remove after duration
  setTimeout(() => {
    toastQueue = toastQueue.filter((t) => t !== props)
    listeners.forEach((listener) => listener(toastQueue))
  }, props.duration || 3000)
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>(toastQueue)

  useEffect(() => {
    const handleToastChange = (newToasts: ToastProps[]) => {
      setToasts([...newToasts])
    }

    listeners.push(handleToastChange)
    return () => {
      listeners = listeners.filter((l) => l !== handleToastChange)
    }
  }, [])

  return {
    toasts,
    toast,
  }
}

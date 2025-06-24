"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label as RadixLabel } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle as RadixDialogTitle, DialogTrigger as RadixDialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { Provider } from "@/lib/types"

// Type-cast components to fix type errors
const DialogTrigger = RadixDialogTrigger as any;
const DialogTitle = RadixDialogTitle as any;
const Label = RadixLabel as any;

interface ProviderFormProps {
  provider?: Provider
  onSubmit: (data: Omit<Provider, "id" | "createdAt">) => void
  trigger: React.ReactNode
}

export function ProviderForm({ provider, onSubmit, trigger }: ProviderFormProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: provider?.name || "",
    email: provider?.email || "",
    address: provider?.address || "",
    phoneNumber: provider?.phoneNumber || "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      const result = await onSubmit(formData)
      
      // If result is null, it means there was a duplicate error but it was handled with a toast
      // In this case, keep the dialog open so the user can correct the email
      if (result !== null) {
        setOpen(false)
        if (!provider) {
          setFormData({ name: "", email: "", address: "", phoneNumber: "" })
        }
      }
    } catch (error: any) {
      // Show error in the form
      console.log("Form submission error:", error)
      setError(error.message || "An error occurred while saving the provider.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) {
        // Reset form state when dialog is closed
        setError(null)
        if (!provider) {
          setFormData({ name: "", email: "", address: "", phoneNumber: "" })
        }
      }
    }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{provider ? "Edit Provider" : "Add New Provider"}</DialogTitle>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isSubmitting}
              className={error && error.includes("email") ? "border-red-500" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : provider ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label as RadixLabel } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle as RadixDialogTitle, DialogTrigger as RadixDialogTrigger } from "@/components/ui/dialog"
import type { ProfessionalDomain } from "@/lib/types"

// Type-cast components to fix type errors
const DialogTrigger = RadixDialogTrigger as any;
const DialogTitle = RadixDialogTitle as any;
const Label = RadixLabel as any;

interface ProfessionalDomainFormProps {
  domain?: ProfessionalDomain
  onSubmit: (data: Omit<ProfessionalDomain, "id">) => void
  trigger: React.ReactNode
  isAdmin: boolean
}

export function ProfessionalDomainForm({ domain, onSubmit, trigger, isAdmin }: ProfessionalDomainFormProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: domain?.name || "",
    paymentCode: domain?.paymentCode || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setOpen(false)
    if (!domain) {
      setFormData({ name: "", paymentCode: "" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{domain ? "Edit Professional Domain" : "Add New Professional Domain"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Domain Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Technology, Healthcare, Finance"
            />
          </div>

          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="paymentCode">Payment Code (Admin Only)</Label>
              <Input
                id="paymentCode"
                value={formData.paymentCode}
                onChange={(e) => setFormData({ ...formData, paymentCode: e.target.value })}
                placeholder="Enter payment code"
                className="bg-purple-50 border-purple-200"
              />
              <p className="text-xs text-purple-600">This field is only visible to administrators</p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{domain ? "Update" : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

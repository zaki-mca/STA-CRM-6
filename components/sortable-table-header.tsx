"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { TableHead } from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

interface SortableTableHeaderProps {
  children: React.ReactNode
  sortKey: string
  currentSort: { key: string; direction: "asc" | "desc" } | null
  onSort: (key: string) => void
  className?: string
}

export function SortableTableHeader({ children, sortKey, currentSort, onSort, className }: SortableTableHeaderProps) {
  const getSortIcon = () => {
    if (currentSort?.key !== sortKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return currentSort.direction === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  return (
    <TableHead className={className}>
      <Button variant="ghost" onClick={() => onSort(sortKey)} className="h-auto p-0 font-medium hover:bg-transparent">
        {children}
        {getSortIcon()}
      </Button>
    </TableHead>
  )
}

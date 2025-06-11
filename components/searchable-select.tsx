"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger as RadixPopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Type-cast component to fix type error
const PopoverTrigger = RadixPopoverTrigger as any;

interface SearchableSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: Array<{
    value: string
    label: string
    price?: number
    category?: string
    brand?: string
    description?: string
    email?: string
    domain?: string
  }>
  placeholder: string
  searchPlaceholder: string
  className?: string
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const selectedOption = options.find((option) => option.value === value)

  // Filter options based on search value
  const filteredOptions = options.filter((option) => {
    const searchLower = searchValue.toLowerCase()
    return (
      option.label.toLowerCase().includes(searchLower) ||
      (option.category && option.category.toLowerCase().includes(searchLower)) ||
      (option.brand && option.brand.toLowerCase().includes(searchLower)) ||
      (option.description && option.description.toLowerCase().includes(searchLower)) ||
      (option.email && option.email.toLowerCase().includes(searchLower)) ||
      (option.domain && option.domain.toLowerCase().includes(searchLower))
    )
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder={searchPlaceholder} value={searchValue} onValueChange={setSearchValue} />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                    setSearchValue("")
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {option.category && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{option.category}</span>
                      )}
                      {option.brand && <span className="bg-blue-100 px-2 py-0.5 rounded text-xs">{option.brand}</span>}
                      {option.email && <span className="text-blue-600">{option.email}</span>}
                      {option.domain && (
                        <span className="bg-green-100 px-2 py-0.5 rounded text-xs">{option.domain}</span>
                      )}
                      {option.price !== undefined && typeof option.price === 'number' && (
                        <span className="font-medium text-green-600">${option.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

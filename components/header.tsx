"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { MobileNav } from "@/components/mobile-nav"
import { useAuth } from "@/contexts/auth-context"
import { useCRM } from "@/contexts/crm-context"
import { Search, Bell, Settings, User, LogOut, Shield, Menu, RefreshCw } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import NetworkStatus from "@/components/NetworkStatus"

interface HeaderProps {
  onSearch?: (query: string) => void
  searchPlaceholder?: string
}

export function Header({ onSearch, searchPlaceholder = "Search across all data..." }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAdmin] = useState(true) // Simplified admin check
  const { user, logout } = useAuth()
  const { refreshData, loading } = useCRM()

  // Create type-safe components
  const TypeSafeSheetTrigger = SheetTrigger as any;
  const TypeSafeTooltipTrigger = TooltipTrigger as any;
  const TypeSafeDropdownMenuTrigger = DropdownMenuTrigger as any;
  const TypeSafeDropdownMenuItem = DropdownMenuItem as any;
  const TypeSafeAvatar = Avatar as any;
  const TypeSafeAvatarFallback = AvatarFallback as any;

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  const handleRefresh = () => {
    refreshData()
  }

  return (
    <header className="bg-card border-b border-border px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile Menu and Logo */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu */}
          <Sheet>
            <TypeSafeSheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </TypeSafeSheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <MobileNav />
            </SheetContent>
          </Sheet>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">CRM</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-foreground">🇩🇿 Algeria CRM</h1>
              <p className="text-xs text-muted-foreground">Professional Business Management</p>
            </div>
          </div>
          {isAdmin && (
            <Badge variant="secondary" className="hidden sm:flex">
              <Shield className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          )}
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-4 sm:mx-8 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 bg-background border-input"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Network Status */}
          <TooltipProvider>
            <Tooltip>
              <TypeSafeTooltipTrigger asChild>
                <div className="hidden sm:flex">
                  <NetworkStatus />
                </div>
              </TypeSafeTooltipTrigger>
              <TooltipContent>
                Network connection status
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Refresh Button */}
          <TooltipProvider>
            <Tooltip>
              <TypeSafeTooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRefresh} 
                  disabled={loading}
                  className={loading ? "animate-spin" : ""}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TypeSafeTooltipTrigger>
              <TooltipContent>
                {loading ? 'Refreshing data...' : 'Refresh data'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Mobile Search */}
          <Button variant="ghost" size="sm" className="md:hidden">
            <Search className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative hidden sm:flex">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Settings */}
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Settings className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <TypeSafeDropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <TypeSafeAvatar className="h-8 w-8">
                  <TypeSafeAvatarFallback>{user?.name?.charAt(0) || "U"}</TypeSafeAvatarFallback>
                </TypeSafeAvatar>
              </Button>
            </TypeSafeDropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user?.name || "User"}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">{user?.email || "user@company.dz"}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <TypeSafeDropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </TypeSafeDropdownMenuItem>
              <TypeSafeDropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </TypeSafeDropdownMenuItem>
              <DropdownMenuSeparator />
              <TypeSafeDropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </TypeSafeDropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

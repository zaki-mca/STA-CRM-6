"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Package, FileText, Truck, Settings, ShoppingCart, Briefcase, Tag, BookmarkIcon } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, color: "text-blue-500" },
  { name: "Providers", href: "/providers", icon: Truck, color: "text-green-500" },
  { name: "Clients", href: "/clients", icon: Users, color: "text-purple-500" },
  { name: "Products", href: "/products", icon: Package, color: "text-amber-500" },
  { name: "Categories", href: "/categories", icon: Tag, color: "text-pink-500" },
  { name: "Brands", href: "/brands", icon: BookmarkIcon, color: "text-teal-500" },
  { name: "Orders", href: "/orders", icon: ShoppingCart, color: "text-indigo-500" },
  { name: "Invoices", href: "/invoices", icon: FileText, color: "text-rose-500" },
  { name: "Professional Domains", href: "/professional-domains", icon: Briefcase, color: "text-cyan-500" },
  { name: "Client Daily Logs", href: "/client-daily-logs", icon: Users, color: "text-violet-500" },
  { name: "Order Daily Logs", href: "/order-daily-logs", icon: ShoppingCart, color: "text-orange-500" },
  { name: "Settings", href: "/settings", icon: Settings, color: "text-gray-500" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r border-border">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">🇩🇿 CRM System</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className={`mr-3 h-5 w-5 ${item.color}`} />
              <span className="hidden sm:block">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

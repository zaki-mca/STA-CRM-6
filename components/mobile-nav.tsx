"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Package, FileText, Truck, Settings, ShoppingCart, Briefcase } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Providers", href: "/providers", icon: Truck },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Products", href: "/products", icon: Package },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Professional Domains", href: "/professional-domains", icon: Briefcase },
  { name: "Client Daily Logs", href: "/client-daily-logs", icon: Users },
  { name: "Order Daily Logs", href: "/order-daily-logs", icon: ShoppingCart },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-full flex-col bg-card">
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
              <Icon className="mr-3 h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

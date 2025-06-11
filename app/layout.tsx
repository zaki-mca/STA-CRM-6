import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { CRMProvider } from "@/contexts/crm-context"
import { OrderProvider } from "@/contexts/order-context"
import { DailyLogsProvider } from "@/contexts/daily-logs-context"
import { ToastProvider } from "@/components/ui/toast"
import { ThemeProvider } from "@/components/theme-provider"
import { AppContent } from "@/components/app-content"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CRM System",
  description: "Complete CRM system for managing products, clients, providers and invoices",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider defaultTheme="system">
          <AuthProvider>
            <CRMProvider>
              <OrderProvider>
                <DailyLogsProvider>
                  <ToastProvider>
                    <AppContent>{children}</AppContent>
                  </ToastProvider>
                </DailyLogsProvider>
              </OrderProvider>
            </CRMProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

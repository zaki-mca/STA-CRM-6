"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">Access Denied</h1>
        <p className="text-lg text-muted-foreground">
          You don't have permission to access this page.
        </p>
        <div className="space-x-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
          >
            Go Back
          </Button>
          <Button
            onClick={() => router.push("/")}
          >
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  )
} 
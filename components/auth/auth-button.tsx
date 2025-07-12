"use client"

import { Button } from "@/components/ui/button"
import { UserRound } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function AuthButton() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center gap-2" disabled>
            <UserRound className="h-4 w-4" />
            <span className="hidden md:inline">Offline</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Supabase integration is temporarily disabled. Working in offline mode only.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

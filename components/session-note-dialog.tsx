"use client"

import { DialogFooter } from "@/components/ui/dialog"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { X, Clock } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandGroup, CommandItem } from "@/components/ui/command"
import { useLocalStorage } from "@/lib/use-local-storage"
import * as DialogPrimitive from "@radix-ui/react-dialog"

interface SessionNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (note: string, tags: string[], autoStartRest: boolean) => void
}

export default function SessionNoteDialog({ open, onOpenChange, onSubmit }: SessionNoteDialogProps) {
  const [note, setNote] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [autoStartRest, setAutoStartRest] = useState(true)
  const [idleTimer, setIdleTimer] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(60) // 60 seconds = 1 minute
  const [isIdle, setIsIdle] = useState(false)
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)

  // Get previously used tags from local storage
  const [previousTags, setPreviousTags] = useLocalStorage<string[]>("pomofit-previous-tags", [])

  // Refs for tracking user activity
  const lastActivityTime = useRef(Date.now())
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  // Reset idle timer when dialog opens
  useEffect(() => {
    if (open) {
      resetIdleTimer()
      setTimeLeft(60)
      setIsIdle(false)

      // Start countdown timer
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
      }

      countdownRef.current = setInterval(() => {
        const timeSinceLastActivity = Math.floor((Date.now() - lastActivityTime.current) / 1000)
        const newTimeLeft = Math.max(0, 60 - timeSinceLastActivity)

        setTimeLeft(newTimeLeft)

        if (newTimeLeft === 0 && !isIdle) {
          setIsIdle(true)
          handleSkip()
        }
      }, 1000)
    } else {
      // Clear timers when dialog closes
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }

      // Reset state
      setNote("")
      setTags([])
      setTagInput("")
      setTimeLeft(60)
      setIsIdle(false)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [open])

  // Track user activity
  const resetIdleTimer = () => {
    lastActivityTime.current = Date.now()
    setIsIdle(false)

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }

  // Event handlers for user activity
  const handleActivity = () => {
    resetIdleTimer()
  }

  // Update the handleAddTag function to support comma-separated tags
  const handleAddTag = () => {
    if (tagInput.trim()) {
      // Split by comma to support multiple tags at once
      const newTags = tagInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "")

      // Filter out duplicates and add new tags
      const uniqueNewTags = newTags.filter((tag) => !tags.includes(tag))
      if (uniqueNewTags.length > 0) {
        setTags([...tags, ...uniqueNewTags])

        // Add to previous tags if not already there
        const tagsToAdd = uniqueNewTags.filter((tag) => !previousTags.includes(tag))
        if (tagsToAdd.length > 0) {
          setPreviousTags([...tagsToAdd, ...previousTags.slice(0, 20 - tagsToAdd.length)]) // Keep only the 20 most recent tags
        }
      }

      setTagInput("")
    }
    setShowTagSuggestions(false)
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  // Add keyboard event handlers for Cmd+Enter and Esc
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Enter key for tag input
    if (e.target === document.getElementById("tags") && e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }

    // Handle Cmd+Enter to save
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      handleSubmit()
    }

    // Handle Esc to skip
    if (e.key === "Escape") {
      e.preventDefault()
      handleSkip()
    }

    // Handle comma for tag input to add multiple tags
    if (e.target === document.getElementById("tags") && e.key === ",") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = () => {
    onSubmit(note, tags, autoStartRest)

    // Update previous tags
    const uniqueTags = [...new Set([...tags, ...previousTags])].slice(0, 20)
    setPreviousTags(uniqueTags)

    setNote("")
    setTags([])
  }

  const handleSkip = () => {
    onSubmit("", [], autoStartRest)
    setNote("")
    setTags([])
  }

  const handleSelectTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag])
    }
    setTagInput("")
    setShowTagSuggestions(false)
  }

  // Get tag suggestions - filter out already selected tags
  const tagSuggestions = previousTags
    .filter((tag) => !tags.includes(tag))
    .filter((tag) => tag.toLowerCase().includes(tagInput.toLowerCase()))
    .slice(0, 5)

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        onMouseMove={handleActivity}
        onKeyDown={(e) => {
          handleActivity()
          handleKeyDown(e)
        }}
        onClick={handleActivity}
      >
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Session Completed</DialogTitle>
            {timeLeft < 30 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Auto-close in {formatTime(timeLeft)}
              </Badge>
            )}
          </div>
          <DialogDescription>Add notes and tags to track your productivity session.</DialogDescription>
        </DialogHeader>
        {/* Update the close button */}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="note">Session Notes</Label>
            <Textarea
              id="note"
              placeholder="What did you accomplish?"
              value={note}
              onChange={(e) => {
                setNote(e.target.value)
                handleActivity()
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="relative">
              <div className="flex gap-2">
                <Popover open={showTagSuggestions && tagSuggestions.length > 0} onOpenChange={setShowTagSuggestions}>
                  <PopoverTrigger asChild>
                    <Input
                      id="tags"
                      placeholder="Add tags (e.g., work, study)"
                      value={tagInput}
                      onChange={(e) => {
                        setTagInput(e.target.value)
                        handleActivity()
                        if (e.target.value) {
                          setShowTagSuggestions(true)
                        } else {
                          setShowTagSuggestions(false)
                        }
                      }}
                      onFocus={() => {
                        if (previousTags.length > 0) {
                          setShowTagSuggestions(true)
                        }
                      }}
                      onKeyDown={handleKeyDown}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[200px]" align="start">
                    <Command>
                      <CommandGroup heading="Recent Tags">
                        {tagSuggestions.map((tag) => (
                          <CommandItem key={tag} onSelect={() => handleSelectTag(tag)} className="cursor-pointer">
                            {tag}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button type="button" onClick={handleAddTag} variant="secondary">
                  Add
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Switch id="auto-start-rest" checked={autoStartRest} onCheckedChange={setAutoStartRest} />
            <Label htmlFor="auto-start-rest">Automatically start rest session</Label>
          </div>
        </div>
        {/* Update the skip and save buttons */}
        <DialogFooter>
          <Button variant="outline" onClick={handleSkip} aria-label="Skip adding notes">
            Skip
          </Button>
          <Button onClick={handleSubmit} aria-label="Save notes">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

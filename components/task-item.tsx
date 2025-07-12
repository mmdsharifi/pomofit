"use client"
import { Button } from "@/components/ui/button"
import type React from "react"

import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Check, GripVertical, Play, Trash2, Edit } from "lucide-react"
import type { Task } from "@/types/task"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { forwardRef } from "react"
import { Badge } from "@/components/ui/badge"

interface TaskItemProps {
  task: Task
  onToggle: () => void
  onDelete: () => void
  onPlay: () => void
  onEdit: () => void
  isFocused?: boolean
  searchQuery?: string
}

export const TaskItem = forwardRef<HTMLDivElement, TaskItemProps>(
  ({ task, onToggle, onDelete, onPlay, onEdit, isFocused = false, searchQuery = "" }, ref) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    // Combine the refs
    const setRefs = (element: HTMLDivElement) => {
      setNodeRef(element)
      if (typeof ref === "function") {
        ref(element)
      } else if (ref) {
        ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = element
      }
    }

    // Function to highlight search matches
    const highlightMatch = (text: string, query: string) => {
      if (!query.trim()) return text

      const normalizedQuery = query.toLowerCase().trim()
      if (!text.toLowerCase().includes(normalizedQuery)) return text

      const parts = text.split(new RegExp(`(${normalizedQuery})`, "gi"))

      return parts.map((part, i) =>
        part.toLowerCase() === normalizedQuery ? (
          <span key={i} className="bg-yellow-200 dark:bg-yellow-800">
            {part}
          </span>
        ) : (
          part
        ),
      )
    }

    // Handle keyboard events directly in the component
    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Handle spacebar to toggle task completion
      if (e.key === " " || e.code === "Space") {
        e.preventDefault()
        onToggle()
        return
      }

      // Handle Enter to start the task
      if (e.key === "Enter") {
        e.preventDefault()
        onPlay()
        return
      }

      // Handle E to edit
      if (e.key.toLowerCase() === "e") {
        e.preventDefault()
        onEdit()
        return
      }

      // Handle D to delete
      if (e.key.toLowerCase() === "d") {
        e.preventDefault()
        onDelete()
        return
      }
    }

    return (
      <TooltipProvider>
        <div
          ref={setRefs}
          style={style}
          className={cn(
            "group flex items-center gap-3 rounded-lg border bg-card p-3 text-card-foreground shadow-sm transition-colors hover:bg-accent cursor-pointer",
            isDragging && "opacity-50",
            isFocused && "ring-2 ring-primary ring-offset-2 bg-accent",
            task.completed && "bg-muted/50",
          )}
          onClick={(e) => {
            // Only trigger edit if not clicking on a button
            if (!(e.target as HTMLElement).closest("button")) {
              onEdit()
            }
          }}
          tabIndex={0}
          role="button"
          aria-pressed={isFocused}
          onKeyDown={handleKeyDown}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 rounded-full p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggle()
                }}
                aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
              >
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border-2",
                    task.completed ? "border-primary bg-primary text-primary-foreground" : "border-primary",
                  )}
                >
                  {task.completed && <Check className="h-3 w-3" />}
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mark as {task.completed ? "incomplete" : "complete"} (Space)</TooltipContent>
          </Tooltip>

          {!task.completed && (
            <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">{task.order}.</code>
          )}

          <div className="flex-1 flex items-center gap-2">
            <span className={cn("text-sm", task.completed && "text-muted-foreground line-through")}>
              {searchQuery ? highlightMatch(task.title, searchQuery) : task.title}
            </span>

            {/* Only display Pomodoro count if it's explicitly greater than 0 */}
            {typeof task.pomodoros === "number" && task.pomodoros > 0 ? (
              <Badge
                variant="outline"
                className="text-xs px-1.5 py-0 bg-gray-200 text-gray-600 border-gray-300 font-mono dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600"
              >
                {task.pomodoros}
              </Badge>
            ) : null}
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 group-focus:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  aria-label="Edit task"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit task (E)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onPlay()
                  }}
                  aria-label="Start timer with this task"
                >
                  <Play className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Start timer (Enter)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 group-focus:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  aria-label="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete task (D)</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    )
  },
)

TaskItem.displayName = "TaskItem"

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JournalEntry } from "@/app/journal/journal-client";

interface JournalHistoryProps {
  journals: JournalEntry[];
  onEntrySelect: (entry: JournalEntry) => void;
  onEntryDelete: (id: string) => void;
  selectedEntry: JournalEntry | null;
  onCreateJournal?: () => void;
}

export function JournalHistory({
  journals,
  onEntrySelect,
  onEntryDelete,
  selectedEntry,
  onCreateJournal,
}: JournalHistoryProps) {
  const sortedJournals = [...journals].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <Card className="h-[400px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Journals</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 h-6 w-6 p-0"
            title="New Journal Entry"
            onClick={onCreateJournal}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-4">
          {sortedJournals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No custom journals yet</p>
              <p className="text-xs">
                Create a new journal entry to get started
              </p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {sortedJournals.map((journal) => (
                <div
                  key={journal.id}
                  className={cn(
                    "group p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent",
                    selectedEntry?.id === journal.id &&
                      "bg-accent border-primary"
                  )}
                  onClick={() => onEntrySelect(journal)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {journal.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(journal.updatedAt)}
                      </p>
                      {journal.content && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {truncateContent(journal.content)}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEntryDelete(journal.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

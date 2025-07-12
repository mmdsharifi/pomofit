import dynamic from "next/dynamic"

const JournalClient = dynamic(() => import("./journal-client"), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading journal...</p>
      </div>
    </div>
  ),
})

export function JournalWrapper() {
  return <JournalClient />
}

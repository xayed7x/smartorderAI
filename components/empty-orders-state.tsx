import { Inbox } from "lucide-react"

export function EmptyOrdersState() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-24 px-4">
      <div className="flex flex-col items-center gap-4 max-w-sm">
        <div className="w-16 h-16 bg-[rgba(55,50,47,0.08)] rounded-2xl flex items-center justify-center">
          <Inbox size={32} className="text-[rgba(55,50,47,0.40)]" />
        </div>

        <h2 className="text-2xl md:text-3xl font-serif text-[#37322F] text-center">No Incoming Orders Yet</h2>

        <p className="text-base md:text-lg text-[rgba(55,50,47,0.60)] text-center font-sans">
          New orders from your customers will appear here automatically.
        </p>
      </div>
    </div>
  )
}

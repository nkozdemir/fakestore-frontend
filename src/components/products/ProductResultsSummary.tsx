import type { ReactNode } from "react"

export type ProductResultsSummaryProps = {
  isVisible: boolean
  firstItem: number
  lastItem: number
  totalCount: number
  summaryLabel: ReactNode
}

export default function ProductResultsSummary({
  isVisible,
  firstItem,
  lastItem,
  totalCount,
  summaryLabel,
}: ProductResultsSummaryProps) {
  if (!isVisible) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
      <span>
        Showing {firstItem.toLocaleString()}–
        {lastItem.toLocaleString()} of {totalCount.toLocaleString()} {summaryLabel}
      </span>
    </div>
  )
}

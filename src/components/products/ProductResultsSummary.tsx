import { useTranslation } from "@/hooks/useTranslation.ts"

export type ProductResultsSummaryProps = {
  isVisible: boolean
  firstItem: number
  lastItem: number
  totalCount: number
  summaryLabel: string
}

export default function ProductResultsSummary({
  isVisible,
  firstItem,
  lastItem,
  totalCount,
  summaryLabel,
}: ProductResultsSummaryProps) {
  const { t, locale } = useTranslation()

  if (!isVisible) {
    return null
  }

  const formattedFirst = firstItem.toLocaleString(locale)
  const formattedLast = lastItem.toLocaleString(locale)
  const formattedTotal = totalCount.toLocaleString(locale)

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"
      data-testid="product-summary"
    >
      <span>
        {t("products.summary.showing", {
          defaultValue: "Showing {{first}}–{{last}} of {{total}} {{label}}",
          values: {
            first: formattedFirst,
            last: formattedLast,
            total: formattedTotal,
            label: summaryLabel,
          },
        })}
      </span>
    </div>
  )
}

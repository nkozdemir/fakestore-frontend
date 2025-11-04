import { useMemo } from "react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination.tsx"
import { cn } from "@/lib/utils.ts"

type PaginationControlsProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  canGoPrevious?: boolean
  canGoNext?: boolean
  className?: string
  listClassName?: string
}

type PageItem = number | "ellipsis"

function buildPaginationItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", totalPages]
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      "ellipsis",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ]
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ]
}

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  canGoPrevious,
  canGoNext,
  className,
  listClassName,
}: PaginationControlsProps) {
  const normalizedTotalPages = Math.max(1, Number.isFinite(totalPages) ? totalPages : 1)
  const resolvedCanGoPrevious = canGoPrevious ?? currentPage > 1
  const resolvedCanGoNext =
    canGoNext ?? (normalizedTotalPages > 1 && currentPage < normalizedTotalPages)

  const pageItems = useMemo<PageItem[]>(() => {
    const safeCurrent = Math.min(
      Math.max(1, currentPage),
      Math.max(1, normalizedTotalPages),
    )
    return buildPaginationItems(safeCurrent, normalizedTotalPages)
  }, [currentPage, normalizedTotalPages])

  return (
    <Pagination className={className}>
      <PaginationContent className={listClassName}>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(event) => {
              event.preventDefault()
              if (!resolvedCanGoPrevious) {
                return
              }
              onPageChange(Math.max(1, currentPage - 1))
            }}
            className={cn(
              !resolvedCanGoPrevious && "pointer-events-none opacity-50",
            )}
            aria-disabled={!resolvedCanGoPrevious}
          />
        </PaginationItem>

        {pageItems.map((item, index) =>
          item === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  if (item === currentPage) {
                    return
                  }
                  onPageChange(item)
                }}
                isActive={item === currentPage}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(event) => {
              event.preventDefault()
              if (!resolvedCanGoNext) {
                return
              }
              onPageChange(currentPage + 1)
            }}
            className={cn(!resolvedCanGoNext && "pointer-events-none opacity-50")}
            aria-disabled={!resolvedCanGoNext}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

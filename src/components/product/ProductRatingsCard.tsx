import { Star } from "lucide-react"
import { Spinner } from "@/components/ui/spinner.tsx"
import { PRODUCT_RATING_VALUES } from "@/hooks/useProductRatings.ts"
import type { ProductRatingsList } from "@/types/catalog.ts"

type ProductRatingsCardProps = {
  averageRating: number | null
  formattedAverageRating: string | null
  ratingCount: number
  hasRatings: boolean
  isSummaryFetching: boolean
  ratingsQueryState: {
    isPending: boolean
    isFetching: boolean
    error: Error | null
  }
  displayedRatings: ProductRatingsList["ratings"]
  isAuthenticated: boolean
  highlightedUserRating: number
  currentUserRating: number | null
  canRemoveRating: boolean
  isRatingMutating: boolean
  isRemovingRating: boolean
  onRate: (value: number) => void
  onRemove: () => void
}

export default function ProductRatingsCard({
  averageRating,
  formattedAverageRating,
  ratingCount,
  hasRatings,
  isSummaryFetching,
  ratingsQueryState,
  displayedRatings,
  isAuthenticated,
  highlightedUserRating,
  currentUserRating,
  canRemoveRating,
  isRatingMutating,
  isRemovingRating,
  onRate,
  onRemove,
}: ProductRatingsCardProps) {
  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-muted/10 px-4 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-primary">
          {PRODUCT_RATING_VALUES.map((value) => {
            const isFilled =
              averageRating !== null && averageRating >= value - 0.25

            return (
              <Star
                key={`average-${value}`}
                className="size-5"
                strokeWidth={1.5}
                fill={isFilled ? "currentColor" : "transparent"}
                aria-hidden
              />
            )
          })}
        </div>
        <span className="text-lg font-semibold">
          {formattedAverageRating ?? "No ratings yet"}
        </span>
        <span className="text-xs text-muted-foreground">
          {hasRatings
            ? `${ratingCount} ${ratingCount === 1 ? "rating" : "ratings"}`
            : "Be the first to rate"}
        </span>
        {isSummaryFetching && <Spinner className="size-4 text-muted-foreground" />}
      </div>

      {isAuthenticated ? (
        <UserRatingControls
          highlightedUserRating={highlightedUserRating}
          currentUserRating={currentUserRating}
          canRemoveRating={canRemoveRating}
          isRatingMutating={isRatingMutating}
          isRemovingRating={isRemovingRating}
          onRate={onRate}
          onRemove={onRemove}
        />
      ) : (
        <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Sign in to rate this product.
        </div>
      )}

      <RatingsList
        state={ratingsQueryState}
        displayedRatings={displayedRatings}
      />
    </div>
  )
}

type UserRatingControlsProps = {
  highlightedUserRating: number
  currentUserRating: number | null
  canRemoveRating: boolean
  isRatingMutating: boolean
  isRemovingRating: boolean
  onRate: (value: number) => void
  onRemove: () => void
}

function UserRatingControls({
  highlightedUserRating,
  currentUserRating,
  canRemoveRating,
  isRatingMutating,
  isRemovingRating,
  onRate,
  onRemove,
}: UserRatingControlsProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Your rating</p>
      <div className="flex flex-wrap items-center gap-2">
        {PRODUCT_RATING_VALUES.map((value) => (
          <button
            key={`interactive-${value}`}
            type="button"
            className="group"
            onClick={() => onRate(value)}
            disabled={isRatingMutating}
            aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
          >
            <Star
              className="size-6"
              strokeWidth={1.5}
              fill={
                value <= highlightedUserRating ? "currentColor" : "transparent"
              }
            />
          </button>
        ))}
        {isRatingMutating && (
          <Spinner className="size-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {isRemovingRating ? (
          <span>Removing your rating...</span>
        ) : currentUserRating !== null ? (
          <span>
            You rated this product {currentUserRating} star
            {currentUserRating === 1 ? "" : "s"}.
          </span>
        ) : canRemoveRating ? (
          <span>You rated this product.</span>
        ) : (
          <span>Select a star rating.</span>
        )}
        {canRemoveRating && (
          <button
            type="button"
            className="font-medium text-primary underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground"
            onClick={onRemove}
            disabled={isRatingMutating}
          >
            {isRemovingRating ? "Removing..." : "Remove rating"}
          </button>
        )}
      </div>
    </div>
  )
}

type RatingsListProps = {
  state: {
    isPending: boolean
    isFetching: boolean
    error: Error | null
  }
  displayedRatings: ProductRatingsList["ratings"]
}

function RatingsList({ state, displayedRatings }: RatingsListProps) {
  if (state.isPending) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Spinner className="size-4" />
        <span>Loading ratings...</span>
      </div>
    )
  }

  if (state.error) {
    return (
      <p className="text-xs text-destructive">Unable to load ratings right now.</p>
    )
  }

  if (displayedRatings.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No ratings yet. Be the first to leave a rating.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">What shoppers are saying</p>
      <ul className="space-y-2">
        {displayedRatings.map((entry) => {
          const name =
            [entry.firstName, entry.lastName]
              .filter(
                (part) => typeof part === "string" && part.trim().length > 0,
              )
              .join(" ") || "Anonymous shopper"

          return (
            <li
              key={`${entry.id ?? "rating"}-${
                entry.updatedAt ?? entry.createdAt ?? entry.value
              }`}
              className="flex flex-col gap-1 rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{name}</span>
                <div className="flex items-center gap-1 text-primary">
                  {PRODUCT_RATING_VALUES.map((value) => (
                    <Star
                      key={`entry-${entry.id ?? "rating"}-${value}`}
                      className="size-4"
                      strokeWidth={1.5}
                      fill={value <= entry.value ? "currentColor" : "transparent"}
                    />
                  ))}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {entry.value}/5
                  </span>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

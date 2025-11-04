import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card.tsx"
import { Skeleton } from "@/components/ui/skeleton.tsx"

export default function ProductCardSkeleton() {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="gap-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex h-60 items-center justify-center overflow-hidden rounded-lg border bg-muted/10">
          <Skeleton className="h-52 w-52" />
        </div>
        <Skeleton className="h-16 w-full" />
      </CardContent>
      <CardFooter className="mt-auto flex items-center justify-between gap-4">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-9 w-24" />
      </CardFooter>
    </Card>
  )
}

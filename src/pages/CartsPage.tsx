import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"

export default function CartsPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Carts
          </h1>
          <p className="text-muted-foreground">
            Review the items you&apos;ve added before checking out.
          </p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Your cart is empty</CardTitle>
            <CardDescription>
              Browse products and add items to see them appear here.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Cart functionality will be available in an upcoming update.
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Profile
          </h1>
          <p className="text-muted-foreground">
            Manage your personal information and account preferences.
          </p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Profile details coming soon</CardTitle>
            <CardDescription>
              We&apos;re building personalized controls for your Fakestore
              account.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Once authentication is wired up, your profile information will be
            available in this space.
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

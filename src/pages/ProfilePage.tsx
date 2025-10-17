import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"
import useAuth from "@/hooks/useAuth.ts"

export default function ProfilePage() {
  const { user } = useAuth()

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
            <CardTitle>
              {user
                ? `${user.firstName} ${user.lastName}`
                : "Your account"}
            </CardTitle>
            <CardDescription>
              {user
                ? "Account details from your Fakestore profile."
                : "Sign in to view account information."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {user ? (
              <>
                <div>
                  <p className="font-medium text-foreground">Contact</p>
                  <p className="text-muted-foreground">{user.email}</p>
                  {user.phone && (
                    <p className="text-muted-foreground">{user.phone}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">Account</p>
                  <p className="text-muted-foreground">
                    Username: {user.username}
                  </p>
                  {user.lastLogin && (
                    <p className="text-muted-foreground">
                      Last login:{" "}
                      {new Date(user.lastLogin).toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">Addresses</p>
                  {user.addresses.length > 0 ? (
                    <ul className="space-y-2 text-muted-foreground">
                      {user.addresses.map((address) => (
                        <li key={address.id}>
                          {address.street} {address.number}, {address.city},{" "}
                          {address.zipcode}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">
                      No addresses on file.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">
                We were unable to load your profile information. Please try
                signing out and back in.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button.tsx"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"
import type { AuthUser } from "@/types/auth.ts"

type ProfileSummaryCardProps = {
  user: AuthUser
  onEdit: () => void
}

export default function ProfileSummaryCard({
  user,
  onEdit,
}: ProfileSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-2xl">
            {user.firstName} {user.lastName}
          </CardTitle>
          <CardDescription>
            Account details from your Fakestore profile.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="mr-2 size-4" aria-hidden />
          Edit profile
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6 text-sm md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Contact</p>
          <p className="text-muted-foreground">{user.email}</p>
          <p className="text-muted-foreground">
            {user.phone ? user.phone : "Phone not provided"}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Account</p>
          <p className="text-muted-foreground">
            Username: {user.username}
          </p>
          <p className="text-muted-foreground">
            Member since:{" "}
            {new Date(user.dateJoined).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}
          </p>
          {user.lastLogin && (
            <p className="text-muted-foreground">
              Last login:{" "}
              {new Date(user.lastLogin).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"
import { Button } from "@/components/ui/button.tsx"

type SecurityCardProps = {
  onChangePassword: () => void
}

export default function SecurityCard({ onChangePassword }: SecurityCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>
          Update sensitive account information such as your password.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Choose a strong password to keep your account secure.
        </p>
        <Button onClick={onChangePassword}>Change password</Button>
      </CardContent>
    </Card>
  )
}

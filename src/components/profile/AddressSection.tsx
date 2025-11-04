import { Pencil, Plus, Trash2, CircleAlert, Loader2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"
import { Button } from "@/components/ui/button.tsx"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx"
import type { UserAddress } from "@/types/auth.ts"

type AddressSectionProps = {
  addresses: UserAddress[]
  onAdd: () => void
  onEdit: (address: UserAddress) => void
  onDeleteRequest: (address: UserAddress) => void
  deleteDialog: {
    address: UserAddress | null
    error: string | null
    isDeleting: boolean
    onCancel: () => void
    onConfirm: () => void
  }
}

export default function AddressSection({
  addresses,
  onAdd,
  onEdit,
  onDeleteRequest,
  deleteDialog,
}: AddressSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Addresses</CardTitle>
          <CardDescription>
            Manage the delivery addresses linked to your account.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="mr-2 size-4" aria-hidden />
          Add address
        </Button>
      </CardHeader>
      <CardContent>
        {addresses.length > 0 ? (
          <ul className="grid gap-4">
            {addresses.map((address) => (
              <li key={address.id} className="rounded-md border p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      {address.street} {address.number}
                    </p>
                    <p className="text-muted-foreground">
                      {address.city}, {address.zipcode}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Coordinates: {address.latitude}, {address.longitude}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(address)}
                    >
                      <Pencil className="mr-2 size-4" aria-hidden />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive focus-visible:text-destructive"
                      onClick={() => onDeleteRequest(address)}
                      aria-label={`Remove address at ${address.street} ${address.number}`}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            You haven't saved any addresses yet.
          </p>
        )}
        <AlertDialog
          open={Boolean(deleteDialog.address)}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              deleteDialog.onCancel()
            }
          }}
        >
          {deleteDialog.address && (
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove this address?</AlertDialogTitle>
                <AlertDialogDescription>
                  We'll remove {deleteDialog.address.street}{" "}
                  {deleteDialog.address.number} from your saved addresses. You can
                  add it again at any time.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {deleteDialog.error && (
                <Alert variant="destructive">
                  <CircleAlert className="size-5" aria-hidden />
                  <AlertTitle>Address removal failed</AlertTitle>
                  <AlertDescription>{deleteDialog.error}</AlertDescription>
                </Alert>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteDialog.isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(event) => {
                    event.preventDefault()
                    deleteDialog.onConfirm()
                  }}
                  disabled={deleteDialog.isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteDialog.isDeleting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  ) : (
                    <Trash2 className="mr-2 size-4" aria-hidden />
                  )}
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          )}
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

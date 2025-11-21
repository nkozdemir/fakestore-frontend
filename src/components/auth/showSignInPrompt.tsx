import { toast } from "sonner"

export function showSignInPrompt(options: {
  message: string
  actionLabel: string
  onSignIn: () => void
}) {
  return toast.info(options.message, {
    action: {
      label: options.actionLabel,
      onClick: options.onSignIn,
    },
  })
}

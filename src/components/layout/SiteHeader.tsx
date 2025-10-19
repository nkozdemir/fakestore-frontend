import { useMemo, useState } from "react"
import { MenuIcon } from "lucide-react"
import { Link, NavLink, useNavigate } from "react-router"
import { ModeToggle } from "@/components/mode-toggle.tsx"
import { Button, buttonVariants } from "@/components/ui/button.tsx"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx"
import { cn } from "@/lib/utils.ts"
import useAuth from "@/hooks/useAuth.ts"

const navItems = [
  { label: "Products", to: "/", end: true },
  { label: "Cart", to: "/carts" },
] as const

export default function SiteHeader() {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout, isLoading } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const displayName = useMemo(() => {
    const name = user?.firstName?.trim()
    if (name && name.length > 0) {
      return name
    }
    const username = user?.username?.trim()
    if (username && username.length > 0) {
      return username
    }
    return "Account"
  }, [user?.firstName, user?.username])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      navigate("/login")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          Fakestore
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map(({ end, ...item }) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    buttonVariants({
                      variant: isActive ? "default" : "ghost",
                      size: "sm",
                    }),
                    "font-medium",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          {!isLoading &&
            (isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="max-w-[10rem] truncate font-medium"
                  >
                    {displayName}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
                  <DropdownMenuItem
                    onSelect={() => {
                      navigate("/profile")
                    }}
                  >
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      void handleLogout()
                    }}
                    disabled={isLoggingOut}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="hidden sm:inline-flex"
                onClick={() => navigate("/login")}
              >
                Sign in
              </Button>
            ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                aria-label="Open navigation menu"
              >
                <MenuIcon className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Navigate</DropdownMenuLabel>
              {navItems.map((item) => (
                <DropdownMenuItem
                  key={item.to}
                  onSelect={() => navigate(item.to)}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
              {!isLoading && (
                <>
                  {isAuthenticated ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
                      <DropdownMenuItem
                        onSelect={() => navigate("/profile")}
                      >
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          void handleLogout()
                        }}
                        disabled={isLoggingOut}
                      >
                        Log out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem
                      onSelect={() => navigate("/login")}
                    >
                      Sign in
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}

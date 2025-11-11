import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { MinusIcon, PlusIcon } from "lucide-react"
import { cn } from "@/lib/utils.ts"
import { useTranslation } from "@/context/I18nProvider.tsx"

type QuantityStepperProps = {
  value: number
  onChange: (nextValue: number) => void
  min?: number
  max?: number | null
  disabled?: boolean
  className?: string
  testId?: string
}

const INTEGER_PATTERN = /^\d*$/

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = null,
  disabled = false,
  className,
  testId,
}: QuantityStepperProps) {
  const { t } = useTranslation()
  const [draftValue, setDraftValue] = useState<string>(() => String(value))

  useEffect(() => {
    setDraftValue(String(value))
  }, [value])

  const { isAtMin, isAtMax } = useMemo(() => {
    const minimum = Number.isFinite(min) ? min : 1
    const maximum = max === null || max === undefined ? Number.POSITIVE_INFINITY : max

    return {
      isAtMin: value <= minimum,
      isAtMax: value >= maximum,
    }
  }, [min, max, value])

  const clampQuantity = (next: number) => {
    const minimum = Number.isFinite(min) ? min : 1
    const maximum = max === null || max === undefined ? Number.POSITIVE_INFINITY : max

    return Math.min(Math.max(next, minimum), maximum)
  }

  const commitQuantity = (rawQuantity: number) => {
    const clamped = clampQuantity(rawQuantity)

    if (clamped === value) {
      setDraftValue(String(clamped))
      return
    }

    setDraftValue(String(clamped))
    onChange(clamped)
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value.trim()

    if (!INTEGER_PATTERN.test(next)) {
      return
    }

    setDraftValue(next)

    if (next === "") {
      return
    }

    const parsed = Number.parseInt(next, 10)

    if (!Number.isNaN(parsed)) {
      commitQuantity(parsed)
    }
  }

  const handleInputBlur = () => {
    if (draftValue === "") {
      setDraftValue(String(value))
      return
    }

    const parsed = Number.parseInt(draftValue, 10)

    if (Number.isNaN(parsed)) {
      setDraftValue(String(value))
      return
    }

    commitQuantity(parsed)
  }

  const increment = () => {
    if (disabled || isAtMax) {
      return
    }

    commitQuantity(value + 1)
  }

  const decrement = () => {
    if (disabled || isAtMin) {
      return
    }

    commitQuantity(value - 1)
  }

  const baseTestId = testId ?? "quantity-stepper"

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full border border-input bg-background px-1 py-1 shadow-sm focus-within:ring-2 focus-within:ring-ring/40 focus-within:ring-offset-0",
        disabled && "opacity-60",
        className,
      )}
      data-testid={baseTestId}
    >
      <button
        type="button"
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        onClick={decrement}
        disabled={disabled || isAtMin}
        aria-label={t("cart.quantity.decrease", {
          defaultValue: "Decrease quantity",
        })}
        data-testid={`${baseTestId}-decrease`}
      >
        <MinusIcon className="size-4" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern={INTEGER_PATTERN.source}
        value={draftValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        disabled={disabled}
        aria-label={t("cart.quantity.label", { defaultValue: "Quantity" })}
        className="w-12 rounded-full border-none bg-transparent text-center text-sm font-semibold outline-none [appearance:textfield] focus:ring-0 focus-visible:outline-none"
        data-testid={`${baseTestId}-input`}
      />
      <button
        type="button"
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        onClick={increment}
        disabled={disabled || isAtMax}
        aria-label={t("cart.quantity.increase", {
          defaultValue: "Increase quantity",
        })}
        data-testid={`${baseTestId}-increase`}
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  )
}

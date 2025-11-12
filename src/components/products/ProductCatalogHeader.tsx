import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx"
import type { Category } from "@/types/catalog.ts"
import { useTranslation } from "@/hooks/useTranslation.ts"

const toTestId = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "option"

export type ProductCatalogHeaderProps = {
  categories: Category[]
  selectedCategoryValue: string
  onCategoryChange: (value: string) => void
  isLoadingCategories: boolean
}

export default function ProductCatalogHeader({
  categories,
  selectedCategoryValue,
  onCategoryChange,
  isLoadingCategories,
}: ProductCatalogHeaderProps) {
  const { t } = useTranslation()

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("products.header.title", { defaultValue: "Products" })}
        </h1>
        <p className="text-muted-foreground">
          {t("products.header.description", {
            defaultValue: "Discover curated picks from our Fakestore catalog.",
          })}
        </p>
      </div>
      <Select
        value={selectedCategoryValue}
        onValueChange={onCategoryChange}
        disabled={isLoadingCategories}
      >
        <SelectTrigger className="w-full sm:w-64" data-testid="category-filter">
          <SelectValue
            placeholder={
              isLoadingCategories
                ? t("products.header.loadingCategories", {
                    defaultValue: "Loading categories...",
                  })
                : t("products.header.allCategories", {
                    defaultValue: "All categories",
                  })
            }
          />
        </SelectTrigger>
        <SelectContent data-testid="category-options">
          <SelectItem value="all" data-testid="category-option-all">
            {t("products.header.allCategories", {
              defaultValue: "All categories",
            })}
          </SelectItem>
          {categories.map((category) => (
            <SelectItem
              key={category.id}
              value={category.name}
              data-testid={`category-option-${toTestId(category.name)}`}
            >
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </header>
  )
}

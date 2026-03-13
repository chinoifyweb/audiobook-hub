"use client";

import { Input, Button, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui";
import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";




import {
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

interface BookCatalogFiltersProps {
  genres: string[];
  currentSearch?: string;
  currentGenre?: string;
  currentType?: string;
  currentSort: string;
  currentPriceMin?: string;
  currentPriceMax?: string;
  activeFilterCount: number;
}

export function BookCatalogFilters({
  genres,
  currentSearch,
  currentGenre,
  currentType,
  currentSort,
  currentPriceMin,
  currentPriceMax,
  activeFilterCount,
}: BookCatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(activeFilterCount > 0);
  const [searchValue, setSearchValue] = useState(currentSearch ?? "");

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      // Always reset to page 1 when filters change
      params.delete("page");
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      const qs = params.toString();
      startTransition(() => {
        router.push(`/books${qs ? `?${qs}` : ""}`);
      });
    },
    [router, searchParams]
  );

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ q: searchValue || undefined });
  }

  function clearAllFilters() {
    setSearchValue("");
    startTransition(() => {
      router.push("/books");
    });
  }

  return (
    <div className="mb-6 space-y-4">
      {/* Search and Sort Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by title, author, or keyword..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 pr-20"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            disabled={isPending}
          >
            Search
          </Button>
        </form>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <Select
            value={currentSort}
            onValueChange={(value) => updateParams({ sort: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="top_rated">Top Rated</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Toggle Filters Button */}
          <Button
            variant="outline"
            size="default"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <Badge className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {showFilters && (
        <div className="rounded-lg border bg-card p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Genre */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Genre</label>
              <Select
                value={currentGenre ?? "all"}
                onValueChange={(value) =>
                  updateParams({ genre: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Book Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Format</label>
              <Select
                value={currentType ?? "all"}
                onValueChange={(value) =>
                  updateParams({ type: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Formats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="audiobook">Audiobook</SelectItem>
                  <SelectItem value="ebook">Ebook</SelectItem>
                  <SelectItem value="both">Audio + Ebook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Min */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Min Price (NGN)</label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 500"
                defaultValue={currentPriceMin ?? ""}
                onBlur={(e) =>
                  updateParams({
                    price_min: e.target.value || undefined,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    updateParams({
                      price_min:
                        (e.target as HTMLInputElement).value || undefined,
                    });
                  }
                }}
              />
            </div>

            {/* Price Max */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Max Price (NGN)</label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 5000"
                defaultValue={currentPriceMax ?? ""}
                onBlur={(e) =>
                  updateParams({
                    price_max: e.target.value || undefined,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    updateParams({
                      price_max:
                        (e.target as HTMLInputElement).value || undefined,
                    });
                  }
                }}
              />
            </div>
          </div>

          {/* Active Filters & Clear */}
          {activeFilterCount > 0 && (
            <div className="mt-4 flex items-center gap-2 border-t pt-3">
              <span className="text-xs text-muted-foreground">
                Active filters:
              </span>
              {currentGenre && (
                <Badge variant="secondary" className="gap-1">
                  {currentGenre}
                  <button
                    onClick={() => updateParams({ genre: undefined })}
                    aria-label="Remove genre filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {currentType && (
                <Badge variant="secondary" className="gap-1">
                  {currentType}
                  <button
                    onClick={() => updateParams({ type: undefined })}
                    aria-label="Remove format filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {currentPriceMin && (
                <Badge variant="secondary" className="gap-1">
                  Min: {currentPriceMin} NGN
                  <button
                    onClick={() => updateParams({ price_min: undefined })}
                    aria-label="Remove min price filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {currentPriceMax && (
                <Badge variant="secondary" className="gap-1">
                  Max: {currentPriceMax} NGN
                  <button
                    onClick={() => updateParams({ price_max: undefined })}
                    aria-label="Remove max price filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="ml-auto text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

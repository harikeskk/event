"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Images, Plus, RefreshCw, LogOut } from "lucide-react";
import { VendorTopNav, VendorTabs } from "@/components/VendorNav";
import { useAuth } from "@/hooks/useAuth";
import { getMyProfile, addPortfolioItem, deletePortfolioItem } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input, Label, Textarea } from "@/components/ui/input";

interface PortfolioItem {
  id: string;
  imageUrl: string;
  title?: string | null;
  description?: string | null;
  sortOrder?: number | null;
}

interface PortfolioProfile {
  portfolioItems?: PortfolioItem[] | null;
}

const EMPTY_FORM = {
  imageUrl: "",
  title: "",
  description: "",
  sortOrder: "",
};

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export default function VendorPortfolioPage() {
  const router = useRouter();
  const { token, isAuthenticated, isVendor, isLoading: authLoading, logout } = useAuth();

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isVendor)) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, isVendor, router]);

  const loadItems = useCallback(() => {
    if (!token) return;
    getMyProfile(token)
      .then((data: PortfolioProfile) => {
        setItems(Array.isArray(data?.portfolioItems) ? data.portfolioItems : []);
        setLoadError(null);
      })
      .catch((err: unknown) =>
        setLoadError(errorMessage(err, "We couldn't load your portfolio. Try again in a moment.")),
      )
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    if (authLoading || !token || !isAuthenticated || !isVendor) return;
    loadItems();
  }, [authLoading, token, isAuthenticated, isVendor, loadItems]);

  const handleRetry = () => {
    setIsLoading(true);
    setLoadError(null);
    loadItems();
  };

  const setField = (key: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setAddError(null);
    setAddSuccess(null);
  };

  const urlValid =
    form.imageUrl.trim() === "" || /^https?:\/\/\S+$/i.test(form.imageUrl.trim());
  const rawSort = form.sortOrder.trim();
  const sortNum = rawSort === "" ? items.length : Number(rawSort);
  const sortValid =
    rawSort === "" || (Number.isInteger(sortNum) && sortNum >= 0);
  const isValid =
    form.imageUrl.trim() !== "" && form.title.trim() !== "" && urlValid && sortValid;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isAdding || !token) return;
    setAddError(null);
    setAddSuccess(null);
    setIsAdding(true);
    try {
      await addPortfolioItem(
        {
          imageUrl: form.imageUrl.trim(),
          title: form.title.trim(),
          description: form.description.trim(),
          sortOrder: sortNum,
        },
        token,
      );
      setForm(EMPTY_FORM);
      setAddSuccess("Item added to your portfolio.");
      loadItems();
    } catch (err: unknown) {
      setAddError(
        errorMessage(err, "We couldn't add this item. Check the fields and try again."),
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!token || deletingId) return;
    setDeleteError(null);
    setDeletingId(itemId);
    try {
      await deletePortfolioItem(itemId, token);
      setConfirmId(null);
      loadItems();
    } catch (err: unknown) {
      setDeleteError(errorMessage(err, "We couldn't delete this item. Try again in a moment."));
      setConfirmId(null);
    } finally {
      setDeletingId(null);
    }
  };

  const sortedItems = [...items].sort(
    (a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0),
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      <VendorTopNav />
      <main className="mx-auto w-full max-w-5xl overflow-x-hidden px-4 py-8 sm:px-6 sm:py-10 space-y-8 flex-1">
        <header className="space-y-5 border-b border-hairline pb-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Portfolio Showcase</h1>
              <p className="text-xs text-muted">
                Display high-quality photos of your work, equipment, and events to attract more clients.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  logout("/login");
                }}
                className="gap-1.5 text-xs text-muted hover:text-danger hover:bg-danger/10"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </Button>
            </div>
          </div>
          <div className="pt-2">
            <VendorTabs />
          </div>
        </header>

        {deleteError && (
          <p
            aria-live="polite"
            className="flex items-start gap-1.5 rounded-md bg-white px-4 py-3 text-sm text-danger shadow-card"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {deleteError}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="space-y-3 p-4">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </Card>
            ))}
          </div>
        ) : loadError ? (
          <Card className="mx-auto max-w-lg p-8 sm:p-10 text-center shadow-card border-hairline space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger shadow-hairline">
              <AlertCircle className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold tracking-tight">Portfolio Unavailable</h3>
              <p className="max-w-md text-xs text-muted leading-relaxed mx-auto">{loadError}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <Button onClick={handleRetry} className="w-full sm:w-auto text-xs gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  logout("/login?redirect=/vendor/portfolio");
                }}
                className="w-full sm:w-auto text-xs"
              >
                Log In Again
              </Button>
            </div>
          </Card>
        ) : sortedItems.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto flex flex-col items-center gap-3">
              <Images className="h-6 w-6 text-muted" aria-hidden="true" />
              <h3 className="text-base font-medium tracking-tight">No portfolio items yet</h3>
              <p className="max-w-md text-sm text-muted">
                Add photos of past events so customers know exactly what you deliver.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedItems.map((item) => (
              <Card key={item.id} className="flex flex-col overflow-hidden">
                <div className="aspect-[4/3] w-full bg-surface">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title || "Portfolio item"}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Images className="h-6 w-6 text-subtle" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="truncate">{item.title || "Untitled"}</CardTitle>
                    {item.description && (
                      <CardDescription className="line-clamp-2">
                        {item.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="mt-auto">
                    {confirmId === item.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="danger"
                          loading={deletingId === item.id}
                          onClick={() => handleDelete(item.id)}
                        >
                          Confirm delete?
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={deletingId === item.id}
                          onClick={() => setConfirmId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-danger hover:text-danger"
                        onClick={() => setConfirmId(item.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Card className="space-y-6 p-6">
          <div>
            <CardTitle>Add Item</CardTitle>
            <CardDescription>Paste a photo URL to grow your portfolio grid.</CardDescription>
          </div>

          <form onSubmit={handleAdd} noValidate className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="imageUrl">
                  Image URL
                  <span className="text-danger" aria-hidden="true">
                    {" *"}
                  </span>
                </Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  inputMode="url"
                  placeholder="https://…/event-photo.jpg"
                  value={form.imageUrl}
                  onChange={(e) => setField("imageUrl", e.target.value)}
                  aria-required
                  aria-invalid={!urlValid || undefined}
                />
                {!urlValid && (
                  <p className="text-xs text-danger">
                    Enter a full URL starting with http:// or https://.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="title">
                  Title
                  <span className="text-danger" aria-hidden="true">
                    {" *"}
                  </span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Wedding reception, MG Road"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  aria-required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  placeholder={String(items.length)}
                  value={form.sortOrder}
                  onChange={(e) => setField("sortOrder", e.target.value)}
                  aria-invalid={!sortValid || undefined}
                />
                {!sortValid && (
                  <p className="text-xs text-danger">
                    Sort order must be 0 or greater.
                  </p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="What this photo shows about your work…"
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-5">
              <div aria-live="polite" className="min-w-0">
                {addError && (
                  <p className="flex items-start gap-1.5 text-sm text-danger">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {addError}
                  </p>
                )}
                {addSuccess && !addError && (
                  <p className="flex items-start gap-1.5 text-sm text-success">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {addSuccess}
                  </p>
                )}
              </div>
              <Button type="submit" loading={isAdding} disabled={!isValid}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Item
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}

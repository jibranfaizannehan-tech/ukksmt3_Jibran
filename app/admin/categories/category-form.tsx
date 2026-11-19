"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Category = {
  id: number;
  name: string;
};

type CategoryFormProps = {
  categoryId?: string;
};

export function CategoryForm({ categoryId }: CategoryFormProps) {
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(categoryId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!categoryId) return;

    let isActive = true;

    async function loadCategory() {
      try {
        const response = await fetch(`/api/categories/${categoryId}`, {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(result.message ?? "Gagal memuat kategori.");
        }

        if (isActive) {
          setCategory(result.category);
          setName(result.category.name);
        }
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Gagal memuat kategori."
          );
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadCategory();

    return () => {
      isActive = false;
    };
  }, [categoryId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(
        categoryId ? `/api/categories/${categoryId}` : "/api/categories",
        {
          method: categoryId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        }
      );
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message ?? "Gagal menyimpan kategori.");
      }

      router.push("/admin/categories");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Gagal menyimpan kategori."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function goToCategories() {
    router.push("/admin/categories");
  }

  return (
    <Card className="m-6 px-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {categoryId ? "Edit kategori" : "Tambah kategori"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola kategori konten di SMK MVP ARS INTERNASIONAL.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={goToCategories}>
          <ArrowLeft aria-hidden="true" />
          Kembali
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="mt-5 text-sm text-muted-foreground">
          Memuat kategori...
        </p>
      ) : categoryId && !category ? null : (
        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-4 rounded-md border p-4"
        >
          <div className="grid gap-1.5">
            <label htmlFor="category-name" className="text-sm font-medium">
              Nama kategori
            </label>
            <Input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={191}
              placeholder="Contoh: Berita Sekolah"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={goToCategories}
              disabled={isSaving}
            >
              <X aria-hidden="true" />
              Batal
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Menyimpan..."
                : categoryId
                  ? "Simpan perubahan"
                  : "Simpan kategori"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

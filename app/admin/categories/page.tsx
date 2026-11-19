"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ManagedCategory = {
  id: number;
  name: string;
  createdAt: string;
};

const PAGE_SIZE = 10;

async function fetchCategories(page: number) {
  const response = await fetch(
    `/api/categories?page=${page}&pageSize=${PAGE_SIZE}`,
    { cache: "no-store" }
  );
  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message ?? "Gagal memuat data kategori.");
  }

  const categoryData = Array.isArray(result.data) ? result.data : [];
  return {
    categories: categoryData.map((category: ManagedCategory) => ({
      id: Number(category.id),
      name: category.name,
      createdAt: category.createdAt,
    })),
    total: Number(result.pagination?.totalCategories ?? categoryData.length),
    page: Number(result.pagination?.page ?? page),
  };
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ManagedCategory[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadInitialCategories() {
      try {
        const result = await fetchCategories(1);
        if (!isActive) return;
        setCategories(result.categories);
        setTotalCategories(result.total);
        setCurrentPage(result.page);
      } catch (loadError) {
        if (!isActive) return;
        console.error("LOAD CATEGORIES ERROR:", loadError);
        setCategories([]);
        setTotalCategories(0);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Gagal memuat data kategori."
        );
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadInitialCategories();
    return () => {
      isActive = false;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalCategories / PAGE_SIZE));

  function goToPage(page: number) {
    if (page < 1 || page > totalPages || isLoading) return;
    setIsLoading(true);
    setError("");
    void loadCategories(page);
  }

  async function loadCategories(page: number) {
    try {
      const result = await fetchCategories(page);
      setCategories(result.categories);
      setTotalCategories(result.total);
      setCurrentPage(result.page);
    } catch (loadError) {
      console.error("LOAD CATEGORIES ERROR:", loadError);
      setCategories([]);
      setTotalCategories(0);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Gagal memuat data kategori."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteCategory(category: ManagedCategory) {
    if (!window.confirm(`Hapus kategori "${category.name}"?`)) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message ?? "Gagal menghapus kategori.");
      }

      if (categories.length === 1 && currentPage > 1) {
        await loadCategories(currentPage - 1);
      } else {
        await loadCategories(currentPage);
      }
    } catch (deleteError) {
      console.error("DELETE CATEGORY ERROR:", deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Gagal menghapus kategori."
      );
    }
  }

  return (
    <Card className="m-6 px-4 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-bold">Kategori</h1>
          <p className="text-sm text-muted-foreground">
            Kelola kategori konten.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/categories/from")}>
          <Plus aria-hidden="true" />
          Tambah kategori
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      <div className="mt-5 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nama kategori</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Memuat kategori...
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Belum ada kategori.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.id}</TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    {category.createdAt
                      ? new Date(category.createdAt).toLocaleDateString("id-ID")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${category.name}`}
                        title="Edit kategori"
                        onClick={() =>
                          router.push(`/admin/categories/${category.id}`)
                        }
                      >
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Hapus ${category.name}`}
                        title="Hapus kategori"
                        onClick={() => void deleteCategory(category)}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Total {totalCategories} kategori
        </p>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={currentPage === 1 || isLoading}
                className={
                  currentPage === 1 || isLoading
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
                onClick={(event) => {
                  event.preventDefault();
                  if (currentPage > 1 && !isLoading) {
                    goToPage(currentPage - 1);
                  }
                }}
              />
            </PaginationItem>

            {getPageItems(currentPage, totalPages).map((item, index) => (
              <PaginationItem key={`${item}-${index}`}>
                {item === "ellipsis" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    isActive={item === currentPage}
                    aria-label={`Go to page ${item}`}
                    onClick={(event) => {
                      event.preventDefault();
                      if (!isLoading && item !== currentPage) {
                        goToPage(item);
                      }
                    }}
                  >
                    {item}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={currentPage === totalPages || isLoading}
                className={
                  currentPage === totalPages || isLoading
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
                onClick={(event) => {
                  event.preventDefault();
                  if (currentPage < totalPages && !isLoading) {
                    goToPage(currentPage + 1);
                  }
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </Card>
  );
}

function getPageItems(
  currentPage: number,
  totalPages: number
): Array<number | "ellipsis"> {
  if (totalPages <= 4) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 2) {
    return [1, 2, 3, "ellipsis"];
  }

  if (currentPage >= totalPages - 1) {
    return ["ellipsis", totalPages - 2, totalPages - 1, totalPages];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
  ];
}

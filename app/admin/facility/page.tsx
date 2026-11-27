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

type ManagedFacility = {
  kodeFacility: string;
  namaFacility: string;
  createdAt: string;
  updatedAt: string;
};

const PAGE_SIZE = 10;

async function fetchFacilities(page: number) {
  const response = await fetch(
    `/api/facilities?page=${page}&pageSize=${PAGE_SIZE}`,
    { cache: "no-store" }
  );
  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message ?? "Gagal memuat data fasilitas.");
  }

  const facilityData = Array.isArray(result.data) ? result.data : [];
  return {
    facilities: facilityData.map((facility: ManagedFacility) => ({
      kodeFacility: facility.kodeFacility,
      namaFacility: facility.namaFacility,
      createdAt: facility.createdAt,
      updatedAt: facility.updatedAt,
    })),
    total: Number(result.pagination?.totalFacilities ?? facilityData.length),
    page: Number(result.pagination?.page ?? page),
  };
}

export default function FacilityPage() {
  const router = useRouter();
  const [facilities, setFacilities] = useState<ManagedFacility[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalFacilities, setTotalFacilities] = useState(0);
  const [selectedFacilityCodes, setSelectedFacilityCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadInitialFacilities() {
      try {
        const result = await fetchFacilities(1);
        if (!isActive) return;
        setFacilities(result.facilities);
        setTotalFacilities(result.total);
        setCurrentPage(result.page);
      } catch (loadError) {
        if (!isActive) return;
        console.error("LOAD FACILITIES ERROR:", loadError);
        setFacilities([]);
        setTotalFacilities(0);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Gagal memuat data fasilitas."
        );
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadInitialFacilities();
    return () => {
      isActive = false;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalFacilities / PAGE_SIZE));
  const visibleFacilityCodes = facilities.map((facility) => facility.kodeFacility);
  const areAllVisibleFacilitiesSelected =
    visibleFacilityCodes.length > 0 &&
    visibleFacilityCodes.every((code) => selectedFacilityCodes.includes(code));

  function toggleFacility(kodeFacility: string) {
    setSelectedFacilityCodes((previous) =>
      previous.includes(kodeFacility)
        ? previous.filter((code) => code !== kodeFacility)
        : [...previous, kodeFacility]
    );
  }

  function toggleVisibleFacilities() {
    setSelectedFacilityCodes((previous) => {
      if (areAllVisibleFacilitiesSelected) {
        return previous.filter((code) => !visibleFacilityCodes.includes(code));
      }
      return [...new Set([...previous, ...visibleFacilityCodes])];
    });
  }

  function goToPage(page: number) {
    if (page < 1 || page > totalPages || isLoading) return;
    setIsLoading(true);
    setError("");
    void loadFacilities(page);
  }

  async function loadFacilities(page: number) {
    try {
      const result = await fetchFacilities(page);
      setFacilities(result.facilities);
      setTotalFacilities(result.total);
      setCurrentPage(result.page);
    } catch (loadError) {
      console.error("LOAD FACILITIES ERROR:", loadError);
      setFacilities([]);
      setTotalFacilities(0);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Gagal memuat data fasilitas."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteFacility(facility: ManagedFacility) {
    if (!window.confirm(`Hapus fasilitas "${facility.namaFacility}"?`)) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/facilities/${encodeURIComponent(facility.kodeFacility)}`,
        {
          method: "DELETE",
        }
      );
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message ?? "Gagal menghapus fasilitas.");
      }

      setSelectedFacilityCodes((previous) =>
        previous.filter((code) => code !== facility.kodeFacility)
      );

      if (facilities.length === 1 && currentPage > 1) {
        await loadFacilities(currentPage - 1);
      } else {
        await loadFacilities(currentPage);
      }
    } catch (deleteError) {
      console.error("DELETE FACILITY ERROR:", deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Gagal menghapus fasilitas."
      );
    }
  }

  return (
    <Card className="m-0 w-full gap-0 rounded-2xl bg-white px-4 py-5 shadow-none ring-1 ring-black/5 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-lg font-semibold text-slate-900">
            Facility Management
          </h1>
          <p className="text-xs text-slate-500">
            Kelola data fasilitas apartemen.
          </p>
        </div>
        <Button
          className="h-8 rounded-full bg-slate-950 px-3 text-xs text-white hover:bg-slate-800"
          onClick={() => router.push("/admin/facility/from")}
        >
          <Plus aria-hidden="true" className="size-3.5" />
          Tambah facility
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

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500" aria-live="polite">
          {selectedFacilityCodes.length} facility dipilih
        </p>
        {selectedFacilityCodes.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setSelectedFacilityCodes([])}
          >
            Bersihkan pilihan
          </Button>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-md border border-slate-200">
        <Table className="min-w-[760px] text-xs">
          <TableHeader>
            <TableRow className="bg-white hover:bg-white">
              <TableHead className="h-8 w-9 px-2">
                <input
                  type="checkbox"
                  checked={areAllVisibleFacilitiesSelected}
                  onChange={toggleVisibleFacilities}
                  aria-label="Pilih semua fasilitas di halaman ini"
                  disabled={isLoading || facilities.length === 0}
                  className="size-4 cursor-pointer accent-primary"
                />
              </TableHead>
              <TableHead className="h-8 px-2 font-semibold text-slate-800">
                No
              </TableHead>
              <TableHead className="h-8 px-2 font-semibold text-slate-800">
                Kode Facility
              </TableHead>
              <TableHead className="h-8 px-2 font-semibold text-slate-800">
                Nama Facility
              </TableHead>
              <TableHead className="h-8 px-2 font-semibold text-slate-800">
                Dibuat
              </TableHead>
              <TableHead className="h-8 px-2 font-semibold text-slate-800">
                Diperbarui
              </TableHead>
              <TableHead className="h-8 px-2 text-right font-semibold text-slate-800">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-16 px-2 text-center">
                  Memuat fasilitas...
                </TableCell>
              </TableRow>
            ) : facilities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-16 px-2 text-center">
                  Belum ada fasilitas.
                </TableCell>
              </TableRow>
            ) : (
              facilities.map((facility, index) => (
                <TableRow
                  key={facility.kodeFacility}
                  className={`h-10 ${
                    selectedFacilityCodes.includes(facility.kodeFacility)
                      ? "bg-primary/5"
                      : ""
                  }`}
                >
                  <TableCell className="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selectedFacilityCodes.includes(facility.kodeFacility)}
                      onChange={() => toggleFacility(facility.kodeFacility)}
                      aria-label={`Pilih ${facility.kodeFacility} ${facility.namaFacility}`}
                      className="size-4 cursor-pointer accent-primary"
                    />
                  </TableCell>
                  <TableCell className="px-2 py-2">
                    {(currentPage - 1) * PAGE_SIZE + index + 1}
                  </TableCell>
                  <TableCell className="px-2 py-2 font-semibold">
                    {facility.kodeFacility}
                  </TableCell>
                  <TableCell className="px-2 py-2 font-medium">
                    {facility.namaFacility}
                  </TableCell>
                  <TableCell className="px-2 py-2">
                    {formatDate(facility.createdAt)}
                  </TableCell>
                  <TableCell className="px-2 py-2">
                    {formatDate(facility.updatedAt)}
                  </TableCell>
                  <TableCell className="px-2 py-1">
                    <div className="flex justify-end gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${facility.namaFacility}`}
                        title="Edit fasilitas"
                        className="size-7"
                        onClick={() =>
                          router.push(
                            `/admin/facility/${encodeURIComponent(facility.kodeFacility)}`
                          )
                        }
                      >
                        <Pencil aria-hidden="true" className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Hapus ${facility.namaFacility}`}
                        title="Hapus fasilitas"
                        className="size-7"
                        onClick={() => void deleteFacility(facility)}
                      >
                        <Trash2 aria-hidden="true" className="size-3.5" />
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
        <p className="text-xs text-slate-500">
          Halaman {currentPage} dari {totalPages} ({totalFacilities} facility)
        </p>

        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text="Previous"
                size="sm"
                aria-disabled={currentPage === 1 || isLoading}
                className={
                  currentPage === 1 || isLoading
                    ? "pointer-events-none h-7 px-2 text-xs opacity-50"
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
                  <PaginationEllipsis className="size-7" />
                ) : (
                  <PaginationLink
                    href="#"
                    isActive={item === currentPage}
                    size="icon-sm"
                    aria-label={`Go to page ${item}`}
                    className="size-7 text-xs"
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
                text="Next"
                size="sm"
                aria-disabled={currentPage === totalPages || isLoading}
                className={
                  currentPage === totalPages || isLoading
                    ? "pointer-events-none h-7 px-2 text-xs opacity-50"
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

function formatDate(value: string) {
  return value
    ? new Date(value).toLocaleDateString("id-ID")
    : "-";
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

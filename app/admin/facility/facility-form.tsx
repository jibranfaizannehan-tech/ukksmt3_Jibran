"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Facility = {
  kodeFacility: string;
  namaFacility: string;
};

type TypeUnitOption = {
  id_unit_type: number;
  nama_type_unit: string;
};

type FacilityOption = {
  kode_facility: string;
  nama_facility: string;
};

type FacilityFormProps = {
  facilityId?: string;
};

export function FacilityForm({ facilityId }: FacilityFormProps) {
  const router = useRouter();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [name, setName] = useState("");
  const [typeUnits, setTypeUnits] = useState<TypeUnitOption[]>([]);
  const [selectedTypeUnitId, setSelectedTypeUnitId] = useState("");
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(facilityId));
  const [isLoadingTypeUnits, setIsLoadingTypeUnits] = useState(!facilityId);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [typeUnitError, setTypeUnitError] = useState("");
  const [facilityListError, setFacilityListError] = useState("");

  useEffect(() => {
    if (!facilityId) return;

    let isActive = true;

    async function loadFacility() {
      try {
        const response = await fetch(`/api/facilities/${facilityId}`, {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(result.message ?? "Gagal memuat fasilitas.");
        }

        if (isActive) {
          setFacility(result.facility);
          setName(result.facility.namaFacility);
        }
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Gagal memuat fasilitas."
          );
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadFacility();

    return () => {
      isActive = false;
    };
  }, [facilityId]);

  useEffect(() => {
    if (facilityId) return;

    let isActive = true;

    async function loadTypeUnits() {
      try {
        const response = await fetch("/api/type", { cache: "no-store" });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message ?? result.error ?? "Gagal memuat daftar Type Unit.");
        }
        if (!Array.isArray(result)) {
          throw new Error("Format daftar Type Unit tidak valid.");
        }

        if (isActive) setTypeUnits(result);
      } catch (loadError) {
        if (isActive) {
          setTypeUnitError(
            loadError instanceof Error
              ? loadError.message
              : "Gagal memuat daftar Type Unit."
          );
        }
      } finally {
        if (isActive) setIsLoadingTypeUnits(false);
      }
    }

    void loadTypeUnits();

    return () => {
      isActive = false;
    };
  }, [facilityId]);

  useEffect(() => {
    if (facilityId || !selectedTypeUnitId) return;

    let isActive = true;

    async function loadUnitFacilities() {
      try {
        const response = await fetch(`/api/type/${selectedTypeUnitId}`, {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(
            result.message ?? result.error ?? "Gagal memuat daftar fasilitas."
          );
        }
        if (!Array.isArray(result.facilities) || !Array.isArray(result.selectedCodes)) {
          throw new Error("Format daftar fasilitas tidak valid.");
        }

        if (isActive) {
          setFacilities(result.facilities);
          setSelectedCodes(result.selectedCodes);
        }
      } catch (loadError) {
        if (isActive) {
          setFacilityListError(
            loadError instanceof Error
              ? loadError.message
              : "Gagal memuat daftar fasilitas."
          );
        }
      } finally {
        if (isActive) setIsLoadingFacilities(false);
      }
    }

    void loadUnitFacilities();

    return () => {
      isActive = false;
    };
  }, [facilityId, selectedTypeUnitId]);

  function handleTypeUnitChange(value: string) {
    setSelectedTypeUnitId(value);
    setFacilities([]);
    setSelectedCodes([]);
    setFacilityListError("");
    setIsLoadingFacilities(Boolean(value));
  }

  function toggleFacility(kodeFacility: string) {
    setSelectedCodes((previous) =>
      previous.includes(kodeFacility)
        ? previous.filter((code) => code !== kodeFacility)
        : [...previous, kodeFacility]
    );
  }

  function toggleAllFacilities() {
    if (selectedCodes.length === facilities.length) {
      setSelectedCodes([]);
    } else {
      setSelectedCodes(facilities.map((facility) => facility.kode_facility));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !facilityId &&
      (!selectedTypeUnitId ||
        isLoadingTypeUnits ||
        isLoadingFacilities ||
        typeUnitError ||
        facilityListError)
    ) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const requestUrl = facilityId
        ? `/api/facilities/${facilityId}`
        : `/api/type/${selectedTypeUnitId}`;
      const requestBody = facilityId
        ? { name: name.trim() }
        : { kode_facilities: selectedCodes };
      const response = await fetch(
        requestUrl,
        {
          method: facilityId ? "PATCH" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message ?? "Gagal menyimpan fasilitas.");
      }

      router.push("/admin/facility");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Gagal menyimpan fasilitas."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function goToFacilities() {
    router.push("/admin/facility");
  }

  const areAllFacilitiesSelected =
    facilities.length > 0 && selectedCodes.length === facilities.length;

  return (
    <Card className="m-6 px-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {facilityId ? "Edit fasilitas" : "Tambah facility"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {facilityId
              ? "Kelola data fasilitas apartemen."
              : "Pilih Type Unit dan fasilitas yang akan dipasang."}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={goToFacilities}>
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
          Memuat fasilitas...
        </p>
      ) : facilityId && !facility ? null : (
        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-4 rounded-md border p-4"
        >
          {facilityId ? (
            <div className="grid gap-1.5">
              <label htmlFor="facility-name" className="text-sm font-medium">
                Nama fasilitas
              </label>
              <Input
                id="facility-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={191}
                placeholder="Contoh: Kolam renang"
              />
            </div>
          ) : (
            <>
              <div className="grid gap-1.5">
                <label htmlFor="type-unit" className="text-sm font-medium">
                  Type Unit
                </label>
                <select
                  id="type-unit"
                  value={selectedTypeUnitId}
                  onChange={(event) => handleTypeUnitChange(event.target.value)}
                  disabled={isLoadingTypeUnits || Boolean(typeUnitError)}
                  required
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">
                    {isLoadingTypeUnits ? "Memuat Type Unit..." : "Pilih Type Unit"}
                  </option>
                  {typeUnits.map((unit) => (
                    <option key={unit.id_unit_type} value={unit.id_unit_type}>
                      {unit.nama_type_unit}
                    </option>
                  ))}
                </select>
                {typeUnitError && (
                  <p role="alert" className="text-sm text-destructive">
                    {typeUnitError}
                  </p>
                )}
              </div>

              {selectedTypeUnitId && (
                <div className="grid gap-2">
                  <div>
                    <p className="text-sm font-medium">Daftar facility</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedCodes.length} dari {facilities.length} facility dipilih.
                    </p>
                  </div>

                  {isLoadingFacilities ? (
                    <p role="status" className="text-sm text-muted-foreground">
                      Memuat daftar fasilitas...
                    </p>
                  ) : facilityListError ? (
                    <p role="alert" className="text-sm text-destructive">
                      {facilityListError}
                    </p>
                  ) : (
                    <div className="max-h-[min(60vh,24rem)] overflow-auto rounded-lg border border-border">
                      <Table className="text-xs">
                        <TableHeader className="sticky top-0 z-10 bg-card">
                          <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="h-9 w-10 px-3">
                              <input
                                type="checkbox"
                                checked={areAllFacilitiesSelected}
                                onChange={toggleAllFacilities}
                                aria-label="Pilih semua fasilitas"
                                className="size-4 cursor-pointer accent-primary"
                                disabled={facilities.length === 0}
                              />
                            </TableHead>
                            <TableHead className="h-9 w-36 px-3 font-semibold">
                              Kode Facility
                            </TableHead>
                            <TableHead className="h-9 px-3 font-semibold">
                              Nama Facility
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {facilities.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="h-16 px-3 text-center text-muted-foreground"
                              >
                                Belum ada fasilitas untuk dipasang.
                              </TableCell>
                            </TableRow>
                          ) : (
                            facilities.map((item) => {
                              const checked = selectedCodes.includes(item.kode_facility);
                              return (
                                <TableRow
                                  key={item.kode_facility}
                                  onClick={() => toggleFacility(item.kode_facility)}
                                  className={`h-10 cursor-pointer ${checked ? "bg-primary/5" : ""}`}
                                >
                                  <TableCell
                                    className="px-3 py-2"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleFacility(item.kode_facility)}
                                      aria-label={`Pilih ${item.kode_facility} ${item.nama_facility}`}
                                      className="size-4 cursor-pointer accent-primary"
                                    />
                                  </TableCell>
                                  <TableCell className="px-3 py-2 font-medium">
                                    {item.kode_facility}
                                  </TableCell>
                                  <TableCell className="px-3 py-2">
                                    {item.nama_facility}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={goToFacilities}
              disabled={isSaving}
            >
              <X aria-hidden="true" />
              Batal
            </Button>
            <Button
              type="submit"
              disabled={
                isSaving ||
                (!facilityId &&
                  (!selectedTypeUnitId ||
                    isLoadingTypeUnits ||
                    isLoadingFacilities ||
                    Boolean(typeUnitError) ||
                    Boolean(facilityListError)))
              }
            >
              {isSaving
                ? "Menyimpan..."
                : facilityId
                  ? "Simpan perubahan"
                  : "Simpan fasilitas"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

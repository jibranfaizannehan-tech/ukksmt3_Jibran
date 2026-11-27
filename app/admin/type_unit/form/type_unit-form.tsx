'use client'

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type FacilityItem = {
  kode_facility: string
  nama_facility: string
}

type TypeUnitInfo = {
  id_unit_type: number
  nama_type_unit: string
  branch_id: string
}

type TypeUnitFormProps = {
  unitId?: string
}

// Form untuk memasang atau melepas facility pada satu Type Unit tertentu.
export function TypeUnitForm({ unitId }: TypeUnitFormProps) {
  const router = useRouter()
  const [unit, setUnit] = useState<TypeUnitInfo | null>(null)
  const [facilities, setFacilities] = useState<FacilityItem[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(unitId))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!unitId) return

    // Muat detail unit dan daftar facility beserta relasi yang sudah tersimpan.
    let isActive = true
    async function loadData() {
      try {
        const response = await fetch(`/api/type/${unitId}`)
        const result = await response.json()
        if (!response.ok) throw new Error(result.message ?? result.error ?? "Gagal memuat data fasilitas unit.")

        if (isActive) {
          setUnit(result.unit)
          setFacilities(result.facilities)
          setSelected(result.selectedCodes)
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Gagal memuat data.")
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void loadData()
    return () => {
      isActive = false
    }
  }, [unitId])

  function toggleItem(kode: string) {
    // Checkbox mengubah pilihan lokal; perubahan baru disimpan saat submit.
    setSelected((prev) =>
      prev.includes(kode) ? prev.filter((item) => item !== kode) : [...prev, kode]
    )
  }

  function toggleAll() {
    if (selected.length === facilities.length) {
      setSelected([])
    } else {
      setSelected(facilities.map((f) => f.kode_facility))
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!unitId) return

    setIsSaving(true)
    setError("")
    try {
      // Kirim seluruh daftar pilihan agar server menyinkronkan relasi unit-facility.
      const response = await fetch(`/api/type/${unitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode_facilities: selected }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message ?? result.error ?? "Gagal menyimpan fasilitas unit.")
      router.push("/admin/type_unit")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan fasilitas unit.")
    } finally {
      setIsSaving(false)
    }
  }

  const isAllChecked = facilities.length > 0 && selected.length === facilities.length

  return (
    <Card className="m-0 w-full gap-0 rounded-2xl bg-card px-4 py-5 shadow-sm ring-1 ring-foreground/10 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">
            {unit ? `Atur Fasilitas: ${unit.nama_type_unit}` : "Atur Fasilitas Unit"}
          </h1>
          {unit && (
            <p className="mt-1 text-xs text-muted-foreground">
              Branch {unit.branch_id} &bull; {selected.length} dari {facilities.length} fasilitas dipilih
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => router.push("/admin/type_unit")}
        >
          <ArrowLeft aria-hidden="true" />
          Kembali
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {!unitId ? (
        <p className="mt-5 text-sm text-destructive">ID Type Unit tidak ditemukan di URL.</p>
      ) : isLoading ? (
        <p role="status" className="mt-5 text-sm text-muted-foreground">Memuat daftar fasilitas...</p>
      ) : !unit ? null : (
        // Setiap baris mewakili facility yang dapat dipilih untuk unit ini.
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div className="max-h-[min(60vh,24rem)] overflow-auto rounded-lg border border-border">
            <Table className="text-xs">
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-9 w-10 px-3">
                    <input
                      type="checkbox"
                      checked={isAllChecked}
                      onChange={toggleAll}
                      aria-label="Pilih semua fasilitas"
                      className="size-4 cursor-pointer accent-primary"
                    />
                  </TableHead>
                  <TableHead className="h-9 w-32 px-3 font-semibold">Kode Facility</TableHead>
                  <TableHead className="h-9 px-3 font-semibold">Nama Facility</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facilities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-16 px-3 text-center text-muted-foreground">
                      Belum ada fasilitas untuk dipilih.
                    </TableCell>
                  </TableRow>
                ) : (
                  facilities.map((item) => {
                    const checked = selected.includes(item.kode_facility)
                    return (
                      <TableRow
                        key={item.kode_facility}
                        onClick={() => toggleItem(item.kode_facility)}
                        className={`h-10 cursor-pointer ${checked ? "bg-primary/5" : ""}`}
                      >
                        <TableCell className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleItem(item.kode_facility)}
                            aria-label={`Pilih ${item.nama_facility}`}
                            className="size-4 cursor-pointer accent-primary"
                          />
                        </TableCell>
                        <TableCell className="px-3 py-2 font-medium">{item.kode_facility}</TableCell>
                        <TableCell className="whitespace-normal px-3 py-2">{item.nama_facility}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => router.push("/admin/type_unit")}
              disabled={isSaving}
            >
              <X aria-hidden="true" />
              Batal
            </Button>
            <Button type="submit" size="sm" className="rounded-full" disabled={isSaving || facilities.length === 0}>
              <Save aria-hidden="true" />
              {isSaving ? "Menyimpan..." : "Simpan fasilitas"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}
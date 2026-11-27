// File ini berjalan di browser karena memakai state dan menangani aksi pengguna.
'use client';

// Hook React untuk efek samping saat halaman dibuka dan state halaman.
import { useEffect, useState } from 'react';
// Router Next.js untuk berpindah ke halaman pengaturan fasilitas unit.
import { useRouter } from 'next/navigation';
// Komponen tombol dan input bersama agar tampilan form konsisten.
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Komponen tabel yang membentuk daftar Type Unit.
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// Ikon visual untuk aksi mengatur fasilitas, menambah, dan menghapus unit.
import { CheckSquare, Plus, Trash2 } from 'lucide-react';

// Bentuk data Type Unit yang dikirim oleh endpoint /api/type.
interface TypeUnitItem {
  // ID database yang dipakai untuk membuka detail atau menghapus unit.
  id_unit_type: number;
  // Nama yang ditampilkan pada tabel dan konfirmasi penghapusan.
  nama_type_unit: string;
  // Identitas cabang tempat unit tersebut berada.
  branch_id: string;
  // Jumlah relasi facility yang saat ini terpasang ke unit.
  total_facilities: number;
}

// Halaman untuk melihat, membuat, menghapus, dan membuka pengaturan Type Unit.
export default function TypeUnitPage() {
  // Digunakan untuk berpindah halaman tanpa pemuatan ulang penuh.
  const router = useRouter();
  // Daftar Type Unit yang ditampilkan di tabel.
  const [units, setUnits] = useState<TypeUnitItem[]>([]);
  // Mengendalikan tampilan loading selama data daftar sedang diminta.
  const [loading, setLoading] = useState(true);
  // Nilai nama unit yang sedang diketik pada form tambah.
  const [namaUnit, setNamaUnit] = useState('');
  // Branch yang dipilih; nilai awalnya adalah Branch 1.
  const [branchId, setBranchId] = useState('1');
  // Mencegah submit berulang dan mengubah label tombol saat menyimpan.
  const [submitting, setSubmitting] = useState(false);
  // ID unit yang sedang dihapus, agar tombol hapus unit itu saja dinonaktifkan.
  const [deletingId, setDeletingId] = useState<number | null>(null);
  // Pesan kesalahan dari proses memuat, menambah, atau menghapus.
  const [error, setError] = useState('');

  async function fetchUnits(): Promise<TypeUnitItem[]> {
    const res = await fetch('/api/type', { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message ?? data.error ?? 'Gagal memuat data type unit.');
    }
    if (!Array.isArray(data)) {
      throw new Error('Format data type unit tidak valid.');
    }
    return data;
  }

  // Muat kembali daftar unit; juga dipakai setelah tambah atau hapus.
  const loadUnits = async () => {
    try {
      setUnits(await fetchUnits());
    } catch (err) {
      // Simpan pesan error yang bisa dibaca, dengan pesan umum sebagai cadangan.
      setError(err instanceof Error ? err.message : 'Gagal memuat data type unit.');
    } finally {
      // Akhiri status loading baik permintaan berhasil maupun gagal.
      setLoading(false);
    }
  };

  // Jalankan permintaan awal sekali ketika halaman Type Unit dibuka.
  useEffect(() => {
    let isActive = true;

    async function loadInitialUnits() {
      try {
        const data = await fetchUnits();
        if (isActive) setUnits(data);
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Gagal memuat data type unit.');
        }
      } finally {
        if (isActive) setLoading(false);
      }
    }

    void loadInitialUnits();
    return () => {
      isActive = false;
    };
  }, []);

  // Memvalidasi lalu mengirim data form untuk membuat Type Unit baru.
  const handleAdd = async (e: React.FormEvent) => {
    // Cegah browser mengirim form dengan navigasi halaman bawaan.
    e.preventDefault();
    // Buang spasi di awal/akhir sebelum memeriksa dan mengirim nama unit.
    const trimmedNamaUnit = namaUnit.trim();
    // Tolak nama kosong di sisi tampilan sebelum memanggil API.
    if (!trimmedNamaUnit) {
      setError('Nama type unit wajib diisi.');
      return;
    }
    // Tampilkan status simpan dan hapus pesan error sebelumnya.
    setSubmitting(true);
    setError('');
    try {
      // Kirim nama unit dan branch dalam format JSON ke endpoint pembuatan.
      const res = await fetch('/api/type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_type_unit: trimmedNamaUnit,
          branch_id: branchId,
        }),
      });
      // Baca respons untuk memeriksa keberhasilan atau memperoleh pesan API.
      const data = await res.json();
      // Ubah respons gagal menjadi error agar ditampilkan pada bagian error.
      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? 'Gagal menambahkan type unit.');
      }

      // Kosongkan input dan sinkronkan tabel setelah server berhasil membuat unit.
      setNamaUnit('');
      await loadUnits();
    } catch (err) {
      // Tampilkan alasan kegagalan request, jika tersedia.
      setError(err instanceof Error ? err.message : 'Gagal menambahkan type unit.');
    } finally {
      // Aktifkan kembali tombol submit setelah proses selesai.
      setSubmitting(false);
    }
  };

  // Meminta persetujuan lalu menghapus unit yang dipilih.
  const handleDelete = async (unit: TypeUnitItem) => {
    // Batalkan aksi jika pengguna memilih Cancel pada dialog browser.
    if (!confirm(`Yakin ingin menghapus type unit "${unit.nama_type_unit}"?`)) return;

    // Tandai baris yang sedang dihapus dan bersihkan error lama.
    setDeletingId(unit.id_unit_type);
    setError('');
    try {
      // Kirim permintaan DELETE untuk ID unit yang dipilih.
      const res = await fetch(`/api/type/${unit.id_unit_type}`, {
        method: 'DELETE',
      });
      // Periksa status HTTP dan baca kemungkinan pesan kesalahan.
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? 'Gagal menghapus type unit.');
      }
      // Muat ulang tabel agar unit yang terhapus tidak lagi ditampilkan.
      await loadUnits();
    } catch (err) {
      // Tampilkan error penghapusan tanpa menghilangkan daftar yang sedang terlihat.
      setError(err instanceof Error ? err.message : 'Gagal menghapus type unit.');
    } finally {
      // Hapus penanda loading khusus tombol hapus setelah proses selesai.
      setDeletingId(null);
    }
  };

  return (
    // Pembungkus utama mengatur jarak antarbagian pada halaman.
    <div className="p-6 space-y-6">
      {/* Judul dan petunjuk interaksi tabel. */}
      <div>
        <h1 className="text-2xl font-bold">Type Unit Management</h1>
        <p className="text-sm text-muted-foreground">
          Klik salah satu baris tipe unit untuk mengatur daftar fasilitas (checkbox).
        </p>
      </div>

      {/* Pesan error ditandai sebagai alert agar pembaca layar mengumumkannya. */}
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          Error: {error}
        </p>
      )}

      {/* Form tambah unit; submit ditangani oleh handleAdd di atas. */}
      <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-3">
        {/* Input nama unit dikontrol oleh state namaUnit. */}
        <Input
          placeholder="Nama type unit (contoh: Penthouse)"
          value={namaUnit}
          onChange={(e) => setNamaUnit(e.target.value)}
          required
          className="max-w-xs"
        />
        {/* Pilihan branch disimpan sebagai string karena nilai option berbentuk teks. */}
        <select
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="1">Branch 1</option>
          <option value="2">Branch 2</option>
        </select>
        {/* Tombol submit dinonaktifkan ketika request tambah masih berjalan. */}
        <Button type="submit" disabled={submitting}>
          <Plus className="w-4 h-4 mr-2" />
          {submitting ? 'Menyimpan...' : 'Tambah Type Unit'}
        </Button>
      </form>

      {/* Bagian tabel untuk menampilkan status dan data seluruh unit. */}
      <div className="rounded-xl border bg-card">
        {/* Baris unit membuka pengaturan fasilitas; tombol hapus punya aksi tersendiri. */}
        <Table>
          {/* Nama kolom yang menjelaskan isi setiap sel tabel. */}
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">No</TableHead>
              <TableHead>Nama Type Unit</TableHead>
              <TableHead className="w-36">Branch</TableHead>
              <TableHead className="w-48">Fasilitas Terpasang</TableHead>
              <TableHead className="w-56 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          {/* Tampilkan loading, keadaan kosong, atau baris Type Unit. */}
          <TableBody>
            {/* Placeholder saat permintaan data awal atau refresh berlangsung. */}
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  Memuat data type unit...
                </TableCell>
              </TableRow>
            // Jika data berhasil dimuat tetapi tidak ada unit, tampilkan pesan kosong.
            ) : units.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  Belum ada data type unit.
                </TableCell>
              </TableRow>
            // Selain itu, buat satu baris tabel untuk setiap unit dari API.
            ) : (
              units.map((unit, index) => (
                // Klik area baris membuka halaman untuk mengatur facility unit ini.
                <TableRow
                  key={unit.id_unit_type}
                  onClick={() =>
                    router.push(`/admin/type_unit/form/${unit.id_unit_type}`)
                  }
                  className="cursor-pointer hover:bg-muted/50"
                >
                  {/* Nomor urut baris dimulai dari 1. */}
                  <TableCell className="font-medium">
                    {index + 1}
                  </TableCell>
                  {/* Kolom identitas unit dan branch. */}
                  <TableCell>{unit.nama_type_unit}</TableCell>
                  <TableCell>Branch {unit.branch_id}</TableCell>
                  {/* Badge menunjukkan jumlah facility yang sudah dipasang. */}
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {unit.total_facilities} fasilitas
                    </span>
                  </TableCell>
                  {/* Aksi eksplisit untuk mengatur fasilitas atau menghapus unit. */}
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          // Cegah klik tombol memicu navigasi klik baris induk.
                          e.stopPropagation();
                          // Buka halaman checklist facility untuk unit ini.
                          router.push(`/admin/type_unit/form/${unit.id_unit_type}`);
                        }}
                      >
                        <CheckSquare className="w-4 h-4 mr-2" />
                        Atur Fasilitas
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={deletingId === unit.id_unit_type}
                        onClick={(e) => {
                          // Hindari klik tombol hapus ikut membuka detail unit.
                          e.stopPropagation();
                          // Jalankan konfirmasi dan request hapus untuk unit aktif.
                          handleDelete(unit);
                        }}
                        title="Hapus type unit"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ChangeEvent } from "react";

export default function AddUserPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    role: "siswa",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError(false);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menambahkan user.");
      }

      setMessage("User berhasil ditambahkan!");

      setTimeout(() => {
        router.push("/admin/user-management");
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(true);
      setMessage(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan user."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Tambah User
        </h1>

        <p className="text-sm text-gray-500 mt-2">
          Tambahkan akun pengguna baru di SMK MVP ARS INTERNASIONAL.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-3xl">
        {message && (
          <div
            className={`mb-5 rounded-lg border p-4 text-sm ${
              error
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-green-50 border-green-200 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Nama Lengkap
            </label>

            <input
              type="text"
              name="fullname"
              value={form.fullname}
              onChange={handleChange}
              placeholder="Masukkan nama lengkap"
              required
              maxLength={100}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Masukkan email"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Password
            </label>

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Minimal 8 karakter"
              minLength={8}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Role Pengguna
            </label>

            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white outline-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="siswa">Siswa</option>
              <option value="guru">Guru</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            <Link
              href="/admin/user-management"
              className="px-5 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Batal
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Menyimpan..." : "Simpan User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
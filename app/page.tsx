"use client";

import Image from "next/image";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

import { MenuLandingPage } from "./component/landing-page-menu/menu";
import { LandingPageHero } from "./component/landing-page-hero/hero";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

import { SearchIcon, X } from "lucide-react";

export default function Home() {
  const router = useRouter();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // ==============================
  // PROSES LOGIN
  // ==============================

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      // Alamat API sesuai folder:
      // app/api/auth/login/route.ts

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Login gagal. Periksa email dan password.";
        setError(message);
        return;
      }

      if (
        typeof result !== "object" ||
        result === null ||
        !("user" in result) ||
        !result.user
      ) {
        setError("Data pengguna tidak ditemukan.");
        return;
      }

      // LOGIN BERHASIL
      // Arahkan ke dashboard admin

      router.push("/admin");
      router.refresh();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat login."
      );

    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative w-full bg-white dark:bg-black">

      {/* HERO */}

      <div className="relative z-0 -mt-[96px]">
        <LandingPageHero />
      </div>

      {/* NAVBAR */}

      <div className="absolute top-0 left-0 z-10 flex w-full justify-center">

        <div className="mx-8 mt-4 flex h-[80px] w-[95%] rounded-[70px] bg-emerald-800 p-4 dark:bg-emerald-800">

          {/* LOGO */}

          <div className="relative h-[50px] w-[200px] items-center justify-start rounded-[70px]">

            <Image
              className="p-[1px]"
              src="/img/Yamada Ryo.jpg"
              alt="Logo "
              fill
              priority
            />

          </div>

          {/* MENU */}

          <div className="flex flex-1 items-center justify-center">
            <MenuLandingPage />
          </div>

          {/* TOMBOL LOGIN */}

          <div className="flex items-center justify-end p-4">

            <Button
              onClick={() => {
                setIsLoginOpen(true);
                setError("");
              }}
              className="
                rounded-full
                border border-gray-300
                bg-white
                p-[20px]
                text-[16px]
                font-semibold
                text-emerald-700
                hover:bg-gray-100
                dark:border-gray-700
                dark:bg-gray-800
                dark:text-emerald-400
              "
              size="lg"
            >
              Login
            </Button>

          </div>

        </div>

      </div>

      {/* POPUP LOGIN */}

      {isLoginOpen && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">

          <div className="relative w-full max-w-[500px] rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900">

            {/* TOMBOL TUTUP */}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Tutup form login"
              onClick={() => {
                setIsLoginOpen(false);
                setError("");
              }}
              className="absolute right-3 top-3"
            >
              <X />
            </Button>

            {/* FORM LOGIN */}

            <form onSubmit={handleLogin}>

              <Field className="w-full space-y-4 pt-2">

                {/* EMAIL */}

                <FieldLabel htmlFor="email-input">
                  Email
                </FieldLabel>

                <InputGroup>

                  <InputGroupInput
                    id="email-input"
                    type="email"
                    placeholder="Masukkan email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />

                  <InputGroupAddon align="inline-start">
                    <SearchIcon className="text-muted-foreground" />
                  </InputGroupAddon>

                </InputGroup>

                {/* PASSWORD */}

                <FieldLabel htmlFor="password-input">
                  Password
                </FieldLabel>

                <InputGroup>

                  <InputGroupInput
                    id="password-input"
                    type="password"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />

                  <InputGroupAddon align="inline-start">
                    <SearchIcon className="text-muted-foreground" />
                  </InputGroupAddon>

                </InputGroup>

                {/* PESAN ERROR */}

                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
                  >
                    {error}
                  </div>
                )}

                {/* TOMBOL SUBMIT */}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading
                    ? "Memproses login..."
                    : "Submit"}
                </Button>

              </Field>

            </form>

          </div>

        </div>

      )}

    </main>
  );
}
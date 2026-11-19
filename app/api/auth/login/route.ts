import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createUserJwt,
  verifyUserPassword,
} from "@/lib/user-security";

export async function POST(request: Request) {
  try {
    // Mengambil data dari form login
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    // Validasi input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email dan password wajib diisi.",
        },
        { status: 400 }
      );
    }

    // Memeriksa konfigurasi JWT
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET belum tersedia.");

      return NextResponse.json(
        {
          success: false,
          error: "Konfigurasi login belum lengkap.",
        },
        { status: 500 }
      );
    }

    // Mencari pengguna berdasarkan email
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
      select: {
        id: true,
        fullname: true,
        email: true,
        password: true,
        role: true,
      },
    });

    // Memeriksa akun dan password
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Email atau password salah.",
        },
        { status: 401 }
      );
    }

    const passwordValid = await verifyUserPassword(
      password,
      user.password
    );

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Email atau password salah.",
        },
        { status: 401 }
      );
    }

    // Membuat JWT
    const token = createUserJwt({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Membuat response login berhasil
    const response = NextResponse.json({
      success: true,
      message: "Login berhasil.",
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    });

    // Menyimpan token dalam cookie HTTP-only
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Login gagal. Periksa koneksi database dan konfigurasi login.",
      },
      { status: 500 }
    );
  }
}
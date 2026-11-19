import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashUserPassword } from "@/lib/user-security";

// ==========================================
// GET: MENAMPILKAN DATA USER
// ==========================================

export async function GET() {
  if (!(await getAuthenticatedUser())) return unauthorizedResponse();

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullname: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });

  } catch (error) {
    console.error("GET USERS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal memuat data user.",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// POST: TAMBAH USER
// ==========================================

export async function POST(request: Request) {
  if (!(await getAuthenticatedUser())) return unauthorizedResponse();

  try {
    const body = await request.json();

    const fullname = String(body.fullname ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const role = String(body.role ?? "").trim().toLowerCase();

    // VALIDASI INPUT

    if (!fullname || !email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          message: "Semua field wajib diisi.",
        },
        { status: 400 }
      );
    }

    // VALIDASI EMAIL

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Format email tidak valid.",
        },
        { status: 400 }
      );
    }

    // VALIDASI PASSWORD

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password minimal 8 karakter.",
        },
        { status: 400 }
      );
    }

    // VALIDASI ROLE

    const allowedRoles = ["admin", "guru", "siswa"];

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Role tidak valid.",
        },
        { status: 400 }
      );
    }

    // CEK EMAIL DUPLIKAT

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Email sudah terdaftar.",
        },
        { status: 409 }
      );
    }

    // ENKRIPSI PASSWORD MENGGUNAKAN SCRYPT

    const hashedPassword = await hashUserPassword(password);

    // SIMPAN USER KE DATABASE

    const user = await prisma.user.create({
      data: {
        fullname,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        fullname: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "User berhasil ditambahkan.",
        data: user,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("POST USER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menyimpan user.",
      },
      { status: 500 }
    );
  }
}
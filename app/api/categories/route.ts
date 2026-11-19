import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_PAGE_SIZE = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPositiveInteger(value: string | null, fallback: number) {
  if (!value) return fallback;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(request: Request) {
  if (!(await getAuthenticatedUser())) return unauthorizedResponse();

  const searchParams = new URL(request.url).searchParams;
  const page = getPositiveInteger(searchParams.get("page"), 1);
  const pageSize = getPositiveInteger(searchParams.get("pageSize"), 10);

  if (page === null || pageSize === null || pageSize > MAX_PAGE_SIZE) {
    return NextResponse.json(
      { success: false, message: "Parameter halaman tidak valid." },
      { status: 400 }
    );
  }

  try {
    const [categories, totalCategories] = await Promise.all([
      prisma.category.findMany({
        orderBy: { id: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.category.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: categories,
      pagination: {
        page,
        pageSize,
        totalCategories,
        totalPages: Math.ceil(totalCategories / pageSize),
      },
    });
  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Gagal memuat data kategori." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await getAuthenticatedUser())) return unauthorizedResponse();

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Format request tidak valid." },
      { status: 400 }
    );
  }

  const name =
    isRecord(body) && typeof body.name === "string" ? body.name.trim() : "";

  if (!name || name.length > 191) {
    return NextResponse.json(
      {
        success: false,
        message: "Nama kategori wajib diisi dan maksimal 191 karakter.",
      },
      { status: 400 }
    );
  }

  try {
    const category = await prisma.category.create({
      data: { name },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Kategori berhasil ditambahkan.",
        data: category,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST CATEGORY ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Gagal menyimpan kategori." },
      { status: 500 }
    );
  }
}

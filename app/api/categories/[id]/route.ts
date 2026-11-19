import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMissingCategory(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2025"
  );
}

async function getCategoryId(context: RouteContext) {
  const { id } = await context.params;
  const categoryId = Number(id);

  return Number.isInteger(categoryId) && categoryId > 0 ? categoryId : null;
}

export async function GET(_request: Request, context: RouteContext) {
  if (!(await getAuthenticatedUser())) return unauthorizedResponse();

  const categoryId = await getCategoryId(context);

  if (!categoryId) {
    return NextResponse.json(
      { success: false, message: "ID kategori tidak valid." },
      { status: 400 }
    );
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Kategori tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("GET CATEGORY ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Gagal memuat data kategori." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await getAuthenticatedUser())) return unauthorizedResponse();

  const categoryId = await getCategoryId(context);

  if (!categoryId) {
    return NextResponse.json(
      { success: false, message: "ID kategori tidak valid." },
      { status: 400 }
    );
  }

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
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: { name },
    });

    return NextResponse.json({
      success: true,
      message: "Kategori berhasil diperbarui.",
      category,
    });
  } catch (error) {
    if (isMissingCategory(error)) {
      return NextResponse.json(
        { success: false, message: "Kategori tidak ditemukan." },
        { status: 404 }
      );
    }

    console.error("PATCH CATEGORY ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Gagal memperbarui kategori." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await getAuthenticatedUser())) return unauthorizedResponse();

  const categoryId = await getCategoryId(context);

  if (!categoryId) {
    return NextResponse.json(
      { success: false, message: "ID kategori tidak valid." },
      { status: 400 }
    );
  }

  try {
    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({
      success: true,
      message: "Kategori berhasil dihapus.",
    });
  } catch (error) {
    if (isMissingCategory(error)) {
      return NextResponse.json(
        { success: false, message: "Kategori tidak ditemukan." },
        { status: 404 }
      );
    }

    console.error("DELETE CATEGORY ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Gagal menghapus kategori." },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMissingFacility(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2025"
  );
}

async function getFacilityCode(context: RouteContext) {
  const { id } = await context.params;
  const kodeFacility = id.trim();

  return kodeFacility.length > 0 && kodeFacility.length <= 191
    ? kodeFacility
    : null;
}

export async function GET(_request: Request, context: RouteContext) {
  if (!(await getAuthenticatedUser())) return unauthorizedResponse();

  const kodeFacility = await getFacilityCode(context);

  if (!kodeFacility) {
    return NextResponse.json(
      { success: false, message: "Kode fasilitas tidak valid." },
      { status: 400 }
    );
  }

  try {
    const facility = await prisma.facility.findUnique({
      where: { kodeFacility },
    });

    if (!facility) {
      return NextResponse.json(
        { success: false, message: "Fasilitas tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, facility });
  } catch (error) {
    console.error("GET FACILITY ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Gagal memuat data fasilitas." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await getAuthenticatedUser())) return unauthorizedResponse();

  const kodeFacility = await getFacilityCode(context);

  if (!kodeFacility) {
    return NextResponse.json(
      { success: false, message: "Kode fasilitas tidak valid." },
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
        message: "Nama fasilitas wajib diisi dan maksimal 191 karakter.",
      },
      { status: 400 }
    );
  }

  try {
    const facility = await prisma.facility.update({
      where: { kodeFacility },
      data: { namaFacility: name },
    });

    return NextResponse.json({
      success: true,
      message: "Fasilitas berhasil diperbarui.",
      facility,
    });
  } catch (error) {
    if (isMissingFacility(error)) {
      return NextResponse.json(
        { success: false, message: "Fasilitas tidak ditemukan." },
        { status: 404 }
      );
    }

    console.error("PATCH FACILITY ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Gagal memperbarui fasilitas." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await getAuthenticatedUser())) return unauthorizedResponse();

  const kodeFacility = await getFacilityCode(context);

  if (!kodeFacility) {
    return NextResponse.json(
      { success: false, message: "Kode fasilitas tidak valid." },
      { status: 400 }
    );
  }

  try {
    await prisma.facility.delete({
      where: { kodeFacility },
    });

    return NextResponse.json({
      success: true,
      message: "Fasilitas berhasil dihapus.",
    });
  } catch (error) {
    if (isMissingFacility(error)) {
      return NextResponse.json(
        { success: false, message: "Fasilitas tidak ditemukan." },
        { status: 404 }
      );
    }

    console.error("DELETE FACILITY ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Gagal menghapus fasilitas." },
      { status: 500 }
    );
  }
}

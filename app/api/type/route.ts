import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET() {
  if (!(await getAuthenticatedUser())) return unauthorizedResponse();

  try {
    const units = await prisma.typeUnit.findMany({
      orderBy: { idUnitType: "desc" },
      include: { _count: { select: { facilities: true } } },
    });

    return NextResponse.json(
      units.map((unit) => ({
        id_unit_type: unit.idUnitType,
        nama_type_unit: unit.namaTypeUnit,
        branch_id: unit.branchId,
        total_facilities: unit._count.facilities,
      }))
    );
  } catch (error) {
    console.error("GET TYPE UNITS ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data type unit." },
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

  const namaTypeUnit =
    isRecord(body) && typeof body.nama_type_unit === "string"
      ? body.nama_type_unit.trim()
      : "";
  const branchId =
    isRecord(body) && typeof body.branch_id === "string"
      ? body.branch_id.trim()
      : "";

  if (!namaTypeUnit || namaTypeUnit.length > 191 || !branchId || branchId.length > 191) {
    return NextResponse.json(
      {
        success: false,
        message: "Nama type unit dan branch wajib diisi (maksimal 191 karakter).",
      },
      { status: 400 }
    );
  }

  try {
    const unit = await prisma.typeUnit.create({
      data: { namaTypeUnit, branchId },
    });

    return NextResponse.json(
      {
        id_unit_type: unit.idUnitType,
        nama_type_unit: unit.namaTypeUnit,
        branch_id: unit.branchId,
        total_facilities: 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST TYPE UNIT ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menambahkan type unit." },
      { status: 500 }
    );
  }
}

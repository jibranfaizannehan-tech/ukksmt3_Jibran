import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getId(value: string) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isMissingRecord(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2025"
  );
}

export async function GET(_request: Request, context: RouteContext) {
  if (!(await getAuthenticatedUser())) return unauthorizedResponse();

  const id = getId((await context.params).id);
  if (id === null) {
    return NextResponse.json(
      { success: false, message: "ID type unit tidak valid." },
      { status: 400 }
    );
  }

  try {
    const [unit, facilities] = await Promise.all([
      prisma.typeUnit.findUnique({
        where: { idUnitType: id },
        include: { facilities: { select: { kodeFacility: true } } },
      }),
      prisma.facility.findMany({
        orderBy: { kodeFacility: "asc" },
        select: { kodeFacility: true, namaFacility: true },
      }),
    ]);

    if (!unit) {
      return NextResponse.json(
        { success: false, message: "Type unit tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      unit: {
        id_unit_type: unit.idUnitType,
        nama_type_unit: unit.namaTypeUnit,
        branch_id: unit.branchId,
      },
      facilities: facilities.map((facility) => ({
        kode_facility: facility.kodeFacility,
        nama_facility: facility.namaFacility,
      })),
      selectedCodes: unit.facilities.map((facility) => facility.kodeFacility),
    });
  } catch (error) {
    console.error("GET TYPE UNIT ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data fasilitas unit." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  if (!(await getAuthenticatedUser())) return unauthorizedResponse();

  const id = getId((await context.params).id);
  if (id === null) {
    return NextResponse.json(
      { success: false, message: "ID type unit tidak valid." },
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

  if (
    !isRecord(body) ||
    !Array.isArray(body.kode_facilities) ||
    !body.kode_facilities.every(
      (code) => typeof code === "string" && code.trim().length > 0 && code.trim().length <= 191
    )
  ) {
    return NextResponse.json(
      { success: false, message: "Daftar kode fasilitas tidak valid." },
      { status: 400 }
    );
  }

  const facilityCodes = [...new Set(body.kode_facilities.map((code) => code.trim()))];

  try {
    const foundFacilities = await prisma.facility.findMany({
      where: { kodeFacility: { in: facilityCodes } },
      select: { kodeFacility: true },
    });
    if (foundFacilities.length !== facilityCodes.length) {
      return NextResponse.json(
        { success: false, message: "Satu atau beberapa fasilitas tidak ditemukan." },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (transaction) => {
      const unit = await transaction.typeUnit.findUnique({
        where: { idUnitType: id },
        select: { idUnitType: true },
      });
      if (!unit) return false;

      await transaction.typeUnitFacility.deleteMany({
        where: { idUnitType: id },
      });
      if (facilityCodes.length > 0) {
        await transaction.typeUnitFacility.createMany({
          data: facilityCodes.map((kodeFacility) => ({
            idUnitType: id,
            kodeFacility,
          })),
        });
      }
      return true;
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Type unit tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Fasilitas type unit berhasil diperbarui.",
    });
  } catch (error) {
    console.error("PUT TYPE UNIT ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan fasilitas unit." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await getAuthenticatedUser())) return unauthorizedResponse();

  const id = getId((await context.params).id);
  if (id === null) {
    return NextResponse.json(
      { success: false, message: "ID type unit tidak valid." },
      { status: 400 }
    );
  }

  try {
    await prisma.typeUnit.delete({ where: { idUnitType: id } });
    return NextResponse.json({
      success: true,
      message: "Type unit berhasil dihapus.",
    });
  } catch (error) {
    if (isMissingRecord(error)) {
      return NextResponse.json(
        { success: false, message: "Type unit tidak ditemukan." },
        { status: 404 }
      );
    }

    console.error("DELETE TYPE UNIT ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus type unit." },
      { status: 500 }
    );
  }
}

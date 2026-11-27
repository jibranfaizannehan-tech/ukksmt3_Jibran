import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_PAGE_SIZE = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveIntegerArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.every(
      (id) => typeof id === "number" && Number.isSafeInteger(id) && id > 0
    )
  );
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
    const [facilities, totalFacilities] = await Promise.all([
      prisma.facility.findMany({
        orderBy: { kodeFacility: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.facility.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: facilities,
      pagination: {
        page,
        pageSize,
        totalFacilities,
        totalPages: Math.ceil(totalFacilities / pageSize),
      },
    });
  } catch (error) {
    console.error("GET FACILITIES ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Gagal memuat data fasilitas." },
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
        message: "Nama fasilitas wajib diisi dan maksimal 191 karakter.",
      },
      { status: 400 }
    );
  }

  const rawTypeUnitIds = isRecord(body) ? body.id_unit_types : undefined;
  let typeUnitIds: number[] = [];
  if (rawTypeUnitIds !== undefined) {
    if (!isPositiveIntegerArray(rawTypeUnitIds)) {
      return NextResponse.json(
        { success: false, message: "Daftar Type Unit tidak valid." },
        { status: 400 }
      );
    }
    typeUnitIds = [...new Set(rawTypeUnitIds)];
  }

  try {
    if (typeUnitIds.length > 0) {
      const foundUnits = await prisma.typeUnit.findMany({
        where: { idUnitType: { in: typeUnitIds } },
        select: { idUnitType: true },
      });
      if (foundUnits.length !== typeUnitIds.length) {
        return NextResponse.json(
          { success: false, message: "Satu atau beberapa Type Unit tidak ditemukan." },
          { status: 400 }
        );
      }
    }

    const lastFacility = await prisma.facility.findFirst({
      orderBy: { kodeFacility: "desc" },
      select: { kodeFacility: true },
    });
    const lastCode = lastFacility?.kodeFacility;
    const sequence = lastCode ? /^FCT(\d+)$/.exec(lastCode) : null;

    if (lastCode && !sequence) {
      throw new Error("Kode facility terakhir tidak sesuai format FCT.");
    }

    const nextSequence = sequence ? Number(sequence[1]) + 1 : 1;
    const kodeFacility = `FCT${String(nextSequence).padStart(3, "0")}`;
    const facility = await prisma.$transaction(async (transaction) => {
      const createdFacility = await transaction.facility.create({
        data: { kodeFacility, namaFacility: name },
      });

      if (typeUnitIds.length > 0) {
        await transaction.typeUnitFacility.createMany({
          data: typeUnitIds.map((idUnitType) => ({
            idUnitType,
            kodeFacility,
          })),
        });
      }

      return createdFacility;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Fasilitas berhasil ditambahkan.",
        facility,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Kode fasilitas bentrok. Silakan coba lagi.",
        },
        { status: 409 }
      );
    }

    console.error("POST FACILITY ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Gagal menyimpan fasilitas." },
      { status: 500 }
    );
  }
}

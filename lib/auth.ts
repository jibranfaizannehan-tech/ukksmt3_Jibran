import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyUserJwt } from "@/lib/user-security";

export async function getAuthenticatedUser() {
  const token = (await cookies()).get("auth_token")?.value;

  if (!token) return null;

  const payload = verifyUserJwt(token);
  if (!payload) return null;

  const userId = Number(payload.sub);
  if (!Number.isSafeInteger(userId) || userId < 1) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullname: true, email: true, role: true },
  });

  if (
    !user ||
    user.email !== payload.email ||
    user.role !== payload.role
  ) {
    return null;
  }

  return user;
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, message: "Silakan login terlebih dahulu." },
    { status: 401 }
  );
}

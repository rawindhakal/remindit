import { NextRequest } from "next/server";
import { verifyMobileToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

export async function getMobileAuthUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  const payload = verifyMobileToken(token);
  if (!payload?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      timezone: true,
    },
  });

  return user;
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session?.user?.id || (role !== "admin" && role !== "super_admin")) {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role") || "";
    const statusFilter = searchParams.get("status") || "";

    const users = await prisma.user.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
          roleFilter ? { role: roleFilter } : {},
          statusFilter ? { status: statusFilter } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        timezone: true,
        emailVerifiedAt: true,
        createdAt: true,
        _count: {
          select: {
            reminders: true,
            pushSubscriptions: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("[admin users GET]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch users" } },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session?.user?.id || (role !== "admin" && role !== "super_admin")) {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 });
  }

  try {
    const { userId, newRole, newStatus } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "User ID is required" } }, { status: 400 });
    }

    // Protect super_admin self-demotion
    if (userId === session.user.id && newRole && newRole !== "super_admin") {
      return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "You cannot demote yourself from super_admin" } }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(newRole ? { role: newRole } : {}),
        ...(newStatus ? { status: newStatus } : {}),
      },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[admin users PATCH]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update user" } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session?.user?.id || role !== "super_admin") {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Super admin access required" } }, { status: 403 });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "User ID is required" } }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "You cannot delete your own account from admin panel" } }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true, data: { message: "User deleted permanently" } });
  } catch (error) {
    console.error("[admin users DELETE]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to delete user" } },
      { status: 500 }
    );
  }
}

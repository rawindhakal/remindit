import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDaysRemaining, computeStatus } from "@/lib/utils";
import { DEFAULT_REMINDER_SCHEDULE } from "./constants";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "expiry_date";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "asc";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 100);

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    const timezone = user?.timezone || "Asia/Kathmandu";

    // Build where clause
    const where: Record<string, unknown> = {
      userId: session.user.id,
      status: { not: "deleted" },
    };

    if (categoryId) where.categoryId = categoryId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { ownerName: { contains: search, mode: "insensitive" } },
        { referenceNumber: { contains: search, mode: "insensitive" } },
        { providerName: { contains: search, mode: "insensitive" } },
      ];
    }

    // Sort mapping
    const sortMapping: Record<string, Record<string, string>> = {
      expiry_date: { expiryDate: sortOrder },
      created_at: { createdAt: sortOrder },
      title: { title: sortOrder },
    };
    const orderBy = sortMapping[sortBy] || { expiryDate: "asc" };

    const [reminders, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
        include: {
          category: true,
          reminderSchedules: { where: { enabled: true }, orderBy: { daysBefore: "desc" } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.reminder.count({ where }),
    ]);

    // Enrich with computed days remaining and status
    const enriched = reminders.map((r) => {
      const daysRemaining = getDaysRemaining(r.expiryDate, timezone);
      const computedStatus = computeStatus(daysRemaining);
      return { ...r, daysRemaining, computedStatus };
    });

    // Filter by computed status if requested
    const filtered = status
      ? enriched.filter((r) => r.computedStatus === status)
      : enriched;

    return NextResponse.json({
      success: true,
      data: {
        data: filtered,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("[reminders GET]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch reminders" } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      categoryId,
      title,
      description,
      ownerName,
      referenceNumber,
      providerName,
      startDate,
      expiryDate,
      isRecurring = false,
      recurrenceType,
      metadata = {},
      schedules,
    } = body;

    if (!title || !expiryDate) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Title and expiry date are required" } },
        { status: 400 }
      );
    }

    // Get category for default schedule
    let category = null;
    if (categoryId) {
      category = await prisma.category.findUnique({ where: { id: categoryId } });
    }

    // Determine schedule: use provided or category defaults
    const scheduleDays: number[] =
      schedules?.map((s: { daysBefore: number }) => s.daysBefore) ??
      category?.defaultSchedule ??
      DEFAULT_REMINDER_SCHEDULE;

    const reminder = await prisma.reminder.create({
      data: {
        userId: session.user.id,
        categoryId: categoryId || null,
        title,
        description,
        ownerName,
        referenceNumber,
        providerName,
        startDate: startDate ? new Date(startDate) : null,
        expiryDate: new Date(expiryDate),
        isRecurring,
        recurrenceType,
        metadata,
        reminderSchedules: {
          create: scheduleDays.map((days: number) => ({
            daysBefore: days,
            channel: "email",
            enabled: true,
            sendTime: "08:00",
          })),
        },
      },
      include: {
        category: true,
        reminderSchedules: true,
      },
    });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    const timezone = user?.timezone || "Asia/Kathmandu";
    const daysRemaining = getDaysRemaining(reminder.expiryDate, timezone);
    const computedStatus = computeStatus(daysRemaining);

    return NextResponse.json(
      { success: true, data: { ...reminder, daysRemaining, computedStatus } },
      { status: 201 }
    );
  } catch (error) {
    console.error("[reminders POST]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to create reminder" } },
      { status: 500 }
    );
  }
}

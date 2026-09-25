import { NextRequest, NextResponse } from "next/server";
import { getMobileAuthUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { getDaysRemaining, computeStatus } from "@/lib/utils";

const DEFAULT_SCHEDULE = [30, 15, 7, 3, 1, 0];

export async function GET(req: NextRequest) {
  const user = await getMobileAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // all, active, due_soon, today, expired
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(
      parseInt(searchParams.get("pageSize") || "50", 10),
      100
    );

    const timezone = user.timezone || "Asia/Kathmandu";

    const where: any = {
      userId: user.id,
      status: { not: "deleted" },
    };

    if (categoryId && categoryId !== "all") {
      where.categoryId = categoryId;
    }

    if (search && search.trim() !== "") {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { ownerName: { contains: q } },
        { referenceNumber: { contains: q } },
        { providerName: { contains: q } },
      ];
    }

    const [reminders, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
        include: {
          category: true,
          reminderSchedules: {
            where: { enabled: true },
            orderBy: { daysBefore: "desc" },
          },
        },
        orderBy: { expiryDate: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.reminder.count({ where }),
    ]);

    let enriched = reminders.map((r) => {
      const daysRemaining = getDaysRemaining(r.expiryDate, timezone);
      const computedStatus = computeStatus(daysRemaining);
      return { ...r, daysRemaining, computedStatus };
    });

    if (status && status !== "all") {
      enriched = enriched.filter((r) => r.computedStatus === status);
    }

    return NextResponse.json({
      success: true,
      data: enriched,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error("[mobile reminders GET]", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch reminders" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getMobileAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
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
      schedules,
      documents = [],
    } = body;

    if (!title || !expiryDate) {
      return NextResponse.json(
        { success: false, message: "Title and expiry date are required" },
        { status: 400 }
      );
    }

    let category = null;
    if (categoryId) {
      category = await prisma.category.findUnique({
        where: { id: categoryId },
      });
    }

    let scheduleDays: number[] = DEFAULT_SCHEDULE;
    if (Array.isArray(schedules) && schedules.length > 0) {
      scheduleDays = schedules.map(Number);
    } else if (category && Array.isArray((category as any).defaultSchedule)) {
      scheduleDays = (category as any).defaultSchedule;
    }

    const metadata: any = {};
    if (Array.isArray(documents) && documents.length > 0) {
      metadata.documents = documents;
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId: user.id,
        categoryId: categoryId || null,
        title: title.trim(),
        description: description?.trim() || null,
        ownerName: ownerName?.trim() || null,
        referenceNumber: referenceNumber?.trim() || null,
        providerName: providerName?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        expiryDate: new Date(expiryDate),
        isRecurring: Boolean(isRecurring),
        recurrenceType: recurrenceType || null,
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

    return NextResponse.json({
      success: true,
      data: reminder,
    });
  } catch (error: any) {
    console.error("[mobile reminders POST]", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create reminder" },
      { status: 500 }
    );
  }
}

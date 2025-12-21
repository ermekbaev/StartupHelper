import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const currentUser = await getCurrentUser(authHeader);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's calendar events
    const events = await prisma.calendarEvent.findMany({
      where: { userId: currentUser.id },
      orderBy: { date: 'asc' },
    });

    // Get employees with birthdays for HR integration
    const employees = await prisma.employee.findMany({
      where: {
        userId: currentUser.id,
        status: 'ACTIVE',
        birthDate: { not: null },
      },
      select: {
        id: true,
        name: true,
        birthDate: true,
      },
    });

    // Get tasks with deadlines for checklist integration
    const tasks = await prisma.task.findMany({
      where: {
        checklist: { userId: currentUser.id },
        completed: false,
        deadline: { not: null },
      },
      include: {
        checklist: {
          select: { title: true },
        },
      },
    });

    // Generate financial report reminders (quarterly reports)
    const financialReminders = generateFinancialReminders(currentUser.id);

    return NextResponse.json({
      events,
      employees,
      tasks,
      financialReminders,
    });
  } catch (error) {
    console.error('Get calendar events error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const currentUser = await getCurrentUser(authHeader);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, date, time, location, priority, description } = body;

    if (!title || !date || !time) {
      return NextResponse.json(
        { error: 'Title, date and time are required' },
        { status: 400 }
      );
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        date: new Date(date),
        time,
        location: location || '',
        priority: priority?.toUpperCase() || 'NORMAL',
        description: description || '',
        userId: currentUser.id,
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Create calendar event error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const currentUser = await getCurrentUser(authHeader);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, completed } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const event = await prisma.calendarEvent.findFirst({
      where: { id, userId: currentUser.id },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const updatedEvent = await prisma.calendarEvent.update({
      where: { id },
      data: { completed },
    });

    return NextResponse.json({ event: updatedEvent });
  } catch (error) {
    console.error('Update calendar event error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const currentUser = await getCurrentUser(authHeader);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const event = await prisma.calendarEvent.findFirst({
      where: { id, userId: currentUser.id },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    await prisma.calendarEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete calendar event error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate financial report reminders
function generateFinancialReminders(userId: string) {
  const currentYear = new Date().getFullYear();
  const reminders = [];

  // Quarterly report deadlines (15th of the month after quarter end)
  const quarters = [
    { quarter: 1, month: 3, day: 15, label: 'Отчёт за 1 квартал' },
    { quarter: 2, month: 6, day: 15, label: 'Отчёт за 2 квартал' },
    { quarter: 3, month: 9, day: 15, label: 'Отчёт за 3 квартал' },
    { quarter: 4, month: 12, day: 15, label: 'Годовой отчёт' },
  ];

  quarters.forEach(q => {
    reminders.push({
      id: `finance-q${q.quarter}-${currentYear}`,
      title: q.label,
      date: new Date(currentYear, q.month, q.day),
      type: 'finance',
      priority: 'IMPORTANT',
    });
  });

  // Monthly tax payment reminders (25th of each month)
  for (let month = 0; month < 12; month++) {
    reminders.push({
      id: `tax-${month}-${currentYear}`,
      title: 'Уплата налогов',
      date: new Date(currentYear, month, 25),
      type: 'finance',
      priority: 'URGENT',
    });
  }

  return reminders;
}

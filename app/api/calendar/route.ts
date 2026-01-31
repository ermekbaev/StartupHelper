import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CalendarEventType } from '@prisma/client';

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

    // Get user's custom calendar events
    const customEvents = await prisma.calendarEvent.findMany({
      where: {
        userId: currentUser.id,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json({
      employees,
      tasks,
      customEvents,
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
    const { title, date, time, location, priority, description, eventType } = body;

    if (!title || !date) {
      return NextResponse.json(
        { error: 'Title and date are required' },
        { status: 400 }
      );
    }

    // Map frontend event type to database enum
    const eventTypeMap: Record<string, CalendarEventType> = {
      finance: CalendarEventType.FINANCE,
      report: CalendarEventType.REPORT,
      birthday: CalendarEventType.BIRTHDAY,
      deadline: CalendarEventType.DEADLINE,
      custom: CalendarEventType.CUSTOM,
    };
    const dbEventType = eventTypeMap[eventType] || CalendarEventType.CUSTOM;

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        date: new Date(date),
        time: time || '',
        location: location || '',
        priority: priority || 'NORMAL',
        eventType: dbEventType,
        description: description || null,
        userId: currentUser.id,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Create calendar event error:', error);
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
    const eventId = searchParams.get('id');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Verify the event belongs to the user
    const event = await prisma.calendarEvent.findFirst({
      where: {
        id: eventId,
        userId: currentUser.id,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    await prisma.calendarEvent.delete({
      where: { id: eventId },
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


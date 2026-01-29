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

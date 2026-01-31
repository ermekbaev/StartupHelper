import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const currentUser = await getCurrentUser(authHeader);

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем статистику задач из чек-листов
    const checklists = await prisma.checklist.findMany({
      where: { userId: currentUser.id },
      include: { tasks: true },
    });

    let totalTasks = 0;
    let completedTasks = 0;
    const upcomingTasks: { id: string; text: string; deadline: Date | null; checklistTitle: string }[] = [];

    checklists.forEach(checklist => {
      checklist.tasks.forEach(task => {
        totalTasks++;
        if (task.completed) completedTasks++;

        // Собираем невыполненные задачи с дедлайнами
        if (!task.completed && task.deadline) {
          upcomingTasks.push({
            id: task.id,
            text: task.text,
            deadline: task.deadline,
            checklistTitle: checklist.title,
          });
        }
      });
    });

    // Сортируем задачи по дедлайну
    upcomingTasks.sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    // Получаем количество сотрудников
    const employeesCount = await prisma.employee.count({
      where: { userId: currentUser.id, status: 'ACTIVE' },
    });

    // Получаем финансовую статистику
    const transactions = await prisma.transaction.findMany({
      where: { userId: currentUser.id },
      orderBy: { date: 'asc' },
    });

    // Группируем расходы по категориям
    const expensesByCategory: Record<string, number> = {};
    transactions.forEach(tx => {
      if (!expensesByCategory[tx.category]) {
        expensesByCategory[tx.category] = 0;
      }
      expensesByCategory[tx.category] += tx.amount;
    });

    // Данные для графика по месяцам
    const expensesByMonth: Record<string, number> = {};
    transactions.forEach(tx => {
      const monthKey = new Date(tx.date).toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });
      if (!expensesByMonth[monthKey]) {
        expensesByMonth[monthKey] = 0;
      }
      expensesByMonth[monthKey] += tx.amount;
    });

    const monthlyData = Object.entries(expensesByMonth).map(([month, amount]) => ({
      month,
      amount,
    }));

    // Общая сумма расходов
    const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Получаем грант с датами отчетов
    const now = new Date();
    const project = await prisma.project.findUnique({
      where: { userId: currentUser.id },
      include: {
        reportDates: {
          where: {
            date: { gte: now },
          },
          orderBy: { date: 'asc' },
          take: 1,
        },
      },
    });

    const grantAmount = project?.grantAmount || 500000;
    const remainingGrant = grantAmount - totalSpent;

    // Ближайшие события из календаря
    const calendarEvents = await prisma.calendarEvent.findMany({
      where: {
        userId: currentUser.id,
        date: { gte: now },
        completed: false,
      },
      orderBy: { date: 'asc' },
      take: 5,
    });

    // Расчет дней до ближайшего отчета из базы данных
    let daysUntilReport: number | null = null;
    let nextReportTitle: string | null = null;

    if (project?.reportDates && project.reportDates.length > 0) {
      const nextReport = project.reportDates[0];
      daysUntilReport = Math.ceil((new Date(nextReport.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      nextReportTitle = nextReport.title;
    }

    return NextResponse.json({
      stats: {
        totalTasks,
        completedTasks,
        employeesCount,
        totalSpent,
        remainingGrant,
        grantAmount,
        daysUntilReport,
        nextReportTitle,
      },
      expensesByCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({
        category,
        amount,
      })),
      monthlyExpenses: monthlyData,
      upcomingTasks: upcomingTasks.slice(0, 5),
      calendarEvents: calendarEvents.map(e => ({
        id: e.id,
        title: e.title,
        date: e.date,
        priority: e.priority,
      })),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

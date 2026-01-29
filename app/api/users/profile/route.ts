import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

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
    const { name, phone, inn, ogrn, isPremium, projectName, grantAmount, reportDates } = body;

    // Обновляем данные пользователя
    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(inn !== undefined && { inn }),
        ...(ogrn !== undefined && { ogrn }),
        ...(isPremium !== undefined && { isPremium }),
      },
    });

    // Обновляем данные проекта, если переданы
    const project = await prisma.project.findFirst({
      where: { userId: currentUser.id },
    });

    if (project) {
      if (projectName !== undefined || grantAmount !== undefined) {
        await prisma.project.update({
          where: { id: project.id },
          data: {
            ...(projectName && { name: projectName }),
            ...(grantAmount !== undefined && { grantAmount: Number(grantAmount) }),
          },
        });
      }

      // Обновляем даты отчётности
      if (reportDates !== undefined) {
        // Удаляем старые даты
        await prisma.reportDate.deleteMany({
          where: { projectId: project.id },
        });

        // Добавляем новые даты
        if (reportDates.length > 0) {
          await prisma.reportDate.createMany({
            data: reportDates.map((rd: { title: string; date: string }) => ({
              title: rd.title,
              date: new Date(rd.date),
              projectId: project.id,
            })),
          });
        }
      }
    }

    // Получаем обновлённые данные пользователя с проектом и датами отчётности
    const userWithProject = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        inn: true,
        ogrn: true,
        isPremium: true,
        createdAt: true,
        project: {
          include: {
            reportDates: {
              orderBy: { date: 'asc' },
            },
          },
        },
      },
    });

    return NextResponse.json({ user: userWithProject });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

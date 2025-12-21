import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await getCurrentUser(authHeader);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tierId, isAnnual } = body;

    if (!tierId || !['pro', 'business'].includes(tierId)) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    // В реальном приложении здесь была бы интеграция с платежной системой
    // Для MVP просто активируем Premium

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isPremium: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        inn: true,
        ogrn: true,
        isPremium: true,
        createdAt: true,
        project: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Подписка ${tierId.toUpperCase()} успешно активирована`,
      user: updatedUser,
      subscription: {
        tier: tierId,
        isAnnual,
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(
          Date.now() + (isAnnual ? 365 : 30) * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Отмена подписки
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await getCurrentUser(authHeader);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isPremium: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isPremium: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Подписка отменена',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

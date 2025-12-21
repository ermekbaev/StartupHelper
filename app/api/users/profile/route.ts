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
    const { name, phone, inn, ogrn, isPremium } = body;

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(inn !== undefined && { inn }),
        ...(ogrn !== undefined && { ogrn }),
        ...(isPremium !== undefined && { isPremium }),
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

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

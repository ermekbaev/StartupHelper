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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const whereClause: { userId: string; category?: 'HR' | 'FINANCE' | null } = {
      userId: currentUser.id,
    };

    if (category === 'HR' || category === 'FINANCE') {
      whereClause.category = category;
    } else if (category === 'none') {
      whereClause.category = null;
    }

    const checklists = await prisma.checklist.findMany({
      where: whereClause,
      include: {
        tasks: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ checklists });
  } catch (error) {
    console.error('Get checklists error:', error);
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
    const { title, tasks, category } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const checklist = await prisma.checklist.create({
      data: {
        title,
        category: category === 'HR' || category === 'FINANCE' ? category : null,
        userId: currentUser.id,
        tasks: {
          create: (tasks || []).map((text: string) => ({
            text,
            completed: false,
          })),
        },
      },
      include: {
        tasks: true,
      },
    });

    return NextResponse.json({ checklist });
  } catch (error) {
    console.error('Create checklist error:', error);
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
        { error: 'Checklist ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const checklist = await prisma.checklist.findFirst({
      where: { id, userId: currentUser.id },
    });

    if (!checklist) {
      return NextResponse.json(
        { error: 'Checklist not found' },
        { status: 404 }
      );
    }

    await prisma.checklist.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete checklist error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

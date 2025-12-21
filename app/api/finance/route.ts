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

    const transactions = await prisma.transaction.findMany({
      where: { userId: currentUser.id },
      orderBy: { date: 'desc' },
    });

    // Calculate totals by category
    const totals = await prisma.transaction.groupBy({
      by: ['category'],
      where: { userId: currentUser.id },
      _sum: { amount: true },
    });

    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      transactions,
      totals,
      totalSpent,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
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
    const { description, amount, category, date } = body;

    if (!description || !amount || !category) {
      return NextResponse.json(
        { error: 'Description, amount and category are required' },
        { status: 400 }
      );
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        description,
        amount: Math.abs(amount), // Store as positive
        category,
        date: date ? new Date(date) : new Date(),
        userId: currentUser.id,
      },
    });

    // Update project spentAmount
    if (currentUser.project) {
      const totalSpent = await prisma.transaction.aggregate({
        where: { userId: currentUser.id },
        _sum: { amount: true },
      });

      await prisma.project.update({
        where: { id: currentUser.project.id },
        data: { spentAmount: totalSpent._sum.amount || 0 },
      });
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Create transaction error:', error);
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
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: currentUser.id },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    await prisma.transaction.delete({
      where: { id },
    });

    // Update project spentAmount
    if (currentUser.project) {
      const totalSpent = await prisma.transaction.aggregate({
        where: { userId: currentUser.id },
        _sum: { amount: true },
      });

      await prisma.project.update({
        where: { id: currentUser.project.id },
        data: { spentAmount: totalSpent._sum.amount || 0 },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

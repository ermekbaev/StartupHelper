import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createToken } from '@/lib/auth';
import { INITIAL_CHECKLISTS } from '@/lib/demo-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, projectName, grantAmount } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Create user with project and initial checklists in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });

      // Create default project
      await tx.project.create({
        data: {
          name: projectName || 'Мой проект',
          grantAmount: grantAmount || 500000,
          userId: newUser.id,
        },
      });

      // Create initial checklists with tasks
      for (const checklist of INITIAL_CHECKLISTS) {
        await tx.checklist.create({
          data: {
            title: checklist.title,
            category: checklist.category,
            userId: newUser.id,
            tasks: {
              create: checklist.tasks.map((task) => ({
                text: task.text,
                completed: task.completed,
              })),
            },
          },
        });
      }

      return newUser;
    });

    // Fetch user with project for response
    const userWithProject = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        isPremium: true,
        createdAt: true,
        project: {
          select: {
            id: true,
            name: true,
            grantAmount: true,
          },
        },
      },
    });

    const token = createToken({ userId: user.id, email: user.email });

    return NextResponse.json({
      user: userWithProject,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

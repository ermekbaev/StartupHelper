import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createToken } from '@/lib/auth';

// Секретный ключ для тестовой регистрации
const REGISTRATION_SECRET_KEY = process.env.REGISTRATION_SECRET_KEY || 'STARTUP2024TEST';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, projectName, grantAmount, secretKey } = body;

    // Проверка секретного ключа
    if (!secretKey || secretKey !== REGISTRATION_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Неверный ключ доступа' },
        { status: 403 }
      );
    }

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, пароль и имя обязательны' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Create user with project in a transaction
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
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

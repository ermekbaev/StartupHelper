import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

const AUTO_RESPONSES: { keywords: string[]; response: string }[] = [
  {
    keywords: ["грант", "финансирование", "деньги", "средства", "фонд"],
    response:
      'По вопросам грантового финансирования рекомендуем обратиться к вашему куратору в фонде. В разделе "Финансы" вы можете отслеживать поступления и расходы по грантам.',
  },
  {
    keywords: ["отчёт", "отчет", "отчётность", "отчетность"],
    response:
      'Для подготовки отчётности используйте шаблоны в разделе "Документы". Все финансовые данные для отчёта доступны в разделе "Финансы" → "Отчёты".',
  },
  {
    keywords: [
      "сотрудник",
      "кадры",
      "приём",
      "прием",
      "увольнение",
      "трудовой",
      "найм",
    ],
    response:
      'Все кадровые вопросы можно решить в разделе "Кадры". Там вы можете добавлять сотрудников, оформлять приём и увольнение, вести трудовые договоры.',
  },
  {
    keywords: ["налог", "ндфл", "усн", "взнос", "пфр", "фсс"],
    response:
      'Налоговые вопросы отслеживайте через раздел "Финансы" → "Налоги". Система автоматически рассчитывает налоговую нагрузку и напомнит о сроках уплаты.',
  },
  {
    keywords: ["документ", "шаблон", "договор", "акт", "счёт", "счет"],
    response:
      'Все необходимые шаблоны документов доступны в разделе "Документы". Вы можете создавать договоры, акты, счета и другие документы на основе готовых шаблонов.',
  },
  {
    keywords: ["календарь", "напоминание", "событие", "дедлайн"],
    response:
      'В разделе "Календарь" вы можете создавать события и напоминания о важных датах: сроках отчётности, налоговых платежах, встречах с партнёрами.',
  },
  {
    keywords: ["премиум", "подписка", "реклама", "тариф"],
    response:
      "Премиум-подписка убирает рекламу и открывает дополнительные возможности: расширенную аналитику, приоритетную поддержку и дополнительные шаблоны документов.",
  },
  {
    keywords: [
      "привет",
      "здравствуй",
      "добрый день",
      "доброе утро",
      "добрый вечер",
    ],
    response:
      "Здравствуйте! Чем могу помочь? Задайте вопрос о работе платформы StartupHelper.",
  },
  {
    keywords: ["спасибо", "благодарю"],
    response: "Рады помочь! Если возникнут ещё вопросы — обращайтесь.",
  },
  {
    keywords: ["аналитика", "метрики", "статистика", "показатели"],
    response:
      'Аналитику и ключевые метрики вашего проекта вы найдёте в разделе "Аналитика". Там доступны графики роста, финансовые показатели и сравнительные данные.',
  },
  {
    keywords: ["проект", "задача", "задание", "план"],
    response:
      'Управление проектами и задачами доступно в разделе "Проекты". Вы можете создавать задачи, назначать исполнителей и отслеживать прогресс.',
  },
];

function getAutoResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  for (const item of AUTO_RESPONSES) {
    for (const keyword of item.keywords) {
      if (lowerMessage.includes(keyword)) {
        return item.response;
      }
    }
  }

  return "Спасибо за обращение! Ваш вопрос зарегистрирован. Специалист поддержки ответит вам в ближайшее время. Среднее время ответа — 2-4 часа в рабочие дни. Для быстрых ответов попробуйте нашего ИИ Помощника.";
}

// GET - Fetch all messages for current user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const messages = await prisma.supportMessage.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching support messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Message text is required" },
        { status: 400 },
      );
    }

    if (text.trim().length > 2000) {
      return NextResponse.json(
        { error: "Message too long (max 2000 characters)" },
        { status: 400 },
      );
    }

    // Create user message
    const userMessage = await prisma.supportMessage.create({
      data: {
        text: text.trim(),
        sender: "USER",
        userId: payload.userId,
      },
    });

    // Get auto response based on keywords
    const autoResponseText = getAutoResponse(text.trim());

    // Save support response
    const supportMessage = await prisma.supportMessage.create({
      data: {
        text: autoResponseText,
        sender: "SUPPORT",
        userId: payload.userId,
      },
    });

    return NextResponse.json({
      userMessage,
      supportMessage,
    });
  } catch (error) {
    console.error("Error sending support message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Clear chat history
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await prisma.supportMessage.deleteMany({
      where: { userId: payload.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing support messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

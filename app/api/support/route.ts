import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Auto-responses based on keywords
const AUTO_RESPONSES: { keywords: string[]; response: string }[] = [
  {
    keywords: ['грант', 'финансирование', 'деньги', 'средства'],
    response: 'По вопросам грантового финансирования рекомендуем обратиться к вашему куратору в фонде. Также вы можете найти актуальную информацию в разделе "Документы" — там есть шаблоны отчётов по этапам проекта.',
  },
  {
    keywords: ['отчёт', 'отчет', 'отчётность', 'отчетность'],
    response: 'Для подготовки отчётности используйте шаблоны в разделе "Документы". Ежемесячные и квартальные чек-листы помогут вам не пропустить важные сроки сдачи отчётов.',
  },
  {
    keywords: ['сотрудник', 'кадры', 'приём', 'прием', 'увольнение', 'трудовой'],
    response: 'Все кадровые вопросы можно решить в разделе "Кадры". Там есть готовые чек-листы для приёма и увольнения сотрудников, а также шаблоны документов в разделе "Документы".',
  },
  {
    keywords: ['налог', 'ндфл', 'усн', 'взнос', 'пфр', 'фсс'],
    response: 'Налоговые вопросы отслеживайте через раздел "Финансы". Квартальный чек-лист поможет не забыть о сроках подачи деклараций и уплаты налогов.',
  },
  {
    keywords: ['документ', 'шаблон', 'договор', 'акт', 'счёт', 'счет'],
    response: 'Все необходимые шаблоны документов доступны в разделе "Документы". Вы также можете загружать и хранить там собственные документы.',
  },
  {
    keywords: ['календарь', 'напоминание', 'событие', 'дедлайн'],
    response: 'В разделе "Календарь" вы можете создавать события и напоминания. Также там автоматически отображаются дедлайны задач из чек-листов и дни рождения сотрудников.',
  },
  {
    keywords: ['премиум', 'подписка', 'реклама', 'тариф'],
    response: 'Премиум-подписка убирает рекламу и открывает дополнительные возможности. Подробности на странице "Тарифы" или в настройках профиля.',
  },
  {
    keywords: ['привет', 'здравствуй', 'добрый день', 'доброе утро', 'добрый вечер'],
    response: 'Здравствуйте! Чем могу помочь? Опишите ваш вопрос, и я постараюсь помочь или направить к нужной информации.',
  },
  {
    keywords: ['спасибо', 'благодарю'],
    response: 'Рады помочь! Если возникнут ещё вопросы — обращайтесь.',
  },
];

const DEFAULT_RESPONSE = 'Спасибо за обращение! Ваш вопрос зарегистрирован. Специалист поддержки ответит вам в ближайшее время. Среднее время ответа — 2-4 часа в рабочие дни.';

function getAutoResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  for (const item of AUTO_RESPONSES) {
    if (item.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return item.response;
    }
  }

  return DEFAULT_RESPONSE;
}

// GET - Fetch all messages for current user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const messages = await prisma.supportMessage.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching support messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    // Create user message
    const userMessage = await prisma.supportMessage.create({
      data: {
        text: text.trim(),
        sender: 'USER',
        userId: payload.userId,
      },
    });

    // Generate and save auto-response
    const autoResponseText = getAutoResponse(text);

    // Small delay simulation for more natural feel
    const supportMessage = await prisma.supportMessage.create({
      data: {
        text: autoResponseText,
        sender: 'SUPPORT',
        userId: payload.userId,
      },
    });

    return NextResponse.json({
      userMessage,
      supportMessage,
    });
  } catch (error) {
    console.error('Error sending support message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Clear chat history
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await prisma.supportMessage.deleteMany({
      where: { userId: payload.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing support messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

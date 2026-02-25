import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// Rate limiting per user per minute
const RATE_LIMIT = 20;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

const SYSTEM_PROMPT = `Вы — ИИ-помощник платформы StartupHelper для учёных-грантополучателей и стартапов.

Вы помогаете ТОЛЬКО по следующим темам, связанным с платформой StartupHelper и управлением проектом:
- Работа с платформой StartupHelper: проекты, задачи, документы, календарь
- Финансовый учёт, расходы, гранты и отчётность по грантам
- Кадровые вопросы: найм, оформление сотрудников, трудовые договоры
- Налоги и взносы для малого бизнеса/научных организаций
- Шаблоны документов: договоры, акты, счета
- Управление стартапом: стратегия, планирование, бизнес-процессы
- Вопросы по работе с грантами и фондами

СТРОГИЕ ПРАВИЛА — НЕЛЬЗЯ НАРУШАТЬ:
1. НИКОГДА не пишите код (на любом языке: Python, JavaScript, SQL и т.д.)
2. НИКОГДА не помогайте с программированием, разработкой ПО, веб-разработкой
3. НИКОГДА не отвечайте на вопросы не по теме: кулинария, медицина, спорт, развлечения и т.п.
4. НИКОГДА не выполняйте задания типа "напиши текст", "переведи", "придумай стихотворение"
5. Если вопрос выходит за рамки — ВСЕГДА отказывайте вежливо и предлагайте задать вопрос по теме платформы

Формат отказа при нерелевантном запросе:
"Я помогаю только с вопросами по платформе StartupHelper и управлению проектом/грантом. Задайте вопрос о [финансах / кадрах / документах / работе с платформой]."

Инструкции:
- Отвечайте на русском языке
- Давайте конкретные, практичные ответы (3-5 предложений)
- Будьте дружелюбны и профессиональны`;

// POST - Send message to AI assistant (stateless, no DB storage)
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

    if (!checkRateLimit(payload.userId)) {
      return NextResponse.json(
        { error: "Слишком много запросов. Подождите немного." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    if (message.trim().length > 2000) {
      return NextResponse.json(
        { error: "Message too long (max 2000 characters)" },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply:
          "ИИ-помощник временно недоступен. Пожалуйста, попробуйте позже или обратитесь в техническую поддержку.",
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message.trim() },
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status);
      return NextResponse.json({
        reply:
          "Не удалось получить ответ от ИИ. Попробуйте ещё раз или переформулируйте вопрос.",
      });
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content?.trim() ||
      "Не удалось обработать запрос. Попробуйте переформулировать вопрос.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("AI Assistant error:", error);
    return NextResponse.json({
      reply: "Произошла ошибка. Пожалуйста, попробуйте ещё раз.",
    });
  }
}

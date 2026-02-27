import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

Вы помогаете по широкому кругу тем, связанных с развитием стартапа и управлением проектом:
- Работа с платформой StartupHelper: проекты, задачи, документы, календарь
- Финансовый учёт, расходы, гранты и отчётность по грантам
- Кадровые вопросы: найм, оформление сотрудников, трудовые договоры
- Налоги и взносы для малого бизнеса/научных организаций
- Шаблоны документов: договоры, акты, счета
- Управление стартапом: стратегия, планирование, бизнес-процессы
- Привлечение клиентов, маркетинг, продажи, продвижение продукта
- Поиск инвестиций, работа с инвесторами, питч
- Вопросы по работе с грантами и фондами
- Любые деловые и бизнес-вопросы, полезные основателю стартапа

Правила:
1. Не пишите программный код (Python, JavaScript, SQL и т.д.) и не помогайте с разработкой ПО
2. Не отвечайте на явно нерелевантные темы: кулинария, медицина, спорт, развлечения, личная жизнь
3. Если вопрос совсем не связан с бизнесом или стартапом — вежливо предложите задать вопрос по теме

Инструкции:
- Отвечайте на русском языке
- Давайте конкретные, практичные ответы (3-5 предложений)
- Будьте дружелюбны и профессиональны`;

const MAX_TEXT_LENGTH = 8000;
const HISTORY_DAYS = 7;

async function extractFileText(fileType: string, fileName: string, base64Data: string): Promise<string | null> {
  const buffer = Buffer.from(base64Data, "base64");

  try {
    // PDF
    if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const parsed = await pdfParse(buffer);
      return parsed.text.slice(0, MAX_TEXT_LENGTH);
    }

    // DOCX
    if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(".docx")
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value.slice(0, MAX_TEXT_LENGTH);
    }

    // Excel XLSX/XLS
    if (
      fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      fileType === "application/vnd.ms-excel" ||
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls")
    ) {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const lines: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        lines.push(`[Лист: ${sheetName}]\n${csv}`);
      }
      return lines.join("\n\n").slice(0, MAX_TEXT_LENGTH);
    }

    // CSV
    if (fileType === "text/csv" || fileName.endsWith(".csv")) {
      return buffer.toString("utf-8").slice(0, MAX_TEXT_LENGTH);
    }

    return null;
  } catch (err) {
    console.error("File parse error:", err);
    return null;
  }
}

function getSevenDaysAgo(): Date {
  const d = new Date();
  d.setDate(d.getDate() - HISTORY_DAYS);
  return d;
}

// GET - Fetch last 7 days of AI chat history
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

    const cutoff = getSevenDaysAgo();

    // Cleanup old messages (older than 7 days)
    await prisma.aiMessage.deleteMany({
      where: {
        userId: payload.userId,
        createdAt: { lt: cutoff },
      },
    });

    // Fetch remaining messages
    const messages = await prisma.aiMessage.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("AI history fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Send message to AI assistant
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
    const { message, file } = body;

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

    // Validate file if provided
    if (file) {
      const fileSizeBytes = Math.ceil((file.data?.length || 0) * 0.75); // base64 → bytes approx
      if (fileSizeBytes > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Файл слишком большой (максимум 10 МБ)" },
          { status: 400 },
        );
      }
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply:
          "ИИ-помощник временно недоступен. Пожалуйста, попробуйте позже или обратитесь в техническую поддержку.",
      });
    }

    // Build messages array
    type MessageContent =
      | string
      | Array<{ type: string; text?: string; image_url?: { url: string } }>;

    interface ChatMessage {
      role: "system" | "user" | "assistant";
      content: MessageContent;
    }

    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    const isImage =
      file &&
      (file.type?.startsWith("image/") ||
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name || ""));

    let userMessageText = message.trim();
    let userFileName: string | null = null;

    if (file && isImage) {
      // deepseek-chat is text-only — images not supported
      return NextResponse.json({
        reply: "Анализ изображений пока не поддерживается в текущей модели. Загрузите PDF, DOCX, Excel или CSV — эти форматы читаются полностью.",
      });
    } else if (file) {
      // Document: extract text and prepend to message
      const extractedText = await extractFileText(file.type, file.name || "", file.data || "");
      if (extractedText) {
        userFileName = file.name || null;
        const fullMessage = `[Содержимое файла "${file.name}":]
${extractedText}

Вопрос пользователя: ${message.trim()}`;
        messages.push({ role: "user", content: fullMessage });
      } else {
        return NextResponse.json({
          reply: `Не удалось прочитать файл "${file.name}". Поддерживаются: PDF, DOCX, XLSX, XLS, CSV.`,
        });
      }
    } else {
      messages.push({ role: "user", content: userMessageText });
    }

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error("DeepSeek API error:", response.status, JSON.stringify(errorBody));

      if (response.status === 401) {
        return NextResponse.json({
          reply: "Ошибка авторизации DeepSeek (401): неверный или просроченный API ключ. Проверьте переменную DEEPSEEK_API_KEY на сервере.",
        });
      }
      if (response.status === 429) {
        return NextResponse.json({
          reply: "Превышен лимит запросов или закончились средства на аккаунте DeepSeek (429). Проверьте баланс на platform.deepseek.com.",
        });
      }
      if (response.status === 402) {
        return NextResponse.json({
          reply: "Недостаточно средств на аккаунте DeepSeek (402). Пополните баланс на platform.deepseek.com.",
        });
      }

      return NextResponse.json({
        reply: `Ошибка DeepSeek (${response.status}). Подробности в логах сервера.`,
      });
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content?.trim() ||
      "Не удалось обработать запрос. Попробуйте переформулировать вопрос.";

    // Save both messages to DB
    await prisma.aiMessage.createMany({
      data: [
        {
          text: userMessageText,
          role: "USER",
          fileName: userFileName,
          userId: payload.userId,
        },
        {
          text: reply,
          role: "ASSISTANT",
          userId: payload.userId,
        },
      ],
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("AI Assistant error:", error);
    return NextResponse.json({
      reply: "Произошла ошибка. Пожалуйста, попробуйте ещё раз.",
    });
  }
}

// DELETE - Clear AI chat history for current user
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

    await prisma.aiMessage.deleteMany({
      where: { userId: payload.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("AI history clear error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

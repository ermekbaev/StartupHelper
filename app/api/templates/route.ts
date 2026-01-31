import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Список шаблонов документов
const TEMPLATES: Record<number, { title: string; fileName: string; description: string }> = {
  1: {
    title: 'Бизнес-план',
    fileName: 'business-plan.docx',
    description: 'Шаблон бизнес-плана для стартап-проекта',
  },
  2: {
    title: 'Развитие стартап-проекта',
    fileName: 'startup-development.docx',
    description: 'План развития стартап-проекта по этапам',
  },
  5: {
    title: 'Воинский учет организации',
    fileName: 'military-registration.rar',
    description: 'Архив с документами по воинскому учету',
  },
  6: {
    title: 'Трудовой договор',
    fileName: 'employment-contract.docx',
    description: 'Типовой трудовой договор',
  },
  7: {
    title: 'Приказ о приеме',
    fileName: 'hiring-order.rtf',
    description: 'Приказ о приеме работника на работу',
  },
  8: {
    title: 'Договор услуг',
    fileName: 'service-contract.docx',
    description: 'Договор возмездного оказания услуг',
  },
  9: {
    title: 'Акт выполненных работ',
    fileName: 'completion-act.xlsx',
    description: 'Акт сдачи-приемки выполненных работ',
  },
  10: {
    title: 'Счет на оплату',
    fileName: 'invoice.csv',
    description: 'Шаблон счета на оплату',
  },
};

// GET - получить список шаблонов или скачать конкретный шаблон
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const download = searchParams.get('download');

    if (!id) {
      // Вернуть список доступных шаблонов с информацией о наличии файла
      const templates = await Promise.all(
        Object.entries(TEMPLATES).map(async ([key, value]) => {
          const filePath = path.join(process.cwd(), 'public', 'templates', value.fileName);
          const fileExists = existsSync(filePath);

          return {
            id: parseInt(key),
            title: value.title,
            fileName: value.fileName,
            description: value.description,
            available: fileExists,
          };
        })
      );
      return NextResponse.json({ templates });
    }

    const templateId = parseInt(id);
    const template = TEMPLATES[templateId];

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const filePath = path.join(process.cwd(), 'public', 'templates', template.fileName);

    // Проверяем существование файла
    if (!existsSync(filePath)) {
      return NextResponse.json({
        error: 'File not found',
        message: `Файл ${template.fileName} пока не загружен`
      }, { status: 404 });
    }

    // Если запрос на скачивание
    if (download === 'true') {
      const fileBuffer = await readFile(filePath);

      // Определяем Content-Type по расширению файла
      const ext = template.fileName.split('.').pop()?.toLowerCase();
      const contentTypes: Record<string, string> = {
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        doc: 'application/msword',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        xls: 'application/vnd.ms-excel',
        csv: 'text/csv',
        rtf: 'application/rtf',
        rar: 'application/x-rar-compressed',
        zip: 'application/zip',
        pdf: 'application/pdf',
      };
      const contentType = contentTypes[ext || ''] || 'application/octet-stream';

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(template.fileName)}"`,
        },
      });
    }

    // Иначе возвращаем информацию о шаблоне
    return NextResponse.json({
      template: {
        id: templateId,
        title: template.title,
        fileName: template.fileName,
        description: template.description,
        downloadUrl: `/api/templates?id=${templateId}&download=true`,
      },
    });
  } catch (error) {
    console.error('Get template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { equipment, verificationTypes, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Bot, InputFile } from 'grammy';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { telegramId, format, language = 'ru' } = body;

    if (!telegramId || !format || !['excel', 'pdf'].includes(format)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'Missing bot token' }, { status: 500 });
    }

    const bot = new Bot(botToken);

    // Get all equipment sorted by verification type and expiry date
    const allEquipment = await db
      .select({
        equipmentName: equipment.name,
        expiryDate: equipment.expiryDate,
        certificateNumber: equipment.certificateNumber,
        verificationTypeNameRu: verificationTypes.nameRu,
        verificationTypeNameUz: verificationTypes.nameUz,
      })
      .from(equipment)
      .innerJoin(
        verificationTypes,
        eq(equipment.verificationTypeId, verificationTypes.id)
      )
      .orderBy(verificationTypes.sortOrder, desc(equipment.expiryDate));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const title = language === 'uz' ? "Приборлар рўйхати" : "Список приборов";
    const colName = language === 'uz' ? "Прибор номи" : "Наименование";
    const colType = language === 'uz' ? "Текширув тури" : "Тип проверки";
    const colCert = language === 'uz' ? "Сертификат №" : "№ Сертификата";
    const colDate = language === 'uz' ? "Амал қилиш муддати" : "Срок действия";
    const colStatus = language === 'uz' ? "Ҳолати" : "Статус";

    const getStatus = (expStr: string) => {
      const expDate = new Date(expStr);
      expDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return language === 'uz' ? `Muddati o'tgan (${Math.abs(diffDays)} kun)` : `Просрочен (${Math.abs(diffDays)} дн.)`;
      if (diffDays === 0) return language === 'uz' ? "Bugun tugaydi" : "Истекает сегодня";
      if (diffDays <= 30) return language === 'uz' ? `${diffDays} kun qoldi` : `Осталось ${diffDays} дн.`;
      return language === 'uz' ? `${diffDays} kun qoldi` : `Осталось ${diffDays} дн.`;
    };

    let buffer: Buffer;
    let filename = '';
    let mimeType = '';

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Equipment');

      worksheet.columns = [
        { header: colName, key: 'name', width: 30 },
        { header: colType, key: 'type', width: 20 },
        { header: colCert, key: 'cert', width: 20 },
        { header: colDate, key: 'date', width: 15 },
        { header: colStatus, key: 'status', width: 25 },
      ];

      // Style header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      for (const item of allEquipment) {
        worksheet.addRow({
          name: item.equipmentName,
          type: language === 'uz' ? item.verificationTypeNameUz : item.verificationTypeNameRu,
          cert: item.certificateNumber || '-',
          date: new Date(item.expiryDate).toLocaleDateString('ru-RU'),
          status: getStatus(item.expiryDate),
        });
      }

      // Add borders
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      const excelBuffer = await workbook.xlsx.writeBuffer();
      buffer = Buffer.from(excelBuffer);
      filename = `equipment_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    } else if (format === 'pdf') {
      buffer = await new Promise((resolve, reject) => {
        try {
          const doc = new PDFDocument({ margin: 30, size: 'A4' });
          const chunks: any[] = [];
          
          doc.on('data', (chunk) => chunks.push(chunk));
          doc.on('end', () => resolve(Buffer.concat(chunks)));
          
          // Register Roboto font to support Cyrillic characters
          const fs = require('fs');
          const path = require('path');
          const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');
          if (fs.existsSync(fontPath)) {
            doc.font(fontPath);
          }
          
          doc.fontSize(18).text(title, { align: 'center' });
          doc.moveDown();
          
          doc.fontSize(10);
          const startY = doc.y;
          doc.text(colName, 30, startY);
          doc.text(colType, 200, startY);
          doc.text(colDate, 350, startY);
          doc.text(colStatus, 450, startY);
          
          doc.moveTo(30, startY + 15).lineTo(565, startY + 15).stroke();
          
          let y = startY + 25;
          for (const item of allEquipment) {
            if (y > 750) {
              doc.addPage();
              y = 30;
            }
            doc.text(item.equipmentName.substring(0, 30), 30, y);
            const type = language === 'uz' ? item.verificationTypeNameUz : item.verificationTypeNameRu;
            doc.text(type.substring(0, 20), 200, y);
            doc.text(new Date(item.expiryDate).toLocaleDateString('ru-RU'), 350, y);
            doc.text(getStatus(item.expiryDate), 450, y);
            
            y += 20;
          }
          
          doc.end();
        } catch (e) {
          reject(e);
        }
      });
      filename = `equipment_report_${new Date().toISOString().split('T')[0]}.pdf`;
      mimeType = 'application/pdf';
    }

    const message = language === 'uz' 
      ? "Siz so'ragan hisobot tayyor! 📄" 
      : "Ваш отчет готов! 📄";

    // Send file to Telegram user
    await bot.api.sendDocument(telegramId, new InputFile(buffer!, filename), {
      caption: message,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

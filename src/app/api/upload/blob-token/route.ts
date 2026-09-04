import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { authenticateRequest, requireAllowed } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

// POST /api/upload/blob-token — выдача токена для клиентской загрузки
export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Проверяем авторизацию через initData в clientPayload
        if (!clientPayload) {
          throw new Error('Missing auth data');
        }

        // clientPayload содержит initData
        const mockRequest = new NextRequest(request.url, {
          headers: new Headers({
            'x-telegram-init-data': clientPayload,
          }),
        });

        const auth = await authenticateRequest(mockRequest);
        if ('error' in auth || !auth.user.isAllowed) {
          throw new Error('Unauthorized');
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_SIZE,
          tokenPayload: JSON.stringify({
            telegramId: auth.user.telegramId,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Можно добавить логику после успешной загрузки
        console.log('Upload completed:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}

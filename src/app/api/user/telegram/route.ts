import { requireAuth } from '@/lib/auth/api-helpers';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/user/telegram - Get user's Telegram data
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        telegramChatId: true,
        telegramUsername: true,
      },
    });

    return NextResponse.json({
      success: true,
      telegram: {
        chatId: userData?.telegramChatId || null,
        username: userData?.telegramUsername || null,
        isConnected: !!(userData?.telegramChatId || userData?.telegramUsername),
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized: Authentication required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch Telegram data', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/user/telegram - Save user's Telegram data from authentication
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    // Extract Telegram data from widget response
    const { id, username, first_name, hash, auth_date } = body;

    // TODO: Validate hash signature here (as per Telegram docs)
    // For now, we trust the data from the widget

    // Update user with Telegram details
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        telegramChatId: id?.toString(),
        telegramUsername: username || first_name || null,
      },
    });

    return NextResponse.json({
      success: true,
      telegram: {
        chatId: updatedUser.telegramChatId,
        username: updatedUser.telegramUsername,
        isConnected: true,
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized: Authentication required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save Telegram data', details: error.message },
      { status: 500 }
    );
  }
}

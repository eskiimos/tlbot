import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Пароль обязателен' }, { status: 400 });
    }

    // Простая проверка пароля
    if (password !== '123') {
      return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });
    }

    // Создаем JWT токен
    const token = jwt.sign(
      { adminId: 'admin', username: username || 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response = NextResponse.json({ 
      message: 'Авторизация успешна',
      admin: { id: 'admin', username: username || 'admin' }
    });

    // Устанавливаем httpOnly cookie с токеном
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 часа
    });

    return response;
  } catch (error) {
    console.error('Ошибка авторизации админа:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// Проверка авторизации
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Простая проверка без БД
    if (decoded.adminId !== 'admin') {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    return NextResponse.json({ 
      admin: { id: 'admin', username: decoded.username || 'admin' }
    });
  } catch (error) {
    console.error('Ошибка проверки авторизации:', error);
    return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
  }
}

// Выход
export async function DELETE() {
  const response = NextResponse.json({ message: 'Выход выполнен' });
  response.cookies.delete('admin-token');
  return response;
}

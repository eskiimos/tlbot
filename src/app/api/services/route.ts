import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const active = searchParams.get('active');

    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    if (active !== null) {
      where.isActive = active === 'true';
    }

    const services = await prisma.service.findMany({
      where,
      orderBy: {
        priceFrom: 'asc'
      }
    });

    // Преобразуем BigInt в строки для JSON
    const servicesForJson = services.map(service => ({
      ...service,
      priceFrom: service.priceFrom.toString(),
      priceTo: service.priceTo?.toString() || null
    }));

    return NextResponse.json({
      success: true,
      services: servicesForJson
    });

  } catch (error) {
    console.error('Ошибка при получении услуг:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, priceFrom, priceTo, category } = body;

    // Валидация
    if (!name || !slug || !priceFrom || !category) {
      return NextResponse.json(
        { success: false, error: 'Отсутствуют обязательные поля' },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        name,
        slug,
        description,
        priceFrom: parseInt(priceFrom),
        priceTo: priceTo ? parseInt(priceTo) : null,
        category,
        isActive: true
      }
    });

    const serviceForJson = {
      ...service,
      priceFrom: service.priceFrom.toString(),
      priceTo: service.priceTo?.toString() || null
    };

    return NextResponse.json({
      success: true,
      service: serviceForJson
    });

  } catch (error) {
    console.error('Ошибка при создании услуги:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

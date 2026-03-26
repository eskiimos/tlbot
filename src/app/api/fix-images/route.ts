import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const imageMap: Record<string, string[]> = {
  't-shirt': [
    '/products/t-shirt/t-shirt_1.webp',
    '/products/t-shirt/t-shirt_2.webp',
    '/products/t-shirt/t-shirt_3.webp',
    '/products/t-shirt/t-shirt_4.webp',
    '/products/t-shirt/t-shirt_5.webp',
  ],
  'longsleeve': [
    '/products/longsleeve/long_sleeve_1.webp',
    '/products/longsleeve/long_sleeve_2.webp',
    '/products/longsleeve/long_sleeve_3.webp',
    '/products/longsleeve/long_sleeve_4.webp',
    '/products/longsleeve/long_sleeve_5.webp',
  ],
  'sweatshirt': [
    '/products/sweatshirt/sweatshirt_1.webp',
    '/products/sweatshirt/sweatshirt_2.webp',
    '/products/sweatshirt/sweatshirt_3.webp',
    '/products/sweatshirt/sweatshirt_4.webp',
    '/products/sweatshirt/sweatshirt_5.webp',
  ],
  'hoodies': [
    '/products/hoodies/hoodies_1.webp',
    '/products/hoodies/hoodies_2.webp',
    '/products/hoodies/hoodies_3.webp',
  ],
  'halfzip': [
    '/products/halfzip/halfzip_1.webp',
    '/products/halfzip/halfzip_2.webp',
    '/products/halfzip/halfzip_3.webp',
    '/products/halfzip/halfzip_4.webp',
    '/products/halfzip/halfzip_5.webp',
  ],
  'shopper': [
    '/products/shopper/black.webp',
    '/products/shopper/white.webp',
  ],
  'zip-hoodie': [
    '/products/zip-hoodie/zip-hoodie_1.webp',
    '/products/zip-hoodie/zip-hoodie_2.webp',
    '/products/zip-hoodie/zip-hoodie_3.webp',
  ],
  'pants': [
    '/products/pants/pants_1.webp',
    '/products/pants/pants_2.webp',
    '/products/pants/pants_3.webp',
    '/products/pants/pants_4.webp',
    '/products/pants/pants_5.webp',
  ],
  'jeans': [
    '/products/jeans/black.webp',
    '/products/jeans/white.webp',
  ],
  'shorts': [
    '/products/shorts/short_1.webp',
    '/products/shorts/short_2.webp',
    '/products/shorts/short_3.webp',
    '/products/shorts/short_4.webp',
    '/products/shorts/short_5.webp',
  ],
};

export async function POST() {
  const results: string[] = [];

  for (const [slug, images] of Object.entries(imageMap)) {
    const updated = await prisma.product.updateMany({
      where: { slug },
      data: { images },
    });
    results.push(`${slug}: updated ${updated.count}`);
  }

  return NextResponse.json({ ok: true, results });
}

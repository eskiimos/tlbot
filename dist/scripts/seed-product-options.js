"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Базовые опции для всех товаров
const baseOptions = [
    // Цвета
    { category: 'color', name: 'Белый', price: 0, isDefault: true },
    { category: 'color', name: 'Черный', price: 0, isDefault: false },
    { category: 'color', name: 'Серый', price: 0, isDefault: false },
    { category: 'color', name: 'Темно-синий', price: 0, isDefault: false },
    { category: 'color', name: 'Индивидуальный', price: 50, isDefault: false },
    // Дизайн
    { category: 'design', name: 'Не нужен', price: 0, isDefault: true },
    { category: 'design', name: 'Нужен дизайн', price: 150, isDefault: false },
    // Принт/нанесение
    { category: 'print', name: 'Без нанесения', price: 0, isDefault: true },
    { category: 'print', name: 'Шелкография (1 цвет)', price: 35, isDefault: false },
    { category: 'print', name: 'Шелкография (2-3 цвета)', price: 55, isDefault: false },
    { category: 'print', name: 'Шелкография (4+ цветов)', price: 75, isDefault: false },
    { category: 'print', name: 'Термотрансфер', price: 45, isDefault: false },
    { category: 'print', name: 'Вышивка (до 10 000 стежков)', price: 120, isDefault: false },
    { category: 'print', name: 'Прямая цифровая печать', price: 95, isDefault: false },
    // Составники, бирки, этикетки
    { category: 'label', name: 'Без дополнительных элементов', price: 0, isDefault: true },
    { category: 'label', name: 'Составник (уход за изделием)', price: 15, isDefault: false },
    { category: 'label', name: 'Размерная бирка', price: 12, isDefault: false },
    { category: 'label', name: 'Брендовая этикетка', price: 25, isDefault: false },
    { category: 'label', name: 'Полный комплект бирок', price: 45, isDefault: false },
    // Упаковка
    { category: 'packaging', name: 'Без упаковки', price: 0, isDefault: true },
    { category: 'packaging', name: 'Полиэтиленовый пакет', price: 8, isDefault: false },
    { category: 'packaging', name: 'Крафт-пакет', price: 15, isDefault: false },
    { category: 'packaging', name: 'Брендированная коробка', price: 35, isDefault: false },
    { category: 'packaging', name: 'Подарочная упаковка', price: 55, isDefault: false },
];
async function main() {
    console.log('Добавляем опции для товаров...');
    // Получаем все товары
    const products = await prisma.product.findMany();
    for (const product of products) {
        console.log(`Добавляем опции для "${product.name}"`);
        // Удаляем существующие опции
        await prisma.productOption.deleteMany({
            where: { productId: product.id }
        });
        // Добавляем базовые опции для каждого товара
        for (const option of baseOptions) {
            await prisma.productOption.create({
                data: {
                    productId: product.id,
                    category: option.category,
                    name: option.name,
                    price: option.price,
                    isDefault: option.isDefault,
                    isActive: true
                }
            });
        }
        console.log(`✓ Добавлено ${baseOptions.length} опций для "${product.name}"`);
    }
    console.log('Опции товаров успешно добавлены!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});

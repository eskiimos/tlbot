"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.middleware = middleware;
const server_1 = require("next/server");
function middleware(request) {
    // Разрешаем публичный доступ к webhook endpoint для Telegram
    if (request.nextUrl.pathname === '/api/bot') {
        return server_1.NextResponse.next();
    }
    // Для остальных API routes применяем стандартную обработку
    return server_1.NextResponse.next();
}
exports.config = {
    matcher: [
        '/api/bot/:path*',
    ],
};

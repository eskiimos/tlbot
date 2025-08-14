"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const telegraf_1 = require("telegraf");
// Simple HTML template for commercial proposal
function generateProposalHTML(cartItems, userData) {
    const total = cartItems.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0);
    const rows = cartItems
        .map((it, idx) => {
        const qty = Number(it.quantity) || 1;
        const unit = (Number(it.totalPrice) || 0) / qty;
        return `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${it.productName ?? it.name ?? 'Товар'}</strong></td>
          <td style="text-align:center;">${qty} шт.</td>
          <td style="text-align:right;">${unit.toLocaleString('ru-RU')} ₽</td>
          <td style="text-align:right;">${(Number(it.totalPrice) || 0).toLocaleString('ru-RU')} ₽</td>
        </tr>`;
    })
        .join('');
    return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Коммерческое предложение</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0 auto; max-width: 860px; padding: 20px; color: #222; }
  h1 { font-size: 22px; margin: 0 0 12px; }
  .muted { color: #666; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 14px; }
  th, td { border: 1px solid #e5e7eb; padding: 8px; vertical-align: top; }
  th { background: #111; color: #fff; text-align: center; }
  tfoot td { font-weight: 700; background: #f5f5f5; }
</style>
</head>
<body>
  <h1>КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h1>
  <div class="muted">Дата: ${new Date().toLocaleDateString('ru-RU')}</div>
  <table>
    <thead>
      <tr>
        <th style="width:6%">№</th>
        <th style="width:50%">Наименование</th>
        <th style="width:12%">Кол-во</th>
        <th style="width:16%">Цена</th>
        <th style="width:16%">Сумма</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="4">ИТОГО</td>
        <td style="text-align:right;">${total.toLocaleString('ru-RU')} ₽</td>
      </tr>
    </tfoot>
  </table>
  <p class="muted">Это предварительное КП. Итоговая стоимость может измениться после согласования деталей.</p>
</body>
</html>`;
}
function escapeMdV2(text) {
    // minimal escaping for MarkdownV2 special chars
    return text.replace(/[\_\*\[\]\(\)~`>#+\-=|{}\.]/g, (m) => `\\${m}`);
}
async function POST(request) {
    const openBotUrl = 'https://t.me/Totallookas_bot';
    console.log('🚀 POST /api/proposals-html');
    try {
        const contentType = request.headers.get('content-type') || '';
        let cartItems = [];
        let userData = undefined;
        if (contentType.includes('application/json')) {
            const body = await request.json();
            cartItems = Array.isArray(body?.cartItems) ? body.cartItems : [];
            userData = body?.userData;
            console.log('📦 JSON parsed', { items: cartItems.length, hasUserData: Boolean(userData) });
        }
        else if (contentType.includes('multipart/form-data')) {
            const form = await request.formData();
            const cartRaw = form.get('cartItems');
            const userRaw = form.get('userData');
            const telegramIdRaw = form.get('telegramId');
            try {
                cartItems = cartRaw ? JSON.parse(String(cartRaw)) : [];
            }
            catch {
                cartItems = [];
            }
            try {
                userData = userRaw ? JSON.parse(String(userRaw)) : undefined;
            }
            catch {
                userData = undefined;
            }
            if (!userData && telegramIdRaw)
                userData = { telegramId: String(telegramIdRaw) };
            console.log('📦 FormData parsed', { items: cartItems.length, hasUserData: Boolean(userData), telegramId: userData?.telegramId });
        }
        else {
            return server_1.NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 400 });
        }
        if (!Array.isArray(cartItems) || cartItems.length === 0) {
            return server_1.NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }
        const telegramId = userData?.telegramId ? String(userData.telegramId) : '';
        if (!telegramId) {
            return server_1.NextResponse.json({
                error: 'Telegram ID is missing',
                action: 'askUserToOpenBotAndPressStart',
                openBotUrl,
            }, { status: 400 });
        }
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            console.error('❌ Missing TELEGRAM_BOT_TOKEN');
            return server_1.NextResponse.json({ error: 'Bot configuration is missing' }, { status: 500 });
        }
        const html = generateProposalHTML(cartItems, userData);
        console.log('✅ HTML generated', { length: html.length });
        const bot = new telegraf_1.Telegraf(botToken);
        const lines = cartItems.map((it, i) => `${i + 1}. ${it.productName ?? it.name ?? 'Товар'} — ${Number(it.quantity) || 1} шт.`);
        const header = 'Ваше коммерческое предложение готово!';
        const text = [header, '', ...lines].map(escapeMdV2).join('\n');
        console.log('📤 sendMessage', { telegramId, lines: lines.length });
        try {
            const res = await bot.telegram.sendMessage(telegramId, text, {
                parse_mode: 'MarkdownV2',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📄 Подробное КП (HTML)', url: `data:text/html;charset=utf-8,${encodeURIComponent(html)}` }],
                        [{ text: '📞 Связаться с менеджером', url: 'https://t.me/akopytin' }],
                    ],
                },
            });
            console.log('✅ sent', { message_id: res?.message_id });
            return server_1.NextResponse.json({ ok: true, messageId: res?.message_id });
        }
        catch (e) {
            const msg = String(e?.message || e);
            console.error('❌ Telegram error', msg);
            const isChatNotFound = /chat not found|bot was blocked|Forbidden/i.test(msg);
            if (isChatNotFound) {
                return server_1.NextResponse.json({
                    error: 'Чат с ботом не найден или бот заблокирован',
                    hint: 'Откройте бота и нажмите Start, затем повторите отправку',
                    openBotUrl,
                    telegramId,
                    telegramError: msg,
                }, { status: 400 });
            }
            return server_1.NextResponse.json({ error: 'Telegram send failed', telegramError: msg }, { status: 502 });
        }
    }
    catch (err) {
        console.error('❌ Server error', err);
        return server_1.NextResponse.json({ error: 'Internal server error', details: String(err?.message || err) }, { status: 500 });
    }
}

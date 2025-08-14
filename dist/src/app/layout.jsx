"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const google_1 = require("next/font/google");
require("./globals.css");
const script_1 = __importDefault(require("next/script"));
const geistSans = (0, google_1.Geist)({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});
const geistMono = (0, google_1.Geist_Mono)({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});
exports.metadata = {
    title: "Telegram Mini App",
    description: "Telegram Mini App на Next.js",
};
function RootLayout({ children, }) {
    return (<html lang="ru">
      <head>
        <script_1.default src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive"/>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>);
}

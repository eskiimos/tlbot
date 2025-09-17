'use client';

import dynamic from "next/dynamic";
import { ReactNode } from "react";

// Динамический импорт провайдера Telegram WebApp (только на клиенте)
const TelegramWebAppProvider = dynamic(
  () => import("@/components/TelegramWebAppProvider"),
  { ssr: false }
);

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <TelegramWebAppProvider>
      {children}
    </TelegramWebAppProvider>
  );
}
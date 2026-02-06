import type { Metadata } from "next";

import EmotionRegistry from "@/lib/emotion/EmotionRegistry";
import GlobalStyles from "./GlobalStyles";
import Providers from "./providers";
import { pretendard, schoolSafety } from "./fonts";

import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, type Locale } from "@/i18n/config";

export const metadata: Metadata = {
  title: {
    default: "CodexOfTouch",
    template: "%s | CodexOfTouch",
  },
  description: "Where human touch becomes a permanent record.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale =
    (cookieStore.get("NEXT_LOCALE")?.value as Locale) || defaultLocale;

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${pretendard.variable} ${schoolSafety.variable}`}
      suppressHydrationWarning
    >
      <body>
        <EmotionRegistry>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <GlobalStyles />
            <Providers>{children}</Providers>
          </NextIntlClientProvider>
        </EmotionRegistry>
      </body>
    </html>
  );
}

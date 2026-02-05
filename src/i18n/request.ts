import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import en from "../messages/en.json";
import ja from "../messages/ja.json";

export const locales = ["en", "ja"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ja";

const messages = { en, ja };

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headersList = await headers();
  
  let locale: Locale = defaultLocale;
  
  const cookieLocale = cookieStore.get("locale")?.value;
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    locale = cookieLocale as Locale;
  } else {
    const acceptLanguage = headersList.get("accept-language");
    if (acceptLanguage?.includes("ja")) {
      locale = "ja";
    } else if (acceptLanguage?.includes("en")) {
      locale = "en";
    }
  }

  return {
    locale,
    messages: messages[locale],
  };
});

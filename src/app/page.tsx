import { MainApp } from "@/components/main-app";
import { getLocale } from "next-intl/server";

export default async function Home() {
  const locale = await getLocale();
  return <MainApp locale={locale} />;
}

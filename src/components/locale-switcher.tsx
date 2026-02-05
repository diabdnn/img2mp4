"use client";

import { useTransition } from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const t = useTranslations("language");
  const [isPending, startTransition] = useTransition();

  const switchLocale = (locale: string) => {
    startTransition(() => {
      document.cookie = `locale=${locale};path=/;max-age=31536000`;
      window.location.reload();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" disabled={isPending}>
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t("toggle")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => switchLocale("en")}
          className={currentLocale === "en" ? "bg-accent" : ""}
        >
          {t("en")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLocale("ja")}
          className={currentLocale === "ja" ? "bg-accent" : ""}
        >
          {t("ja")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

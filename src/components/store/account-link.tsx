"use client";

import Link from "next/link";
import { CircleUserRound } from "lucide-react";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";

export function AccountLink({ name }: { name?: string }) {
  const t = useStoreDictionary().account;
  const label = name ? t.myAccount : t.login;
  return (
    <Link
      href={name ? "/narras/account" : "/narras/login"}
      aria-label={label}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-brown hover:bg-brown/5"
    >
      <CircleUserRound className="h-5 w-5" />
      <span className="hidden max-w-[8rem] truncate sm:inline">{name ? name.split(" ")[0] : t.login}</span>
    </Link>
  );
}

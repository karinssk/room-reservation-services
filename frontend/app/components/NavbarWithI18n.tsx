"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { resolveUploadUrl } from "@/lib/urls";
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';

export type NavItem = {
  id: string;
  label: string;
  href: string;
  children?: NavItem[];
};

type NavCta = {
  label: string;
  href: string;
};

function NavSubMenuItem({ item, locale }: { item: NavItem; locale: string }) {
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="relative group/submenu">
      <Link
        href={`/${locale}${item.href}`}
        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors border-l-2 border-transparent hover:border-black hover:bg-slate-100"
      >
        <span className="font-medium">{item.label}</span>
        {hasChildren && <span className="text-slate-400 text-sm">›</span>}
      </Link>
      {hasChildren && (
        <div className="absolute left-full top-0 ml-1 w-56 rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-2xl opacity-0 invisible -translate-x-2 transition-all duration-200 group-hover/submenu:opacity-100 group-hover/submenu:visible group-hover/submenu:translate-x-0 pointer-events-none group-hover/submenu:pointer-events-auto">
          <div className="grid gap-1">
            {item.children!.map((subChild) => (
              <Link
                key={subChild.id}
                href={`/${locale}${subChild.href}`}
                className="block rounded-lg px-3 py-2 text-sm transition-colors border-l-2 border-transparent hover:border-black hover:bg-slate-100"
              >
                <div className="font-medium text-slate-700">{subChild.label}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NavDropdownItem({ item, locale }: { item: NavItem; locale: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const hasChildren = item.children && item.children.length > 0;

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={`/${locale}${item.href}`}
        className="flex items-center gap-2 rounded-full px-3 py-2 transition hover:bg-slate-100"
      >
        {item.label}
        {hasChildren && <span className="text-xs">▾</span>}
      </Link>
      {hasChildren && (
        <div
          className={`absolute left-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-2xl transition-all duration-200 ${
            isOpen
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-1 opacity-0"
          }`}
        >
          <div className="grid gap-1">
            {item.children!.map((child) => (
              <NavSubMenuItem key={child.id} item={child} locale={locale} />
            ))}
          </div>
          {/* Dropdown arrow pointer */}
          <div className="absolute -top-2 left-4 h-4 w-4 rotate-45 border-l border-t border-slate-200 bg-white"></div>
        </div>
      )}
    </div>
  );
}

export default function NavbarWithI18n({
  items,
  cta,
  logoUrl,
}: {
  items: NavItem[];
  cta?: NavCta;
  logoUrl?: string;
}) {
  const t = useTranslations('common');
  const locale = useLocale();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white text-black">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href={`/${locale}`} className="flex items-center gap-3 text-lg font-semibold">
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
            {logoUrl ? (
              <img
                src={resolveUploadUrl(logoUrl)}
                alt="Logo"
                className="h-full w-full object-cover"
              />
            ) : null}
          </span>
          The Wang Yaowarat
        </Link>
        <div className="hidden items-center gap-6 text-sm lg:flex">
          {items.map((item) => (
            <NavDropdownItem key={item.id} item={item} locale={locale} />
          ))}
          <LanguageSwitcher />
          <Link
            href={`/${locale}${cta?.href || "#booking"}`}
            className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white"
          >
            {cta?.label || t('requestQuote')}
          </Link>
        </div>
      </div>
    </nav>
  );
}

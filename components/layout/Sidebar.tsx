"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
  usePathname,
  useSearchParams,
} from "next/navigation";

import { ChevronDown, Headphones } from "lucide-react";

const SECTIONS_STORAGE_KEY = "admin_sidebar_sections";

import {
  NAV_SECTIONS,
  type NavItem,
} from "./navigation";

function isActive(
  pathname: string,
  href?: string,
  searchParams?: URLSearchParams,
) {
  if (!href) return false;

  if (href === "/") {
    return pathname === "/";
  }

  const [basePath, query = ""] = href.split("?");

  if (
    pathname !== basePath &&
    !pathname.startsWith(`${basePath}/`)
  ) {
    return false;
  }

  if (!query) return true;

  const expected = new URLSearchParams(query);

  for (const [key, value] of expected.entries()) {
    if (searchParams?.get(key) !== value) {
      return false;
    }
  }

  return true;
}

function SidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Dropdown groups the admin opened/closed by hand; otherwise a group is open while one of its pages is
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Sections the admin collapsed/expanded by hand (remembered in this browser); otherwise a
  // section is open while it holds the current page, and Main Navigation is always open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SECTIONS_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is readable only after mount
      if (saved) setOpenSections(JSON.parse(saved));
    } catch {
      // Storage unavailable: sections just follow the current page
    }
  }, []);
  const toggleSection = (title: string, open: boolean) =>
    setOpenSections((prev) => {
      const next = { ...prev, [title]: !open };
      try {
        window.localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  const itemIsActive = (item: NavItem): boolean =>
    isActive(pathname, item.href, searchParams) || (item.children ?? []).some(itemIsActive);

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;

    if (item.children?.length) {
      const childActive = item.children.some((c) => isActive(pathname, c.href, searchParams));
      const open = openGroups[item.label] ?? childActive;
      return (
        <div key={item.label}>
          <button
            type="button"
            onClick={() => setOpenGroups((g) => ({ ...g, [item.label]: !open }))}
            aria-expanded={open}
            title={item.label}
            className={`flex h-[31px] w-full items-center gap-[7px] rounded-[7px] px-[9px] text-left text-[12px] font-medium transition-all duration-150 ${
              childActive ? "text-white" : "text-[#E8EFE9] hover:bg-white/[0.07] hover:text-white"
            }`}
          >
            <span className="grid h-[21px] w-[21px] shrink-0 place-items-center">
              <Icon className="h-[15px] w-[15px]" strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            <ChevronDown className={`h-[13px] w-[13px] shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="ml-[19px] mt-[1px] space-y-[1px] border-l border-white/15 pl-[6px]">
              {item.children.map(renderItem)}
            </div>
          )}
        </div>
      );
    }

    const active = isActive(
      pathname,
      item.href,
      searchParams,
    );

    const content = (
      <>
        <span
          className="
            grid
            h-[21px]
            w-[21px]
            shrink-0
            place-items-center
          "
        >
          <Icon
            className="h-[15px] w-[15px]"
            strokeWidth={1.8}
          />
        </span>

        <span className="min-w-0 flex-1 truncate">
          {item.label}
        </span>

        {item.badge &&
          item.badge !== "NEW" && (
            <span
              className="
                flex
                h-[19px]
                min-w-[24px]
                shrink-0
                items-center
                justify-center
                rounded-[4px]
                bg-[#8B2626]
                px-[5px]
                text-[9px]
                font-bold
                leading-none
                text-white
                shadow-[0_2px_5px_rgba(0,0,0,0.25)]
              "
            >
              {item.badge}
            </span>
          )}

      </>
    );

    // Modules that are not available yet are not listed
    if (item.disabled || !item.href) return null;

    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={onNavigate}
        title={item.label}
        aria-current={active ? "page" : undefined}
        className={`
          relative
          flex
          h-[31px]
          items-center
          gap-[7px]
          overflow-hidden
          rounded-[7px]
          px-[9px]
          text-[12px]
          font-medium
          transition-all
          duration-150

          ${active
            ? `
                bg-[linear-gradient(90deg,#2a6b30_0%,#2e7d32_55%,#4c8f35_100%)]
                font-semibold
                text-white
                shadow-[0_3px_10px_rgba(0,0,0,0.28)]
              `
            : `
                text-[#E8EFE9]
                hover:bg-white/[0.07]
                hover:text-white
              `
          }
        `}
      >
        {active && (
          <>
            <span
              className="
                pointer-events-none
                absolute
                inset-0
                bg-[linear-gradient(180deg,rgba(255,255,255,0.10),transparent)]
              "
            />
            {/* Gold marker on the current page */}
            <span className="pointer-events-none absolute left-0 top-[6px] bottom-[6px] w-[3px] rounded-r-full bg-[#e0b84a]" />
          </>
        )}

        <span className="relative z-10 contents">
          {content}
        </span>
      </Link>
    );
  };

  return (
    <aside
      className="
        relative
        flex
        h-full
        w-[240px]
        shrink-0
        flex-col
        overflow-hidden
        border-r
        border-[#1f4d2b]
        bg-[#0d3319]
        text-white
        shadow-[4px_0_18px_rgba(0,0,0,0.20)]
      "
    >
      {/* BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(180deg,#0f3a1d_0%,#0d3319_55%,#0a2913_100%)]" />

      {/* LIGHT OVERLAY */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          z-[1]
          bg-[linear-gradient(
            180deg,
            rgba(201,162,39,0.06)_0%,
            rgba(124,179,66,0.03)_55%,
            rgba(0,0,0,0.04)_100%
          )]
        "
      />

      {/* LOGO AREA */}
      <div
        className="
          relative
          z-10
          shrink-0
          px-[10px]
          pt-[14px]
          pb-[12px]
          text-center
        "
      >
        <Link href="/" className="sidebar-logo-frame group" aria-label="Vaidhyashala Admin – Dashboard">
          <span className="sidebar-logo-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sidebar/vaidhyashala-horizontal-logo.png"
              alt="Vaidhyashala Admin"
              className="
                relative
                z-[1]
                h-full
                max-h-[70px]
                w-auto
                max-w-full
                object-contain
              "
            />
          </span>
        </Link>
      </div>

      {/* NAVIGATION */}
      <nav
        className="
          relative
          z-10
          min-h-0
          flex-1
          overflow-y-auto
          overflow-x-hidden
          px-[14px]
          pb-[6px]

          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {NAV_SECTIONS.map((section, index) => {
          const items = section.items.filter((item) => !item.disabled && (item.href || item.children?.length));
          if (items.length === 0) return null;
          const holdsCurrentPage = items.some(itemIsActive);
          const open = index === 0 || (openSections[section.title] ?? holdsCurrentPage);

          return (
            <section
              key={section.title}
              className={`mb-[4px] ${index > 0 ? "border-t border-[#c9a227]/20 pt-[4px]" : ""}`}
            >
              {index === 0 ? (
                <h2 className="mb-[3px] px-[6px] py-[4px] text-[9.5px] font-bold uppercase leading-[13px] tracking-[0.06em] text-[#e0b84a]">
                  {section.title}
                </h2>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleSection(section.title, open)}
                  aria-expanded={open}
                  className="group mb-[2px] flex w-full items-center gap-[6px] rounded-[6px] px-[6px] py-[5px] text-left transition-colors hover:bg-white/[0.05]"
                >
                  <span className="min-w-0 flex-1 truncate text-[9.5px] font-bold uppercase leading-[13px] tracking-[0.06em] text-[#e0b84a]">
                    {section.title}
                  </span>
                  {!open && (
                    <span className="rounded-full bg-white/10 px-[6px] py-[1px] text-[9px] font-semibold leading-[12px] text-white/70">
                      {items.length}
                    </span>
                  )}
                  {holdsCurrentPage && !open && <span className="h-[6px] w-[6px] rounded-full bg-[#e0b84a]" aria-hidden />}
                  <ChevronDown
                    className={`h-[13px] w-[13px] shrink-0 text-[#e0b84a]/80 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                  />
                </button>
              )}

              {open && <div className="space-y-[1px] pb-[3px]">{items.map(renderItem)}</div>}
            </section>
          );
        })}
      </nav>

      {/* HELP BOX */}
      <div
        className="
          relative
          z-10
          shrink-0
          px-[15px]
          pb-[13px]
          pt-[4px]
        "
      >
        <a
          href="mailto:info@mokshasewa.org"
          className="
            relative
            flex
            h-[64px]
            items-center
            gap-[10px]
            overflow-hidden
            rounded-[9px]
            border
            border-[#c9a227]/40
            bg-[linear-gradient(90deg,#1b5e20_0%,#2e7d32_55%,#558b2f_100%)]
            px-[13px]
            text-white
            shadow-[0_4px_14px_rgba(0,0,0,0.24)]
            transition
            hover:brightness-110
          "
        >
          <span
            className="
              pointer-events-none
              absolute
              inset-0
              bg-[linear-gradient(180deg,rgba(255,255,255,0.12),transparent)]
            "
          />

          <Headphones
            className="
              relative
              z-10
              h-[29px]
              w-[29px]
              shrink-0
              text-white
            "
            strokeWidth={1.45}
          />

          <span className="relative z-10 min-w-0">
            <span
              className="
                block
                text-[11px]
                font-bold
                leading-[15px]
                text-white
              "
            >
              Need Help?
            </span>

            <span
              className="
                mt-[1px]
                block
                text-[9.5px]
                font-semibold
                leading-[13px]
                text-white
              "
            >
              Contact IT Support
            </span>
          </span>
        </a>
      </div>
    </aside>
  );
}

export default function Sidebar({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  return (
    <Suspense fallback={<aside className="flex h-screen w-[218px] shrink-0 flex-col border-r border-[#1f4d2b] bg-[#0d3319]" />}>
      <SidebarContent onNavigate={onNavigate} />
    </Suspense>
  );
}
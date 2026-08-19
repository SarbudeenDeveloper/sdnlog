"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Today" },
  { href: "/history", label: "History" },
  { href: "/search", label: "Search" },
  { href: "/summary", label: "Summary" },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <Image src="/logo.png" alt="" width={26} height={26} priority />
          <span>
            <span className="text-navy">SDN</span>
            <span className="text-brand">Log</span>
          </span>
        </Link>
        <div className="flex gap-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-2.5 py-1.5 transition-colors ${
                pathname === link.href
                  ? "bg-navy font-medium text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

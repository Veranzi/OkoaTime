"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";

const navLinks = [
  { label: "Services", href: "/#services" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-card"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/okoatiimelogoo.png" alt="OkoaTime" width={38} height={38} className="rounded-xl" />
          <span className={cn("font-outfit font-bold text-xl", isScrolled ? "text-navy" : "text-white")}>
            Okoa<span className="text-orange">Time</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg font-josefin text-sm font-semibold transition-colors",
                  isScrolled
                    ? "text-navy hover:text-orange hover:bg-orange-50"
                    : "text-white/90 hover:text-white hover:bg-white/10"
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className={cn(
              "px-4 py-2 font-outfit font-semibold text-sm rounded-xl transition-colors",
              isScrolled
                ? "text-navy hover:text-orange"
                : "text-white hover:text-orange-200"
            )}
          >
            Login
          </Link>
          <Link href="/dashboard/order/new">
            <Button size="sm" variant="primary">Order Now</Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 rounded-lg"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className={cn("w-6 h-6", isScrolled ? "text-navy" : "text-white")} />
          ) : (
            <Menu className={cn("w-6 h-6", isScrolled ? "text-navy" : "text-white")} />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-navy font-josefin font-semibold text-sm rounded-xl hover:bg-navy-50 hover:text-orange transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
              <Link href="/login" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">Login</Button>
              </Link>
              <Link href="/dashboard/order/new" className="flex-1">
                <Button variant="primary" size="sm" className="w-full">Order Now</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

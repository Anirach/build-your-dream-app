import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export interface Crumb {
  label: string;
  to?: string;
}

export function PageHeader({
  crumbs,
  title,
  subtitle,
  refreshed = "5 Aug 2026, 09:12",
  primary,
  secondary,
}: {
  crumbs: Crumb[];
  title: string;
  subtitle: string;
  refreshed?: string;
  primary?: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <header className="mb-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {crumbs.map((crumb, i) => (
            <li key={crumb.label} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3" aria-hidden />}
              {crumb.to ? (
                <Link to={crumb.to} className="hover:text-primary hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{crumb.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <h1 className="text-2xl font-semibold text-navy sm:text-3xl">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
          <p className="tnum mt-2 text-xs text-muted-foreground">
            Last refreshed {refreshed} · <span className="font-semibold">Synthetic</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {secondary}
          {primary}
        </div>
      </div>
    </header>
  );
}
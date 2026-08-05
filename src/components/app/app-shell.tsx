import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Bookmark,
  ClipboardList,
  ClipboardCheck,
  Database,
  Gauge,
  HelpCircle,
  History,
  LayoutDashboard,
  Layers,
  ListChecks,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { modules } from "@/demo-data/modules";
import { roles } from "@/demo-data/people";
import { standards } from "@/demo-data/standards";
import { useDemoState } from "@/demo-data/store";
import { roleCanView, roleNavAccess } from "@/components/app/nav-access";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/delivery-readiness", label: "Production Readiness", icon: ClipboardList },
  { to: "/programme", label: "Programme", icon: Layers },
  { to: "/standards", label: "Standards Library", icon: Bookmark },
  { to: "/workbench", label: "AI Workbench", icon: Sparkles },
  { to: "/reviews", label: "Reviews", icon: ClipboardCheck },
  { to: "/gap-analysis", label: "Gap Analysis", icon: ListChecks },
  { to: "/audit", label: "Audit and Lineage", icon: History },
  { to: "/data-intake", label: "Data Intake", icon: Database },
  { to: "/sla-analytics", label: "SLA Analytics", icon: Gauge },
  { to: "/roles", label: "Role Management", icon: ShieldCheck },
];

function useActivePath() {
  return useRouterState({ select: (s) => s.location.pathname });
}

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = useActivePath();
  const { role } = useDemoState();
  const emphasis = roles.find((r) => r.id === role)?.emphasis ?? [];
  const allowed = navItems.filter((item) => roleNavAccess[role].includes(item.to));

  return (
    <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 px-3">
      {allowed.map((item) => {
        const active = isActive(pathname, item.to);
        const highlighted = emphasis.some((e) => e.startsWith(item.to) && item.to !== "/");
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              active
                ? "bg-soft-blue text-navy"
                : "text-muted-foreground hover:bg-secondary hover:text-navy",
            )}
          >
            {active && (
              <span className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r bg-primary" aria-hidden />
            )}
            <item.icon className="size-[18px] shrink-0" aria-hidden />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && highlighted && !active && (
              <span className="ml-auto size-1.5 rounded-full bg-teal" aria-label="Relevant to your role" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function GlobalSearch({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Global search</DialogTitle>
          <DialogDescription>Search synthetic modules and placeholder standards.</DialogDescription>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Search modules, placeholder standards, pages..." />
          <CommandList>
            <CommandEmpty>No synthetic records match that search.</CommandEmpty>
            <CommandGroup heading="Pages">
              {navItems.map((item) => (
                <CommandItem key={item.to} value={item.label} asChild>
                  <Link to={item.to} onClick={() => setOpen(false)}>
                    {item.label}
                  </Link>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Modules (synthetic)">
              {modules.slice(0, 12).map((m) => (
                <CommandItem key={m.code} value={`${m.code} ${m.label}`} asChild>
                  <Link
                    to="/programme/modules/$moduleId"
                    params={{ moduleId: m.code }}
                    onClick={() => setOpen(false)}
                  >
                    {m.code} - {m.label}
                  </Link>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Placeholder standards">
              {standards.slice(0, 8).map((s) => (
                <CommandItem key={s.id} value={`${s.id} ${s.title}`} asChild>
                  <Link
                    to="/standards/$standardId"
                    params={{ standardId: s.id }}
                    onClick={() => setOpen(false)}
                  >
                    {s.id} - {s.title}
                  </Link>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function Wordmark({ compact }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span
        className="grid size-8 shrink-0 place-items-center rounded-md bg-navy text-[11px] font-bold tracking-tight text-navy-foreground"
        aria-hidden
      >
        BD
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-semibold text-navy">BDMS Intelligence</span>
          <span className="block text-[11px] text-muted-foreground">Commissioning readiness</span>
        </span>
      )}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useActivePath();
  const { role, setRole, resetDemo, actor, signOut } = useDemoState();
  const activeRole = roles.find((r) => r.id === role) ?? roles[3]!;
  const mobileNav = navItems
    .filter((item) => roleNavAccess[role].includes(item.to))
    .slice(0, 4);
  const authorisedHere = roleCanView(role, pathname);
  const homeFor = roles.find((r) => r.id === role)?.landing ?? "/";
  const initials = actor
    .replace(/^Dr\.\s*/, "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                <Menu className="size-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[264px] p-0">
              <SheetHeader className="border-b border-border px-4 py-4">
                <SheetTitle className="text-left">
                  <Wordmark />
                </SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <NavList collapsed={false} onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="lg:w-[248px]">
            <Wordmark />
          </div>

          <span className="hidden max-w-[28ch] truncate text-xs text-muted-foreground md:inline">
            SHSIRC - Dhaka / {pathname === "/" ? "Executive Overview" : pathname}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden gap-2 sm:flex"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-4" aria-hidden />
              <span>Search</span>
              <kbd className="rounded border border-border bg-secondary px-1 text-[10px]">⌘K</kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-5" aria-hidden />
            </Button>

            <span className="hidden items-center gap-1.5 rounded-md border border-warning/30 bg-warning-surface px-2.5 py-1 text-[11px] font-semibold text-warning md:inline-flex">
              Concept Mockup - Synthetic Data
            </span>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications (4 synthetic)">
                  <Bell className="size-5" aria-hidden />
                  <span className="tnum absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-danger text-[10px] font-bold text-primary-foreground">
                    4
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <p className="text-sm font-semibold text-navy">Notifications (synthetic)</p>
                <ul className="mt-3 space-y-3 text-sm">
                  <li>M03 ICU Readiness moved to RED after rule recalculation.</li>
                  <li>Draft mapping RUN-2026-0814-A is awaiting your review.</li>
                  <li>Review REV-0092 is overdue by 1 day.</li>
                  <li>One citation was auto-rejected on REV-0094.</li>
                </ul>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Help and terminology">
                  <HelpCircle className="size-5" aria-hidden />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <p className="text-sm font-semibold text-navy">Terminology</p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div>
                    <dt className="font-medium">RAG</dt>
                    <dd className="text-muted-foreground">Rule-calculated readiness status. Never set by hand.</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Draft</dt>
                    <dd className="text-muted-foreground">Agent output awaiting human approval.</dd>
                  </div>
                  <div>
                    <dt className="font-medium">BL0</dt>
                    <dd className="text-muted-foreground">Frozen schedule baseline SCH-001.</dd>
                  </div>
                </dl>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-11 gap-2 px-2">
                  <span
                    className="grid size-8 place-items-center rounded-full bg-soft-teal text-xs font-semibold text-navy"
                    aria-hidden
                  >
                    {initials}
                  </span>
                  <span className="hidden text-left leading-tight xl:block">
                    <span className="block text-xs font-semibold text-navy">{actor}</span>
                    <span className="block text-[11px] text-muted-foreground">{activeRole.name}</span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Switch role (mockup only)</DropdownMenuLabel>
                {roles.map((r) => (
                  <DropdownMenuItem
                    key={r.id}
                    onSelect={() => {
                      setRole(r.id);
                      toast.info(`Role switched to ${r.name}`, { description: r.focus });
                    }}
                    className={cn("flex-col items-start gap-0.5", r.id === role && "bg-soft-blue")}
                  >
                    <span className="text-sm font-medium">{r.name}</span>
                    <span className="text-xs text-muted-foreground">{r.focus}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    resetDemo();
                    toast.success("Demo state reset", {
                      description: "Session review decisions were cleared.",
                    });
                  }}
                >
                  <RotateCcw className="size-4" aria-hidden /> Reset demo state
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    signOut();
                    toast.info("Signed out", { description: "Pick another sample role to continue." });
                  }}
                >
                  <LogOut className="size-4" aria-hidden /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              className="hidden gap-2 sm:flex"
              onClick={() => {
                signOut();
                toast.info("Signed out", { description: "Pick another sample role to continue." });
              }}
            >
              <LogOut className="size-4" aria-hidden /> Log out
            </Button>
          </div>
        </div>
        <div className="border-t border-border bg-warning-surface px-4 py-1 text-center text-[11px] font-semibold text-warning md:hidden">
          Concept Mockup - Synthetic Data
        </div>
      </header>

      <div className="flex">
        <aside
          className={cn(
            "sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 flex-col border-r border-border bg-sidebar py-5 lg:flex",
            collapsed ? "w-[72px]" : "w-[248px]",
          )}
        >
          <NavList collapsed={collapsed} />
          <div className="mt-4 space-y-3 px-3">
            {!collapsed && (
              <p className="rounded-lg bg-secondary px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                SHSIRC - Dhaka / Demo
                <br />
                Baseline BL0 - SCH-001
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4" aria-hidden />
              ) : (
                <>
                  <PanelLeftClose className="size-4" aria-hidden /> Collapse
                </>
              )}
            </Button>
          </div>
        </aside>

        <main id="main" className="min-w-0 flex-1 pb-24 lg:pb-0">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-5 lg:px-8 lg:py-8">
            {authorisedHere ? (
              children
            ) : (
              <div className="mx-auto max-w-xl rounded-xl border border-warning/30 bg-warning-surface p-6 text-center">
                <ShieldCheck className="mx-auto size-6 text-warning" aria-hidden />
                <h1 className="mt-3 text-lg font-semibold text-navy">
                  This screen is outside your mandate
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {activeRole.name} does not have access to {pathname}. The attempt is recorded in
                  the audit trail. Switch role from the profile menu or return to your home screen.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button asChild size="sm">
                    <Link to={homeFor}>Go to my home screen</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      signOut();
                      toast.info("Signed out");
                    }}
                  >
                    <LogOut className="size-4" aria-hidden /> Log out
                  </Button>
                </div>
              </div>
            )}
          </div>
          <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground sm:px-5 lg:px-8">
            <p>BDMS Confidential | Concept mockup using synthetic data | Not clinical guidance</p>
            <p className="mt-1">
              For workflow validation only. Not a production system or source of clinical guidance.
            </p>
          </footer>
        </main>
      </div>

      <nav
        aria-label="Mobile primary"
        className="fixed bottom-0 z-40 flex w-full items-stretch border-t border-border bg-card lg:hidden"
      >
        {mobileNav.map((item) => {
          const active = isActive(pathname, item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" aria-hidden />
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
        <Sheet>
          <SheetTrigger className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground">
            <Menu className="size-5" aria-hidden />
            More
          </SheetTrigger>
          <SheetContent side="bottom" className="pb-8">
            <SheetHeader>
              <SheetTitle>More destinations</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <NavList collapsed={false} />
            </div>
          </SheetContent>
        </Sheet>
      </nav>

      <GlobalSearch open={searchOpen} setOpen={setSearchOpen} />
    </div>
  );
}
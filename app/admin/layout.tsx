
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { getAuthenticatedUser } from "@/lib/auth";

import { AppSidebar } from "@/app/component/app-sidebar";
import { LogoutMenuItem } from "@/app/component/logout-menu-item";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Separator } from "@/components/ui/separator";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticatedUser = await getAuthenticatedUser();
  if (!authenticatedUser) redirect("/");
  const initials = authenticatedUser.fullname
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  return (
      <SidebarProvider
        style={{ "--sidebar-width": "10.75rem" } as CSSProperties}
      >
        {/* Sidebar utama admin */}
        <AppSidebar />

        <SidebarInset>
          {/* Navbar bagian atas */}
          <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-4">

            {/* Tombol buka/tutup sidebar */}
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />

              <Separator
                orientation="vertical"
                className="mr-2 h-4"
              />
            </div>

            {/* Dropdown profil admin */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Buka menu akun"
                  className="rounded-full"
                >
                  <Avatar className="size-7">
                    <AvatarImage
                      src="https://github.com/shadcn.png"
                      alt="Profile"
                    />
                    <AvatarFallback className="bg-slate-100 text-xs text-slate-700">
                      {initials || "A"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-56"
                align="end"
              >
                {/* Menu profil */}
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    Profile
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    Billing
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                {/* Menu logout */}
                <DropdownMenuGroup>
                  <LogoutMenuItem />
                </DropdownMenuGroup>

              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* Konten halaman admin */}
          <main className="flex flex-1 flex-col gap-4 bg-slate-50 p-4">
            {children}
          </main>

        </SidebarInset>
      </SidebarProvider>
  );
}

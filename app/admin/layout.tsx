
import { redirect } from "next/navigation";
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
  AvatarFallback,
  AvatarImage,
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

  return (
      <SidebarProvider>
        {/* Sidebar utama admin */}
        <AppSidebar />

        <SidebarInset>
          {/* Navbar bagian atas */}
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">

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
                  className="rounded-full"
                >
                  <Avatar>
                    <AvatarImage
                      src="https://github.com/shadcn.png"
                      alt="Profile"
                    />

                    <AvatarFallback>
                      CN
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
          <main className="flex flex-1 flex-col gap-4 p-4">
            {children}
          </main>

        </SidebarInset>
      </SidebarProvider>
  );
}

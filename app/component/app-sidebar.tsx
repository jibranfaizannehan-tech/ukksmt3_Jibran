"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Boxes,
  Building2,
  UsersRound,
  House,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const listMenu = [
  {
    name: "dashboard",
    url: "/admin",
    icon: House,
  },
  {
    name: "user management",
    url: "/admin/user-management",
    icon: UsersRound,
  },
  {
    name: "Type Unit",
    url: "/admin/type_unit",
    icon: Boxes,
  },
  {
    name: "Facilities",
    url: "/admin/facility",
    icon: Building2,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r-0 bg-emerald-800 text-white [&>div]:bg-emerald-800">
      <div className="flex h-full w-full flex-col bg-emerald-800 text-white">
        {/* Header Logo */}
        <SidebarHeader className="bg-emerald-800 px-3 py-5">
          <div className="flex items-center gap-2">
            <Image
              src="/img/Yamada Ryo.jpg"
              alt="Admin"
              width={32}
              height={32}
              className="size-8 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold tracking-wide">Admin</p>
            </div>
          </div>
        </SidebarHeader>

        {/* Content Menu */}
        <SidebarContent className="bg-emerald-800">
          <SidebarGroup>
            <SidebarGroupLabel className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
              Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {listMenu.map((menu) => (
                  <SidebarMenuItem key={menu.name}>
                    <SidebarMenuButton
                      asChild
                      className={`h-8 text-xs text-white/90 hover:bg-white/10 hover:text-white active:bg-white/15 ${
                        pathname === menu.url || pathname.startsWith(`${menu.url}/`)
                          ? "bg-white/15 text-white"
                          : ""
                      }`}
                    >
                      <Link
                        href={menu.url}
                        aria-current={
                          pathname === menu.url ||
                          pathname.startsWith(`${menu.url}/`)
                            ? "page"
                            : undefined
                        }
                      >
                        <menu.icon className="mr-2 size-3.5" />
                        <span>{menu.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="bg-emerald-800" />
      </div>
    </Sidebar>
  );
}
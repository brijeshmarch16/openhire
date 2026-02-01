"use client";

import { Briefcase, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { Button } from "../ui/button";
import { Text } from "../ui/text";

const mainMenu = [
  {
    name: "Interviews",
    url: "/",
    icon: Briefcase,
    description: "View and manage all interviews",
  },
  // {
  //   name: "Settings",
  //   url: "/settings",
  //   icon: Settings,
  //   description: "Manage organization, security, and team members",
  // },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState("");

  const onLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/signin");
        },
      },
    });
  };

  const getUsername = useCallback(async () => {
    const { data } = await authClient.getSession();

    if (data) {
      setUsername(data.user.name || "");
    }
  }, []);

  useEffect(() => {
    getUsername();
  }, [getUsername]);

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>{/* // TODO: Add logo here */}</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {mainMenu.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild tooltip={item.description}>
                  <Link href={item.url as "/"}>
                    {item.icon && <item.icon className="text-muted-foreground" />}
                    <span
                      className={
                        item.url === pathname ||
                        (item.url !== "/" && pathname?.startsWith(item.url))
                          ? "font-semibold text-primary"
                          : "font-medium"
                      }
                    >
                      {item.name}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-2">
        <div className="rounded-md p-2 hover:bg-sidebar-accent">
          <div className="flex items-center justify-between">
            <Text>{username}</Text>
            <Button variant="ghost" onClick={onLogout}>
              <LogOut className="cursor-pointer text-muted-foreground" size={16} />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

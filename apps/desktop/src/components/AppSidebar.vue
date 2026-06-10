<script lang="ts" setup>
import type { UserRole } from "@tb/shared";
import { useSidebar, type SidebarProps } from "@/components/ui/sidebar";
const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: "icon",
});

const { licenseSession } = useAppStore();
const userRole = computed(() => licenseSession?.user.role || "USER");
const isAdmin = computed(
  () => userRole.value === "ADMIN" || userRole.value === "OWNER"
);

const navMain: AppNavMain[] = [
  {
    title: "Dashboard",
    url: "/app",
    icon: "clarity:dashboard-line",
  },
  {
    title: "Analytics",
    url: "/app/analytics",
    icon: "clarity:analytics-line",
  },
  {
    title: "Campaigns",
    url: "/app/campaigns",
    icon: "material-symbols:campaign",
    roles: ["OWNER", "ADMIN", "USER"],
  },
  {
    title: "Proxies",
    url: "/app/proxies",
    icon: "material-symbols:vpn-lock",
    roles: ["OWNER", "ADMIN", "USER"],
  },
  {
    title: "Fingerprint",
    url: "/app/fingerprints",
    icon: "ooui:user-anonymous",
    roles: ["OWNER", "ADMIN", "USER"],
  },
  {
    title: "Behaviour",
    url: "/app/behaviours",
    icon: "material-symbols:neurology-outline",
    roles: ["OWNER", "ADMIN", "USER"],
  },
  {
    title: "Tools",
    url: "/app/tools",
    icon: "mdi:tools",
    roles: ["OWNER", "ADMIN", "USER"],
  },
  {
    title: "Workers",
    url: "/app/workers-node",
    icon: "devicon-plain:cloudflareworkers",
    roles: ["OWNER", "ADMIN", "USER"],
  },
  {
    title: "Audit Logs",
    url: "/app/audit-logs",
    icon: "material-symbols:history",
    roles: ["OWNER", "ADMIN", "USER"],
  },
];

const navSecondary: AppNavMain[] = [
  {
    title: "Accounts",
    url: "#",
    icon: "material-symbols:account-circle",
    children: [
      {
        title: "Profile",
        url: "/app/accounts",
      },
      {
        title: "License",
        url: "/app/accounts/license",
      },
    ],
  },
];

const navMainItems = computed(() => {
  const items = navMain.filter((item) => {
    if (!item.roles?.length) {
      return true;
    }

    return item.roles.includes(userRole.value as UserRole);
  });

  if (isAdmin.value) {
    items.push({
      title: "Users",
      url: "/app/users",
      icon: "material-symbols:group-outline",
    });
  }

  return items;
});

const { isMobile, state, open } = useSidebar();

const isIconMode = computed(() => {
  if (isMobile.value) return true;
  return state.value === "collapsed" || !open.value;
});
const showAppName = computed(() => {
  return !isIconMode.value;
});
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            as-child
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div class="flex items-center gap-2">
              <div class="flex size-8 items-center justify-center rounded-lg">
                <img
                  src="/logo.png"
                  alt="Steelheart She's Gone"
                  class="size-7"
                />
              </div>
              <div
                v-show="showAppName"
                class="grid flex-1 text-left text-sm leading-tight transition-all duration-200"
              >
                <span class="truncate font-semibold text-foreground">
                  Steelheart
                </span>
                <span class="truncate text-xs text-muted-foreground">
                  She's Gone
                </span>
              </div>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <AppNavMain :items="navMainItems" />
      <AppNavSecondary :items="navSecondary" />
    </SidebarContent>
    <SidebarFooter>
      <!-- <AppNavUser :user="user" /> -->
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>

<style scoped></style>

import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";
import { useAppStore } from "@/stores/app.store";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("../layouts/GuestLayout.vue"),
    children: [
      {
        path: "",
        name: "index",
        component: () => import("../pages/Index.vue"),
        meta: { middleware: "guest", title: "Login" },
      }
    ]
  },
  {
    path: "/app",
    component: () => import("../layouts/AppLayout.vue"),
    children: [
      {
        path: "",
        name: "Dashboard",
        component: () => import("../pages/app/Index.vue"),
        meta: { middleware: "auth", title: "Dashboard" },
      },
      {
        path: "analytics",
        name: "Analytics",
        component: () => import("../pages/app/analytics/Index.vue"),
        meta: { middleware: "auth", title: "Analytics" },
      },
      {
        path: "analytics/:id/detail",
        name: "AnalyticsDetail",
        component: () => import("../pages/app/analytics/Detail.vue"),
        meta: { middleware: "auth", title: "Analytics Detail" },
      },
      {
        path: "campaigns",
        name: "Campaigns",
        component: () => import("../pages/app/campaigns/Index.vue"),
        meta: { middleware: "auth", title: "Campaigns" },
      },
      {
        path: "campaigns/create",
        name: "CampaignsCreate",
        component: () => import("../pages/app/campaigns/Create.vue"),
        meta: { middleware: "auth", title: "Campaigns Create" },
      },
      {
        path: "campaigns/:id/edit",
        name: "CampaignsEdit",
        component: () => import("../pages/app/campaigns/Edit.vue"),
        meta: { middleware: "auth", title: "Campaigns Edit" },
      },
      {
        path: "campaigns/:id/detail",
        name: "CampaignsDetail",
        component: () => import("../pages/app/campaigns/Detail.vue"),
        meta: { middleware: "auth", title: "Campaigns Detail" },
      },
      {
        path: "proxies",
        name: "Proxies",
        component: () => import("../pages/app/proxies/Index.vue"),
        meta: { middleware: "auth", title: "Proxies" },
      },
      {
        path: "fingerprints",
        name: "Fingerprints",
        component: () => import("../pages/app/fingerprints/Index.vue"),
        meta: { middleware: "auth", title: "Fingerprints" },
      },
      {
        path: "fingerprints/create",
        name: "FingerprintsCreate",
        component: () => import("../pages/app/fingerprints/Create.vue"),
        meta: { middleware: "auth", title: "Fingerprints Create" },
      },
      {
        path: "fingerprints/:id/detail",
        name: "FingerprintsDetail",
        component: () => import("../pages/app/fingerprints/Detail.vue"),
        meta: { middleware: "auth", title: "Fingerprints Detail" },
      },
      {
        path: "fingerprints/:id/edit",
        name: "FingerprintsEdit",
        component: () => import("../pages/app/fingerprints/Edit.vue"),
        meta: { middleware: "auth", title: "Fingerprints Edit" },
      },
      {
        path: "behaviours",
        name: "Behaviours",
        component: () => import("../pages/app/behaviours/Index.vue"),
        meta: { middleware: "auth", title: "Behaviours" },
      },
      {
        path: "behaviours/create",
        name: "BehavioursCreate",
        component: () => import("../pages/app/behaviours/Create.vue"),
        meta: { middleware: "auth", title: "Behaviours Create" },
      },
      {
        path: "behaviours/:id/detail",
        name: "BehavioursDetail",
        component: () => import("../pages/app/behaviours/Detail.vue"),
        meta: { middleware: "auth", title: "Behaviours Detail" },
      },
      {
        path: "behaviours/:id/edit",
        name: "BehavioursEdit",
        component: () => import("../pages/app/behaviours/Edit.vue"),
        meta: { middleware: "auth", title: "Behaviours Edit" },
      },
      {
        path: "tools",
        name: "Tools",
        component: () => import("../pages/app/tools/Index.vue"),
        meta: { middleware: "auth", title: "Tools" },
      },
      {
        path: "tools/:id/detail",
        name: "ToolsDetail",
        component: () => import("../pages/app/tools/Detail.vue"),
        meta: { middleware: "auth", title: "Tools Detail" },
      },
      {
        path: "tools/settings",
        name: "ToolsSettings",
        component: () => import("../pages/app/tools/Index.vue"),
        meta: { middleware: "auth", title: "App Settings" },
      },
      {
        path: "workers-node",
        name: "WorkersNodes",
        component: () => import("../pages/app/workers-node/Index.vue"),
        meta: { middleware: "auth", title: "Workers Nodes" },
      },
      {
        path: "users",
        name: "Users",
        component: () => import("../pages/app/users/Index.vue"),
        meta: { middleware: "auth", title: "Users", requiresAdmin: true, roles: ["OWNER", "ADMIN"] },
      },
      {
        path: "accounts",
        name: "Accounts",
        component: () => import("../pages/app/accounts/Index.vue"),
        meta: { middleware: "auth", title: "Accounts" },
      },
      {
        path: "accounts/license",
        name: "AccountsLicense",
        component: () => import("../pages/app/accounts/License.vue"),
        meta: { middleware: "auth", title: "Accounts License" },
      },
      {
        path: "audit-logs",
        name: "AuditLogs",
        component: () => import("../pages/app/audit-logs/Index.vue"),
        meta: { middleware: "auth", title: "Audit Logs" },
      }
    ]
  },
  {
    path: "/access-denied",
    name: "AccessDenied",
    component: () => import("../pages/AccessDenied.vue"),
    meta: { middleware: "auth", title: "Access Denied" },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("../pages/NotFound.vue"),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

declare module "vue-router" {
  interface RouteMeta {
    middleware?: "auth" | "guest";
    requiresAdmin?: boolean;
    roles?: string[];
    title?: string;
  }
}
/**
 * Connection guard — desktop MVP single-user.
 * "auth"  routes: require a saved API token in localStorage.
 * "guest" routes: redirect to dashboard if token already set.
 *
 * We don't do a live HTTP ping here to keep navigation instant.
 * The actual connection health is checked on the Index page and
 * reflected in the app store (appStore.connected).
 */
router.beforeEach(async (to) => {
  const appStore = useAppStore()
  const isAuthRoute = to.meta.middleware === "auth"
  const isGuestRoute = to.meta.middleware === "guest"

  if (typeof to.meta.title === "string") {
    document.title = `${to.meta.title} - Steelheart`
  }

  if (isAuthRoute) {
    const authenticated = await appStore.ensureAuthenticated()
    if (!authenticated) {
      return {
        name: "index",
        query: to.fullPath === "/" ? undefined : { redirect: to.fullPath },
      }
    }

    const role = appStore.licenseSession?.user.role ?? "USER"
    const allowedRoles = to.meta.roles

    if (to.meta.requiresAdmin && !["OWNER", "ADMIN"].includes(role)) {
      return { name: "AccessDenied" }
    }

    if (allowedRoles?.length && !allowedRoles.includes(role)) {
      return { name: "AccessDenied" }
    }
  }

  if (isGuestRoute && appStore.isLicenseLocallyUsable) {
    return { name: "Dashboard" }
  }
});

export default router;

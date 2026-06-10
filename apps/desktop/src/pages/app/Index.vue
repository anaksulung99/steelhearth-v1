<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { useAnalyticsStore } from "@/stores/analytics.store";
import { useCampaignStore } from "@/stores/campaign.store";

const analyticsStore = useAnalyticsStore();
const campaignStore = useCampaignStore();

onMounted(async () => {
  await Promise.all([
    analyticsStore.fetchDashboard(),
    campaignStore.fetchAll(),
  ]);
});

const stats = computed(() => analyticsStore.dashboard);

const statCards = computed(() => [
  {
    label: "Active Campaigns",
    value: stats.value?.activeCampaigns ?? 0,
    total: stats.value?.totalCampaigns,
    icon: "material-symbols:campaign",
    color: "text-blue-500",
  },
  {
    label: "Running Sessions",
    value: stats.value?.runningSessions ?? 0,
    sub: `${stats.value?.queuedSessions ?? 0} queued`,
    icon: "material-symbols:play-circle-outline",
    color: "text-emerald-500",
  },
  {
    label: "Sessions Today",
    value: stats.value?.sessionsToday ?? 0,
    sub: `${stats.value?.successRateToday ?? 0}% success rate`,
    icon: "material-symbols:bar-chart",
    color: "text-violet-500",
  },
  {
    label: "Active Proxies",
    value: stats.value?.activeProxies ?? 0,
    total: stats.value?.totalProxies,
    icon: "material-symbols:vpn-lock",
    color: "text-orange-500",
  },
  {
    label: "Online Workers",
    value: stats.value?.onlineWorkers ?? 0,
    sub: `${stats.value?.activeJobs ?? 0} active jobs`,
    icon: "devicon-plain:cloudflareworkers",
    color: "text-cyan-500",
  },
]);

const recentCampaigns = computed(() => campaignStore.items.slice(0, 5));

const statusColor: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  ACTIVE: "bg-emerald-500/15 text-emerald-600",
  PAUSED: "bg-yellow-500/15 text-yellow-600",
  STOPPED: "bg-neutral-500/15 text-neutral-600",
  COMPLETED: "bg-blue-500/15 text-blue-600",
  FAILED: "bg-red-500/15 text-red-600",
};
</script>

<template>
  <div class="p-6 space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <p class="text-sm text-muted-foreground mt-1">
        Overview of your traffic simulation system
      </p>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <div
        v-for="card in statCards"
        :key="card.label"
        class="rounded-lg border bg-card p-4 space-y-2"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-muted-foreground">{{ card.label }}</span>
          <Icon :icon="card.icon" class="size-4" :class="card.color" />
        </div>
        <p class="text-2xl font-bold">{{ card.value }}</p>
        <p
          v-if="card.total !== undefined"
          class="text-xs text-muted-foreground"
        >
          of {{ card.total }} total
        </p>
        <p v-else-if="card.sub" class="text-xs text-muted-foreground">
          {{ card.sub }}
        </p>
      </div>
    </div>

    <!-- Recent Campaigns -->
    <div class="rounded-lg border bg-card">
      <div class="flex items-center justify-between px-4 py-3 border-b">
        <h2 class="font-semibold text-sm">Recent Campaigns</h2>
        <router-link
          to="/app/campaigns"
          class="text-xs text-primary hover:underline"
          >View all</router-link
        >
      </div>
      <div
        v-if="campaignStore.loading"
        class="p-8 text-center text-sm text-muted-foreground"
      >
        Loading...
      </div>
      <div
        v-else-if="!recentCampaigns.length"
        class="p-8 text-center text-sm text-muted-foreground"
      >
        No campaigns yet.
        <router-link
          to="/app/campaigns/create"
          class="text-primary hover:underline"
          >Create one</router-link
        >
      </div>
      <div v-else class="divide-y">
        <router-link
          v-for="c in recentCampaigns"
          :key="c.id"
          :to="`/app/campaigns/${c.id}/detail`"
          class="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
        >
          <div class="space-y-0.5">
            <p class="text-sm font-medium">{{ c.name }}</p>
            <p class="text-xs text-muted-foreground truncate max-w-xs">
              {{ c.targetUrl }}
            </p>
          </div>
          <span
            class="text-xs rounded-full px-2 py-0.5 font-medium"
            :class="statusColor[c.status]"
          >
            {{ c.status }}
          </span>
        </router-link>
      </div>
    </div>
  </div>
</template>

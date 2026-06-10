<script lang="ts" setup>
import { Icon } from "@iconify/vue"
import { useAnalyticsStore } from "@/stores/analytics.store"
import { useCampaignStore } from "@/stores/campaign.store"

const analyticsStore = useAnalyticsStore()
const campaignStore = useCampaignStore()

onMounted(async () => {
  await Promise.all([analyticsStore.fetchDashboard(), campaignStore.fetchAll()])
})

const stats = computed(() => analyticsStore.dashboard)
</script>

<template>
  <div class="p-6 space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Analytics</h1>
      <p class="text-sm text-muted-foreground mt-0.5">System-wide traffic simulation analytics</p>
    </div>

    <div v-if="analyticsStore.loading" class="p-12 text-center text-sm text-muted-foreground">Loading...</div>

    <div v-else-if="stats" class="space-y-6">
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div class="rounded-lg border bg-card p-4 space-y-1">
          <p class="text-xs text-muted-foreground">Total Campaigns</p>
          <p class="text-2xl font-bold">{{ stats.totalCampaigns }}</p>
          <p class="text-xs text-muted-foreground">{{ stats.activeCampaigns }} active</p>
        </div>
        <div class="rounded-lg border bg-card p-4 space-y-1">
          <p class="text-xs text-muted-foreground">Sessions Today</p>
          <p class="text-2xl font-bold">{{ stats.sessionsToday }}</p>
          <p class="text-xs text-muted-foreground">{{ stats.successRateToday }}% success</p>
        </div>
        <div class="rounded-lg border bg-card p-4 space-y-1">
          <p class="text-xs text-muted-foreground">Active Proxies</p>
          <p class="text-2xl font-bold">{{ stats.activeProxies }}</p>
          <p class="text-xs text-muted-foreground">of {{ stats.totalProxies }} total</p>
        </div>
        <div class="rounded-lg border bg-card p-4 space-y-1">
          <p class="text-xs text-muted-foreground">Online Workers</p>
          <p class="text-2xl font-bold">{{ stats.onlineWorkers }}</p>
          <p class="text-xs text-muted-foreground">{{ stats.activeJobs }} active jobs</p>
        </div>
      </div>

      <div class="rounded-lg border bg-card">
        <div class="px-4 py-3 border-b">
          <h2 class="font-semibold text-sm">Campaigns</h2>
        </div>
        <div class="divide-y">
          <router-link
            v-for="c in campaignStore.items"
            :key="c.id"
            :to="`/app/analytics/${c.id}/detail`"
            class="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
          >
            <div>
              <p class="text-sm font-medium">{{ c.name }}</p>
              <p class="text-xs text-muted-foreground truncate max-w-xs">{{ c.targetUrl }}</p>
            </div>
            <Icon icon="material-symbols:chevron-right" class="size-4 text-muted-foreground" />
          </router-link>
          <div v-if="!campaignStore.items.length" class="p-8 text-center text-sm text-muted-foreground">
            No campaigns to analyze
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

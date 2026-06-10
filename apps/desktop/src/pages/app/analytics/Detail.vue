<script lang="ts" setup>
import { Icon } from "@iconify/vue"
import { useAnalyticsStore } from "@/stores/analytics.store"
import { useCampaignStore } from "@/stores/campaign.store"

const route = useRoute()
const id = route.params.id as string

const analyticsStore = useAnalyticsStore()
const campaignStore = useCampaignStore()

onMounted(async () => {
  await Promise.all([analyticsStore.fetchCampaign(id), campaignStore.fetchOne(id)])
})

const analytics = computed(() => analyticsStore.campaignAnalytics[id])
const campaign = computed(() => campaignStore.current)

const progressPercent = computed(() => {
  if (!analytics.value || !campaign.value) return 0
  return Math.round((analytics.value.totalSessions / campaign.value.totalSessionsTarget) * 100)
})
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center gap-3">
      <router-link to="/app/analytics">
        <button class="p-1 rounded hover:bg-muted">
          <Icon icon="material-symbols:arrow-back" class="size-5" />
        </button>
      </router-link>
      <div>
        <h1 class="text-2xl font-bold">{{ campaign?.name ?? "Campaign Analytics" }}</h1>
        <p v-if="campaign" class="text-sm text-muted-foreground">{{ campaign.targetUrl }}</p>
      </div>
    </div>

    <div v-if="!analytics" class="p-12 text-center text-sm text-muted-foreground">Loading...</div>

    <div v-else class="space-y-4">
      <!-- Progress -->
      <div class="rounded-lg border bg-card p-4 space-y-3">
        <div class="flex justify-between text-sm">
          <span class="font-medium">Session Progress</span>
          <span class="text-muted-foreground">{{ analytics.totalSessions }} / {{ campaign?.totalSessionsTarget ?? '?' }}</span>
        </div>
        <div class="h-2 rounded-full bg-muted overflow-hidden">
          <div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${progressPercent}%` }" />
        </div>
        <p class="text-xs text-muted-foreground">{{ progressPercent }}% complete</p>
      </div>

      <!-- Stats grid -->
      <div class="grid grid-cols-3 gap-4 lg:grid-cols-6">
        <div class="rounded-lg border bg-card p-3 space-y-1">
          <p class="text-xs text-muted-foreground">Total</p>
          <p class="text-xl font-bold">{{ analytics.totalSessions }}</p>
        </div>
        <div class="rounded-lg border bg-card p-3 space-y-1">
          <p class="text-xs text-muted-foreground">Success</p>
          <p class="text-xl font-bold text-emerald-600">{{ analytics.successSessions }}</p>
        </div>
        <div class="rounded-lg border bg-card p-3 space-y-1">
          <p class="text-xs text-muted-foreground">Failed</p>
          <p class="text-xl font-bold text-red-600">{{ analytics.failedSessions }}</p>
        </div>
        <div class="rounded-lg border bg-card p-3 space-y-1">
          <p class="text-xs text-muted-foreground">Running</p>
          <p class="text-xl font-bold text-blue-600">{{ analytics.runningSessions }}</p>
        </div>
        <div class="rounded-lg border bg-card p-3 space-y-1">
          <p class="text-xs text-muted-foreground">Queued</p>
          <p class="text-xl font-bold text-yellow-600">{{ analytics.queuedSessions }}</p>
        </div>
        <div class="rounded-lg border bg-card p-3 space-y-1">
          <p class="text-xs text-muted-foreground">Success Rate</p>
          <p class="text-xl font-bold">{{ analytics.successRate }}%</p>
        </div>
      </div>

      <!-- Country breakdown -->
      <div v-if="analytics.sessionsByCountry.length" class="rounded-lg border bg-card">
        <div class="px-4 py-3 border-b">
          <h2 class="font-semibold text-sm">Sessions by Country</h2>
        </div>
        <div class="divide-y">
          <div v-for="row in analytics.sessionsByCountry" :key="row.country ?? 'unknown'" class="flex items-center justify-between px-4 py-2 text-sm">
            <span>{{ row.country ?? "Unknown" }} <span v-if="row.countryCode" class="text-muted-foreground">({{ row.countryCode }})</span></span>
            <span class="font-medium">{{ row.count }}</span>
          </div>
        </div>
      </div>

      <!-- Avg Duration -->
      <div v-if="analytics.avgDurationMs" class="rounded-lg border bg-card p-4">
        <p class="text-sm text-muted-foreground">Average Session Duration</p>
        <p class="text-2xl font-bold mt-1">{{ (analytics.avgDurationMs / 1000).toFixed(1) }}s</p>
      </div>
    </div>
  </div>
</template>

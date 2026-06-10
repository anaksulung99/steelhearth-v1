<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { useCampaignStore } from "@/stores/campaign.store";
import { useAnalyticsStore } from "@/stores/analytics.store";
import { useGlobalAlert } from "@/composables/useAlert";
import { useWs } from "@/composables/useWs";
import { campaignsApi } from "@/api/campaigns";
import type { BrowserSession } from "@/api/types";

const router = useRouter();
const route = useRoute();
const campaignStore = useCampaignStore();
const analyticsStore = useAnalyticsStore();
const { confirm, warning } = useGlobalAlert();

const id = route.params.id as string;

onMounted(async () => {
  await Promise.all([
    campaignStore.fetchOne(id),
    analyticsStore.fetchCampaign(id),
  ]);
});

const ws = useWs();
const campaign = computed(() => campaignStore.current);
const analytics = computed(() => analyticsStore.campaignAnalytics[id]);
const canStart = computed(() => {
  if (!campaign.value) return false;
  if (["DRAFT", "PAUSED", "STOPPED", "FAILED"].includes(campaign.value.status)) return true;
  return campaign.value.status === "ACTIVE" && (analytics.value?.totalSessions ?? 0) === 0;
});

// Running sessions for this campaign from WS progress map
const liveSessions = computed(() => {
  const entries: { sessionId: string; progress: number }[] = [];
  for (const [sessionId, v] of campaignStore.sessionProgress.entries()) {
    if (v.campaignId === id) entries.push({ sessionId, progress: v.progress });
  }
  return entries;
});

// ── Session list ──────────────────────────────────────────────────────────────
const sessions = ref<BrowserSession[]>([]);
const sessionsTotal = ref(0);
const sessionsPage = ref(1);
const sessionsLoading = ref(false);
const sessionsFilter = ref<string>("");
const showSessions = ref(false);
const cancellingId = ref<string | null>(null);

async function loadSessions(page = 1) {
  sessionsLoading.value = true;
  try {
    const res = await campaignsApi.sessions(id, {
      page,
      limit: 20,
      ...(sessionsFilter.value ? { status: sessionsFilter.value } : {}),
    });
    sessions.value = res.data;
    sessionsTotal.value = res.meta.total;
    sessionsPage.value = page;
  } finally {
    sessionsLoading.value = false;
  }
}

async function toggleSessions() {
  showSessions.value = !showSessions.value;
  if (showSessions.value && sessions.value.length === 0) {
    await loadSessions();
  }
}

watch(sessionsFilter, () => {
  if (showSessions.value) loadSessions(1);
});

async function cancelSession(sessionId: string) {
  cancellingId.value = sessionId;
  try {
    await campaignsApi.cancelSession(id, sessionId);
    await loadSessions(sessionsPage.value);
  } finally {
    cancellingId.value = null;
  }
}

async function handleStart() {
  const started = await campaignStore.start(id);
  if (!started) return;
  await analyticsStore.fetchCampaign(id);
  if (showSessions.value) await loadSessions(sessionsPage.value);
}

// ── Status colours ────────────────────────────────────────────────────────────
const statusColor: Record<string, string> = {
  DRAFT:     "bg-muted text-muted-foreground",
  ACTIVE:    "bg-emerald-500/15 text-emerald-600",
  PAUSED:    "bg-yellow-500/15 text-yellow-600",
  STOPPED:   "bg-neutral-500/15 text-neutral-600",
  COMPLETED: "bg-blue-500/15 text-blue-600",
  FAILED:    "bg-red-500/15 text-red-600",
};

const sessionStatusColor: Record<string, string> = {
  QUEUED:    "bg-muted text-muted-foreground",
  RUNNING:   "bg-blue-500/15 text-blue-600",
  SUCCESS:   "bg-emerald-500/15 text-emerald-600",
  FAILED:    "bg-red-500/15 text-red-600",
  CANCELLED: "bg-neutral-500/15 text-neutral-600",
};

async function handleDelete() {
  const ok = await confirm(
    `Delete "${campaign.value?.name}"?`,
    "This action cannot be undone.",
    {
      confirmLabel: "Delete",
      confirmClass: "bg-destructive text-destructive-foreground",
    }
  );
  if (!ok) return;
  const success = await campaignStore.remove(id);
  if (success) router.push("/app/campaigns");
}

async function handleEdit() {
  if (campaign.value?.status === "ACTIVE") {
    await warning(
      "Campaign is still running",
      "Pause or stop this campaign before editing its configuration."
    );
    return;
  }
  router.push(`/app/campaigns/${id}/edit`);
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button class="p-1 rounded hover:bg-muted" @click="router.back()">
          <Icon icon="material-symbols:arrow-back" class="size-5" />
        </button>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold">
              {{ campaign?.name ?? "Campaign" }}
            </h1>
            <span
              v-if="campaign"
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="statusColor[campaign.status]"
            >
              {{ campaign.status }}
            </span>
          </div>
          <p class="text-sm text-muted-foreground mt-0.5">
            {{ campaign?.targetUrl }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="canStart"
          class="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          @click="handleStart"
        >
          <Icon icon="material-symbols:play-arrow" class="size-4" />
          Start
        </button>
        <button
          v-if="campaign?.status === 'ACTIVE'"
          class="inline-flex items-center gap-1.5 rounded-md bg-yellow-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-yellow-700"
          @click="campaignStore.pause(id)"
        >
          <Icon icon="material-symbols:pause" class="size-4" />
          Pause
        </button>
        <button
          v-if="campaign?.status === 'ACTIVE' || campaign?.status === 'PAUSED'"
          class="inline-flex items-center gap-1.5 rounded-md bg-neutral-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
          @click="campaignStore.stop(id)"
        >
          <Icon icon="material-symbols:stop" class="size-4" />
          Stop
        </button>
        <button
          class="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          @click="handleEdit"
        >
          <Icon icon="material-symbols:edit-outline" class="size-4" />
          Edit
        </button>
        <button
          class="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
          @click="handleDelete"
        >
          <Icon icon="material-symbols:delete-outline" class="size-4" />
          Delete
        </button>
      </div>
    </div>

    <div
      v-if="campaignStore.loading"
      class="p-12 text-center text-sm text-muted-foreground"
    >
      Loading...
    </div>

    <div v-else-if="campaign" class="space-y-4">
      <!-- Analytics -->
      <div v-if="analytics" class="grid grid-cols-3 gap-4 lg:grid-cols-6">
        <div class="rounded-lg border bg-card p-3 space-y-1">
          <p class="text-xs text-muted-foreground">Total</p>
          <p class="text-xl font-bold">{{ analytics.totalSessions }}</p>
        </div>
        <div class="rounded-lg border bg-card p-3 space-y-1">
          <p class="text-xs text-muted-foreground">Success</p>
          <p class="text-xl font-bold text-emerald-600">
            {{ analytics.successSessions }}
          </p>
        </div>
        <div class="rounded-lg border bg-card p-3 space-y-1">
          <p class="text-xs text-muted-foreground">Failed</p>
          <p class="text-xl font-bold text-red-600">
            {{ analytics.failedSessions }}
          </p>
        </div>
        <div class="rounded-lg border bg-card p-3 space-y-1">
          <p class="text-xs text-muted-foreground">Running</p>
          <p class="text-xl font-bold text-blue-600">
            {{ analytics.runningSessions }}
          </p>
        </div>
        <div class="rounded-lg border bg-card p-3 space-y-1">
          <p class="text-xs text-muted-foreground">Queued</p>
          <p class="text-xl font-bold text-yellow-600">
            {{ analytics.queuedSessions }}
          </p>
        </div>
        <div class="rounded-lg border bg-card p-3 space-y-1">
          <p class="text-xs text-muted-foreground">Success Rate</p>
          <p class="text-xl font-bold">{{ analytics.successRate }}%</p>
        </div>
      </div>

      <!-- Live Sessions (visible only when ACTIVE and there are running sessions) -->
      <div
        v-if="campaign.status === 'ACTIVE' && liveSessions.length"
        class="rounded-lg border bg-card p-4 space-y-3"
      >
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-sm flex items-center gap-2">
            <span class="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sessions
            <span class="text-muted-foreground font-normal"
              >({{ liveSessions.length }} running)</span
            >
          </h2>
          <span class="text-xs text-muted-foreground flex items-center gap-1">
            <span
              class="size-1.5 rounded-full"
              :class="
                ws.connected.value ? 'bg-emerald-500' : 'bg-muted-foreground/40'
              "
            />
            {{ ws.connected.value ? "Real-time" : "Offline" }}
          </span>
        </div>
        <div class="space-y-2">
          <div v-for="s in liveSessions" :key="s.sessionId" class="space-y-1">
            <div class="flex justify-between text-xs text-muted-foreground">
              <span class="font-mono truncate max-w-50">{{ s.sessionId }}</span>
              <span>{{ s.progress }}%</span>
            </div>
            <div class="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                class="h-full rounded-full bg-emerald-500 transition-all duration-500"
                :style="{ width: `${s.progress}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Details -->
      <div class="grid grid-cols-2 gap-4">
        <div class="rounded-lg border bg-card p-4 space-y-3">
          <h2 class="font-semibold text-sm border-b pb-2">Configuration</h2>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Browser Engine</dt>
              <dd class="font-medium">{{ campaign.browserEngine }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Headless</dt>
              <dd class="font-medium">
                {{ campaign.headless ? "Yes" : "No" }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Total Sessions</dt>
              <dd class="font-medium">{{ campaign.totalSessionsTarget }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Daily Limit</dt>
              <dd class="font-medium">{{ campaign.dailyLimit }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Sessions/Hour</dt>
              <dd class="font-medium">{{ campaign.sessionsPerHour }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Geo Mode</dt>
              <dd class="font-medium">{{ campaign.geoMode }}</dd>
            </div>
          </dl>
        </div>
        <div class="rounded-lg border bg-card p-4 space-y-3">
          <h2 class="font-semibold text-sm border-b pb-2">Linked Profiles</h2>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Behaviour Profile</dt>
              <dd class="font-medium">
                {{ campaign.behaviourProfileId ?? "None" }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Fingerprint Profile</dt>
              <dd class="font-medium">
                {{ campaign.fingerprintProfileId ?? "None" }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Created</dt>
              <dd class="font-medium">
                {{ new Date(campaign.createdAt).toLocaleDateString() }}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Description -->
      <div v-if="campaign.description" class="rounded-lg border bg-card p-4">
        <h2 class="font-semibold text-sm mb-2">Description</h2>
        <p class="text-sm text-muted-foreground">{{ campaign.description }}</p>
      </div>

      <!-- Sessions Panel -->
      <div class="rounded-lg border bg-card overflow-hidden">
        <!-- Header / toggle -->
        <button
          class="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
          @click="toggleSessions"
        >
          <span class="font-semibold text-sm flex items-center gap-2">
            <Icon icon="material-symbols:web-stories-outline" class="size-4" />
            Sessions
            <span class="text-xs font-normal text-muted-foreground">({{ sessionsTotal }})</span>
          </span>
          <Icon
            icon="material-symbols:expand-more"
            class="size-4 transition-transform"
            :class="showSessions ? 'rotate-180' : ''"
          />
        </button>

        <div v-if="showSessions">
          <!-- Filter bar -->
          <div class="flex items-center gap-2 px-4 py-2 border-t bg-muted/20">
            <span class="text-xs text-muted-foreground">Filter:</span>
            <div class="flex gap-1">
              <button
                v-for="s in ['', 'QUEUED', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED']"
                :key="s"
                class="rounded-full px-2.5 py-0.5 text-xs border transition-colors"
                :class="sessionsFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'"
                @click="sessionsFilter = s"
              >
                {{ s || 'All' }}
              </button>
            </div>
            <button
              class="ml-auto p-1 rounded hover:bg-muted"
              title="Refresh"
              @click="loadSessions(sessionsPage)"
            >
              <Icon icon="material-symbols:refresh" class="size-4" :class="sessionsLoading ? 'animate-spin' : ''" />
            </button>
          </div>

          <!-- Table -->
          <div v-if="sessionsLoading && !sessions.length" class="p-6 text-center text-sm text-muted-foreground">
            Loading...
          </div>
          <div v-else-if="!sessions.length" class="p-6 text-center text-sm text-muted-foreground">
            No sessions yet.
          </div>
          <table v-else class="w-full text-sm">
            <thead class="border-t border-b bg-muted/40">
              <tr>
                <th class="px-4 py-2 text-left font-medium text-muted-foreground text-xs">Session ID</th>
                <th class="px-4 py-2 text-left font-medium text-muted-foreground text-xs">Status</th>
                <th class="px-4 py-2 text-left font-medium text-muted-foreground text-xs">Duration</th>
                <th class="px-4 py-2 text-left font-medium text-muted-foreground text-xs">Proxy</th>
                <th class="px-4 py-2 text-left font-medium text-muted-foreground text-xs">Started</th>
                <th class="px-4 py-2 text-right font-medium text-muted-foreground text-xs">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="s in sessions" :key="s.id" class="hover:bg-muted/20">
                <td class="px-4 py-2 font-mono text-xs text-muted-foreground">{{ s.id.slice(-8) }}</td>
                <td class="px-4 py-2">
                  <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="sessionStatusColor[s.status]">
                    {{ s.status }}
                  </span>
                </td>
                <td class="px-4 py-2 text-xs text-muted-foreground">
                  {{ s.durationMs ? `${(s.durationMs / 1000).toFixed(1)}s` : '—' }}
                </td>
                <td class="px-4 py-2 text-xs text-muted-foreground">
                  {{ s.proxy ? `${s.proxy.host}:${s.proxy.port}` : '—' }}
                </td>
                <td class="px-4 py-2 text-xs text-muted-foreground">
                  {{ s.startedAt ? new Date(s.startedAt).toLocaleTimeString() : '—' }}
                </td>
                <td class="px-4 py-2 text-right">
                  <button
                    v-if="s.status === 'QUEUED' || s.status === 'RUNNING'"
                    :disabled="cancellingId === s.id"
                    class="p-1 rounded text-xs hover:bg-muted disabled:opacity-40"
                    title="Cancel session"
                    @click="cancelSession(s.id)"
                  >
                    <Icon
                      :icon="cancellingId === s.id ? 'material-symbols:sync' : 'material-symbols:cancel-outline'"
                      class="size-4"
                      :class="cancellingId === s.id ? 'animate-spin' : 'text-destructive'"
                    />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <div v-if="sessionsTotal > 20" class="flex items-center justify-between px-4 py-2 border-t bg-muted/20">
            <span class="text-xs text-muted-foreground">{{ sessionsTotal }} total</span>
            <div class="flex gap-1">
              <button
                :disabled="sessionsPage <= 1"
                class="rounded border px-2 py-1 text-xs hover:bg-muted disabled:opacity-40"
                @click="loadSessions(sessionsPage - 1)"
              >Prev</button>
              <span class="px-2 py-1 text-xs">{{ sessionsPage }}</span>
              <button
                :disabled="sessionsPage * 20 >= sessionsTotal"
                class="rounded border px-2 py-1 text-xs hover:bg-muted disabled:opacity-40"
                @click="loadSessions(sessionsPage + 1)"
              >Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

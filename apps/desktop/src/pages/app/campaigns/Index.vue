<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { useCampaignStore } from "@/stores/campaign.store";
import { useGlobalAlert } from "@/composables/useAlert";

const router = useRouter();
const campaignStore = useCampaignStore();
const { confirm, warning } = useGlobalAlert();

const search = ref("");
const statusFilter = ref("");

onMounted(() => campaignStore.fetchAll());

watch([search, statusFilter], () => {
  campaignStore.fetchAll({
    search: search.value || undefined,
    status: statusFilter.value || undefined,
  });
});

async function handleDelete(id: string, name: string) {
  const ok = await confirm(
    `Delete "${name}"?`,
    "This action cannot be undone.",
    {
      confirmLabel: "Delete",
      confirmClass: "bg-destructive text-destructive-foreground",
    }
  );
  if (!ok) return;
  await campaignStore.remove(id);
}

async function handleStart(id: string) {
  await campaignStore.start(id);
}
async function handlePause(id: string) {
  await campaignStore.pause(id);
}
async function handleStop(id: string) {
  await campaignStore.stop(id);
}

async function handleEdit(c: { id: string; status: string }) {
  if (c.status === "ACTIVE") {
    await warning(
      "Campaign is still running",
      "Pause or stop this campaign before editing its configuration."
    );
    return;
  }
  router.push(`/app/campaigns/${c.id}/edit`);
}

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
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Campaigns</h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          {{ campaignStore.total }} total campaigns
        </p>
      </div>
      <router-link to="/app/campaigns/create">
        <button
          class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Icon icon="material-symbols:add" class="size-4" />
          New Campaign
        </button>
      </router-link>
    </div>

    <!-- Filters -->
    <div class="flex gap-3">
      <input
        v-model="search"
        type="text"
        placeholder="Search campaigns..."
        class="w-64 rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <select
        v-model="statusFilter"
        class="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">All Status</option>
        <option value="DRAFT">Draft</option>
        <option value="ACTIVE">Active</option>
        <option value="PAUSED">Paused</option>
        <option value="STOPPED">Stopped</option>
        <option value="COMPLETED">Completed</option>
        <option value="FAILED">Failed</option>
      </select>
    </div>

    <!-- Table -->
    <div class="rounded-lg border bg-card overflow-hidden">
      <div
        v-if="campaignStore.loading"
        class="p-12 text-center text-sm text-muted-foreground"
      >
        Loading...
      </div>
      <div
        v-else-if="!campaignStore.items.length"
        class="p-12 text-center space-y-2"
      >
        <Icon
          icon="material-symbols:campaign"
          class="size-10 text-muted-foreground mx-auto"
        />
        <p class="text-sm text-muted-foreground">No campaigns found</p>
        <router-link
          to="/app/campaigns/create"
          class="text-sm text-primary hover:underline"
          >Create your first campaign</router-link
        >
      </div>
      <table v-else class="w-full text-sm">
        <thead class="border-b bg-muted/50">
          <tr>
            <th class="px-4 py-2 text-left font-medium text-muted-foreground">
              Name
            </th>
            <th class="px-4 py-2 text-left font-medium text-muted-foreground">
              Target URL
            </th>
            <th class="px-4 py-2 text-left font-medium text-muted-foreground">
              Status
            </th>
            <th class="px-4 py-2 text-left font-medium text-muted-foreground">
              Sessions
            </th>
            <th class="px-4 py-2 text-left font-medium text-muted-foreground">
              Engine
            </th>
            <th class="px-4 py-2 text-right font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr
            v-for="c in campaignStore.items"
            :key="c.id"
            class="hover:bg-muted/30 transition-colors"
          >
            <td class="px-4 py-2.5">
              <router-link
                :to="`/app/campaigns/${c.id}/detail`"
                class="font-medium hover:text-primary"
              >
                {{ c.name }}
              </router-link>
            </td>
            <td class="px-4 py-2.5 max-w-xs">
              <span class="truncate block text-muted-foreground text-xs">{{
                c.targetUrl
              }}</span>
            </td>
            <td class="px-4 py-2.5">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="statusColor[c.status]"
              >
                {{ c.status }}
              </span>
            </td>
            <td class="px-4 py-2.5 text-muted-foreground">
              {{ c.totalSessionsTarget }}
            </td>
            <td class="px-4 py-2.5 text-muted-foreground text-xs">
              {{ c.browserEngine }}
            </td>
            <td class="px-4 py-2.5">
              <div class="flex items-center justify-end gap-1">
                <button
                  v-if="
                    c.status === 'DRAFT' ||
                    c.status === 'PAUSED' ||
                    c.status === 'STOPPED' ||
                    c.status === 'FAILED'
                  "
                  title="Start"
                  class="p-1 rounded hover:bg-emerald-500/10 text-emerald-600"
                  @click="handleStart(c.id)"
                >
                  <Icon icon="material-symbols:play-arrow" class="size-4" />
                </button>
                <button
                  v-if="c.status === 'ACTIVE'"
                  title="Pause"
                  class="p-1 rounded hover:bg-yellow-500/10 text-yellow-600"
                  @click="handlePause(c.id)"
                >
                  <Icon icon="material-symbols:pause" class="size-4" />
                </button>
                <button
                  v-if="c.status === 'ACTIVE' || c.status === 'PAUSED'"
                  title="Stop"
                  class="p-1 rounded hover:bg-red-500/10 text-red-600"
                  @click="handleStop(c.id)"
                >
                  <Icon icon="material-symbols:stop" class="size-4" />
                </button>
                <router-link
                  :to="`/app/campaigns/${c.id}/detail`"
                  title="Edit"
                  class="p-1 rounded hover:bg-blue-500/10 text-blue-600"
                >
                  <Icon icon="ic:outline-remove-red-eye" class="size-4" />
                </router-link>
                <button
                  title="Edit"
                  class="p-1 rounded hover:bg-muted text-muted-foreground"
                  @click="handleEdit(c)"
                >
                  <Icon icon="material-symbols:edit-outline" class="size-4" />
                </button>
                <button
                  title="Delete"
                  class="p-1 rounded hover:bg-red-500/10 text-destructive"
                  @click="handleDelete(c.id, c.name)"
                >
                  <Icon icon="material-symbols:delete-outline" class="size-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

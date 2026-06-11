<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { logsApi } from "@/api";
import type { SystemLog } from "@/api";
import { toast } from "vue3-toastify";

const appStore = useAppStore();
const { warning } = useGlobalAlert();

const logs = ref<SystemLog[]>([]);
const total = ref(0);
const loading = ref(true);
const level = ref("");
const page = ref(1);
const limit = 50;

onMounted(async () => {
  await loadLogs();
});
watch([level, page], () => loadLogs());

async function loadLogs() {
  loading.value = true;
  try {
    const res = await logsApi.list({
      level: level.value || undefined,
      page: page.value,
      limit,
    });
    logs.value = res.data;
    total.value = res.meta.total;
  } finally {
    loading.value = false;
  }
}

const levelColor: Record<string, string> = {
  DEBUG: "text-muted-foreground",
  INFO: "text-blue-600",
  WARN: "text-yellow-600",
  ERROR: "text-red-600",
};

async function handleResetAllLogs() {
  if (!appStore.licenseSession?.user) {
    toast.error("User not found");
    return;
  }

  const ok = await warning(`Reset All Logs?`, `This action cannot be undone.`);
  if (!ok) return;

  try {
    await logsApi.resetAllLogs(appStore.licenseSession?.user.id);
    toast.success("All logs successfull deleted");
    await loadLogs();
  } catch (error) {
    const errMsg =
      error instanceof Error
        ? error.message
        : "Failed to resetl all logs! Unknown errror";
    toast.error(errMsg);
  }
}
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Audit Logs</h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          {{ total }} log entries
        </p>
      </div>
      <div class="flex items-center gap-2">
        <select
          v-model="level"
          class="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Levels</option>
          <option value="DEBUG">Debug</option>
          <option value="INFO">Info</option>
          <option value="WARN">Warning</option>
          <option value="ERROR">Error</option>
        </select>
        <button
          class="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90"
          @click="handleResetAllLogs"
        >
          <Icon
            icon="material-symbols:reset-settings-outline-rounded"
            class="size-4"
          />
          Reset Logs
        </button>
      </div>
    </div>

    <div class="rounded-lg border bg-card overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-sm text-muted-foreground">
        Loading...
      </div>
      <div
        v-else-if="!logs.length"
        class="p-8 text-center text-sm text-muted-foreground"
      >
        No logs found
      </div>
      <div v-else class="divide-y font-mono text-xs">
        <div
          v-for="log in logs"
          :key="log.id"
          class="flex gap-3 px-4 py-2 hover:bg-muted/30"
        >
          <span class="text-muted-foreground shrink-0 w-36">{{
            new Date(log.createdAt).toLocaleString()
          }}</span>
          <span
            class="font-semibold shrink-0 w-12"
            :class="levelColor[log.level]"
            >{{ log.level }}</span
          >
          <span class="text-muted-foreground shrink-0 w-24 truncate">{{
            log.category
          }}</span>
          <span class="text-foreground flex-1">{{ log.message }}</span>
        </div>
      </div>
    </div>

    <div v-if="total > limit" class="flex justify-center gap-2">
      <button
        :disabled="page === 1"
        class="rounded border px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
        @click="page--"
      >
        Prev
      </button>
      <span class="px-3 py-1 text-sm">{{ page }}</span>
      <button
        :disabled="page * limit >= total"
        class="rounded border px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
        @click="page++"
      >
        Next
      </button>
    </div>
  </div>
</template>

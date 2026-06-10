<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { workersApi } from "@/api";
import type { WorkerNode } from "@/api";

const workers = ref<WorkerNode[]>([]);
const loading = ref(true);
const total = ref(0);

onMounted(async () => {
  try {
    const res = await workersApi.list({ limit: 50 });
    workers.value = res.data;
    total.value = res.meta.total;
  } finally {
    loading.value = false;
  }
});

const statusColor: Record<string, string> = {
  ONLINE: "bg-emerald-500/15 text-emerald-600",
  BUSY: "bg-blue-500/15 text-blue-600",
  IDLE: "bg-yellow-500/15 text-yellow-600",
  OFFLINE: "bg-neutral-500/15 text-neutral-600",
  ERROR: "bg-red-500/15 text-red-600",
};
</script>

<template>
  <div class="p-6 space-y-4">
    <div>
      <h1 class="text-2xl font-bold">Worker Nodes</h1>
      <p class="text-sm text-muted-foreground mt-0.5">
        {{ total }} registered workers
      </p>
    </div>

    <div v-if="loading" class="p-12 text-center text-sm text-muted-foreground">
      Loading...
    </div>

    <div
      v-else-if="!workers.length"
      class="rounded-lg border bg-card p-12 text-center space-y-2"
    >
      <Icon
        icon="devicon-plain:cloudflareworkers"
        class="size-10 text-muted-foreground mx-auto"
      />
      <p class="text-sm text-muted-foreground">No worker nodes registered</p>
      <p class="text-xs text-muted-foreground">
        Start the worker process to see nodes here
      </p>
    </div>

    <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="w in workers"
        :key="w.id"
        class="rounded-lg border bg-card p-4 space-y-3"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="font-medium text-sm font-mono">{{ w.workerId }}</p>
            <p v-if="w.hostname" class="text-xs text-muted-foreground">
              {{ w.hostname }}
            </p>
          </div>
          <span
            class="rounded-full px-2 py-0.5 text-xs font-medium"
            :class="statusColor[w.status]"
          >
            {{ w.status }}
          </span>
        </div>
        <dl class="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
          <div class="flex justify-between col-span-2">
            <dt>Active Jobs</dt>
            <dd class="text-foreground font-medium">
              {{ w.activeJobs }} / {{ w.maxConcurrency }}
            </dd>
          </div>
          <div class="flex justify-between col-span-2">
            <dt>Last Heartbeat</dt>
            <dd class="text-foreground">
              {{
                w.lastHeartbeatAt
                  ? new Date(w.lastHeartbeatAt).toLocaleTimeString()
                  : "—"
              }}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>

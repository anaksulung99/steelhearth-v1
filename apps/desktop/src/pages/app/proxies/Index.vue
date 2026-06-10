<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { useProxyStore } from "@/stores/proxy.store";
import { useGlobalAlert } from "@/composables/useAlert";
import { proxiesApi } from "@/api/proxies";

const proxyStore = useProxyStore();
const { confirm } = useGlobalAlert();

const selectedGroupId = ref("");
const showImportDialog = ref(false);
const showNewGroupDialog = ref(false);
const importLines = ref("");
const newGroupName = ref("");
const importing = ref(false);
const creatingGroup = ref(false);
const checkingId = ref<string | null>(null);
const checkingGroup = ref(false);

onMounted(async () => {
  await proxyStore.fetchGroups();
  if (proxyStore.groups.length) {
    selectedGroupId.value = proxyStore.groups[0].id;
    await proxyStore.fetchProxies({ proxyGroupId: selectedGroupId.value });
  }
});

watch(selectedGroupId, (v) => {
  if (v) proxyStore.fetchProxies({ proxyGroupId: v });
});

async function createGroup() {
  if (!newGroupName.value.trim()) return;
  creatingGroup.value = true;
  const g = await proxyStore.createGroup({ name: newGroupName.value.trim() });
  creatingGroup.value = false;
  if (g) {
    newGroupName.value = "";
    showNewGroupDialog.value = false;
    selectedGroupId.value = g.id;
  }
}

async function deleteGroup(id: string, name: string) {
  const ok = await confirm(
    `Delete group "${name}"?`,
    "All proxies in this group will be removed.",
    {
      confirmLabel: "Delete",
      confirmClass: "bg-destructive text-destructive-foreground",
    }
  );
  if (!ok) return;
  const success = await proxyStore.deleteGroup(id);
  if (success && selectedGroupId.value === id) {
    selectedGroupId.value = proxyStore.groups[0]?.id ?? "";
  }
}

async function importProxies() {
  if (!selectedGroupId.value || !importLines.value.trim()) return;
  importing.value = true;
  const result = await proxyStore.bulkImport({
    proxyGroupId: selectedGroupId.value,
    lines: importLines.value,
  });
  importing.value = false;
  if (result && (result.imported > 0 || result.failed === 0)) {
    importLines.value = "";
    showImportDialog.value = false;
  }
}

async function deleteProxy(id: string) {
  await proxyStore.deleteProxy(id);
}

async function checkProxy(id: string) {
  if (checkingId.value) return;
  checkingId.value = id;
  try {
    await proxiesApi.check(id);
    await proxyStore.fetchProxies({ proxyGroupId: selectedGroupId.value });
  } finally {
    checkingId.value = null;
  }
}

async function checkAllProxies() {
  if (!selectedGroupId.value || checkingGroup.value) return;
  checkingGroup.value = true;
  try {
    await proxiesApi.checkGroup(selectedGroupId.value, { concurrency: 10 });
    await proxyStore.fetchProxies({ proxyGroupId: selectedGroupId.value });
  } finally {
    checkingGroup.value = false;
  }
}

const statusColor: Record<string, string> = {
  UNCHECKED: "bg-muted text-muted-foreground",
  ACTIVE: "bg-emerald-500/15 text-emerald-600",
  DEAD: "bg-red-500/15 text-red-600",
  SLOW: "bg-yellow-500/15 text-yellow-600",
  BLOCKED: "bg-orange-500/15 text-orange-600",
};
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Proxies</h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          Manage your proxy pool
        </p>
      </div>
      <div class="flex gap-2">
        <button
          class="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          @click="showNewGroupDialog = true"
        >
          <Icon
            icon="material-symbols:create-new-folder-outline"
            class="size-4"
          />
          New Group
        </button>
        <button
          :disabled="!selectedGroupId"
          class="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          @click="showImportDialog = true"
        >
          <Icon icon="material-symbols:upload" class="size-4" />
          Import Proxies
        </button>
      </div>
    </div>

    <!-- Groups -->
    <div v-if="proxyStore.groups.length" class="flex gap-2 flex-wrap">
      <button
        v-for="g in proxyStore.groups"
        :key="g.id"
        class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm border transition-colors"
        :class="
          selectedGroupId === g.id
            ? 'bg-primary text-primary-foreground border-primary'
            : 'hover:bg-muted'
        "
        @click="selectedGroupId = g.id"
      >
        {{ g.name }}
        <span class="text-xs opacity-70">({{ g._count?.proxies ?? 0 }})</span>
        <span
          class="ml-1 rounded hover:bg-black/20 p-0.5"
          title="Delete group"
          @click.stop="deleteGroup(g.id, g.name)"
        >
          <Icon icon="material-symbols:close" class="size-3" />
        </span>
      </button>
    </div>
    <div v-else class="text-sm text-muted-foreground">
      No proxy groups yet. Create one to get started.
    </div>

    <!-- Proxy Table -->
    <div class="rounded-lg border bg-card overflow-hidden">
      <div
        class="flex items-center justify-between px-4 py-2 border-b bg-muted/30"
      >
        <span class="text-xs text-muted-foreground"
          >{{ proxyStore.total }} proxies</span
        >
        <button
          v-if="proxyStore.proxies.length"
          :disabled="checkingGroup || !selectedGroupId"
          class="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs hover:bg-muted disabled:opacity-50"
          @click="checkAllProxies"
        >
          <Icon
            icon="material-symbols:wifi-tethering"
            class="size-3.5"
            :class="checkingGroup ? 'animate-pulse' : ''"
          />
          {{ checkingGroup ? "Checking..." : "Check All" }}
        </button>
      </div>
      <div
        v-if="proxyStore.loading"
        class="p-8 text-center text-sm text-muted-foreground"
      >
        Loading...
      </div>
      <div
        v-else-if="!proxyStore.proxies.length"
        class="p-8 text-center text-sm text-muted-foreground"
      >
        No proxies in this group.
      </div>
      <table v-else class="w-full text-sm">
        <thead class="border-b bg-muted/50">
          <tr>
            <th class="px-4 py-2 text-left font-medium text-muted-foreground">
              Host:Port
            </th>
            <th class="px-4 py-2 text-left font-medium text-muted-foreground">
              Protocol
            </th>
            <th class="px-4 py-2 text-left font-medium text-muted-foreground">
              Status
            </th>
            <th class="px-4 py-2 text-left font-medium text-muted-foreground">
              Country
            </th>
            <th class="px-4 py-2 text-left font-medium text-muted-foreground">
              Latency
            </th>
            <th class="px-4 py-2 text-right font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr
            v-for="p in proxyStore.proxies"
            :key="p.id"
            class="hover:bg-muted/30"
          >
            <td class="px-4 py-2 font-mono text-xs">
              {{ p.host }}:{{ p.port }}
            </td>
            <td class="px-4 py-2 text-xs uppercase text-muted-foreground">
              {{ p.protocol }}
            </td>
            <td class="px-4 py-2">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="statusColor[p.status]"
              >
                {{ p.status }}
              </span>
            </td>
            <td class="px-4 py-2 text-xs text-muted-foreground">
              {{ p.country ?? "—" }}
            </td>
            <td class="px-4 py-2 text-xs text-muted-foreground">
              {{ p.latency ? `${p.latency}ms` : "—" }}
            </td>
            <td class="px-4 py-2 text-right">
              <div class="flex items-center justify-end gap-1">
                <button
                  :disabled="checkingId === p.id || checkingGroup"
                  class="p-1 rounded hover:bg-muted disabled:opacity-40"
                  title="Check proxy"
                  @click="checkProxy(p.id)"
                >
                  <Icon
                    :icon="
                      checkingId === p.id
                        ? 'material-symbols:sync'
                        : 'material-symbols:wifi-tethering'
                    "
                    class="size-4"
                    :class="checkingId === p.id ? 'animate-spin' : ''"
                  />
                </button>
                <button
                  class="p-1 rounded hover:bg-red-500/10 text-destructive"
                  @click="deleteProxy(p.id)"
                >
                  <Icon icon="material-symbols:delete-outline" class="size-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- New Group Dialog -->
    <div
      v-if="showNewGroupDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="rounded-lg border bg-card p-6 w-96 space-y-4 shadow-xl">
        <h2 class="font-semibold">New Proxy Group</h2>
        <input
          v-model="newGroupName"
          type="text"
          placeholder="Group name"
          class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div class="flex justify-end gap-2">
          <button
            class="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            @click="showNewGroupDialog = false"
          >
            Cancel
          </button>
          <button
            :disabled="creatingGroup || !newGroupName.trim()"
            class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            @click="createGroup"
          >
            {{ creatingGroup ? "Creating..." : "Create" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Import Dialog -->
    <div
      v-if="showImportDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="rounded-lg border bg-card p-6 w-130 space-y-4 shadow-xl">
        <h2 class="font-semibold">Import Proxies</h2>
        <p class="text-xs text-muted-foreground">
          One proxy per line. Format:
          <code class="bg-muted px-1 rounded">host:port</code> or
          <code class="bg-muted px-1 rounded">host:port:user:pass</code>
        </p>
        <textarea
          v-model="importLines"
          rows="10"
          placeholder="192.168.1.1:8080&#10;192.168.1.2:8080:user:pass"
          class="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div class="flex justify-end gap-2">
          <button
            class="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            @click="showImportDialog = false"
          >
            Cancel
          </button>
          <button
            :disabled="importing || !importLines.trim()"
            class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            @click="importProxies"
          >
            {{ importing ? "Importing..." : "Import" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

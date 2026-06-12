<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { useAppStore } from "@/stores/app.store";

const appStore = useAppStore();
const apiUrl = ref(appStore.apiUrl);
const apiToken = ref(appStore.apiToken);
const saving = ref(false);

// ─── Sidecar / system status ──────────────────────────────────────────────────

const isElectron = !!window.electronAPI?.isElectron;
const isPackaged = isElectron; // in dev mode sidecars don't run
const platform = navigator.platform;

interface SidecarStatus {
  redis: boolean;
  api: boolean;
  worker: boolean;
}

const sidecar = ref<SidecarStatus | null>(null);
const sidecarLoading = ref(false);

async function refreshSidecarStatus() {
  if (!window.electronAPI?.getSidecarStatus) return;
  sidecarLoading.value = true;
  try {
    sidecar.value = await window.electronAPI.getSidecarStatus();
  } finally {
    sidecarLoading.value = false;
  }
}

// ─── API health ping ──────────────────────────────────────────────────────────

const apiHealth = ref<"checking" | "ok" | "error" | "idle">("idle");

async function pingApi() {
  apiHealth.value = "checking";
  try {
    const res = await fetch(`${apiUrl.value}/health`, {
      signal: AbortSignal.timeout(4000),
    });
    apiHealth.value = res.ok ? "ok" : "error";
  } catch {
    apiHealth.value = "error";
  }
}

onMounted(() => {
  refreshSidecarStatus();
});

// ─── Settings save ────────────────────────────────────────────────────────────

async function save() {
  saving.value = true;
  await appStore.saveSettings(apiUrl.value, apiToken.value);
  saving.value = false;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const appVersion = import.meta.env.VITE_APP_VERSION ?? "0.0.1";

function statusColor(active: boolean | undefined) {
  if (active === undefined) return "bg-muted-foreground/30";
  return active ? "bg-emerald-500" : "bg-red-500";
}
function statusLabel(active: boolean | undefined) {
  if (active === undefined) return "Unknown";
  return active ? "Online" : "Offline";
}
function statusTextColor(active: boolean | undefined) {
  if (active === undefined) return "text-muted-foreground";
  return active
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-600 dark:text-red-400";
}
</script>

<template>
  <div class="p-6 w-full space-y-8">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold">Settings & About</h1>
      <p class="text-sm text-muted-foreground mt-0.5">
        App configuration and system status
      </p>
    </div>

    <!-- System Status (Electron prod only) -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2
          class="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
        >
          System Status
        </h2>
        <button
          class="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs hover:bg-muted disabled:opacity-50"
          :disabled="sidecarLoading"
          @click="refreshSidecarStatus"
        >
          <Icon
            icon="radix-icons:reload"
            class="size-3"
            :class="{ 'animate-spin': sidecarLoading }"
          />
          Refresh
        </button>
      </div>

      <div class="rounded-lg border bg-card divide-y">
        <!-- Redis -->
        <div class="flex items-center justify-between px-4 py-3">
          <div class="flex items-center gap-3">
            <div
              class="flex size-8 items-center justify-center rounded-md bg-muted"
            >
              <Icon
                icon="radix-icons:database"
                class="size-4 text-muted-foreground"
              />
            </div>
            <div>
              <p class="text-sm font-medium">Redis Queue</p>
              <p class="text-xs text-muted-foreground">
                Local embedded · port 16379
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="size-2 rounded-full"
              :class="[
                statusColor(sidecar?.redis),
                sidecar?.redis ? 'animate-pulse' : '',
              ]"
            />
            <span
              class="text-xs font-medium"
              :class="statusTextColor(sidecar?.redis)"
            >
              {{ sidecarLoading ? "Checking..." : statusLabel(sidecar?.redis) }}
            </span>
          </div>
        </div>

        <!-- API -->
        <div class="flex items-center justify-between px-4 py-3">
          <div class="flex items-center gap-3">
            <div
              class="flex size-8 items-center justify-center rounded-md bg-muted"
            >
              <Icon
                icon="radix-icons:lightning-bolt"
                class="size-4 text-muted-foreground"
              />
            </div>
            <div>
              <p class="text-sm font-medium">API Server</p>
              <p class="text-xs text-muted-foreground">Fastify · port 3741</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="size-2 rounded-full"
              :class="[
                statusColor(sidecar?.api),
                sidecar?.api ? 'animate-pulse' : '',
              ]"
            />
            <span
              class="text-xs font-medium"
              :class="statusTextColor(sidecar?.api)"
            >
              {{ sidecarLoading ? "Checking..." : statusLabel(sidecar?.api) }}
            </span>
          </div>
        </div>

        <!-- Worker -->
        <div class="flex items-center justify-between px-4 py-3">
          <div class="flex items-center gap-3">
            <div
              class="flex size-8 items-center justify-center rounded-md bg-muted"
            >
              <Icon
                icon="radix-icons:gear"
                class="size-4 text-muted-foreground"
              />
            </div>
            <div>
              <p class="text-sm font-medium">Session Worker</p>
              <p class="text-xs text-muted-foreground">
                BullMQ · browser automation
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="size-2 rounded-full"
              :class="[
                statusColor(sidecar?.worker),
                sidecar?.worker ? 'animate-pulse' : '',
              ]"
            />
            <span
              class="text-xs font-medium"
              :class="statusTextColor(sidecar?.worker)"
            >
              {{
                sidecarLoading ? "Checking..." : statusLabel(sidecar?.worker)
              }}
            </span>
          </div>
        </div>

        <!-- API Health Ping -->
        <div class="flex items-center justify-between px-4 py-3">
          <div class="flex items-center gap-3">
            <div
              class="flex size-8 items-center justify-center rounded-md bg-muted"
            >
              <Icon
                icon="radix-icons:activity-log"
                class="size-4 text-muted-foreground"
              />
            </div>
            <div>
              <p class="text-sm font-medium">API Health</p>
              <p class="text-xs text-muted-foreground">
                Live HTTP ping to /health
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <template v-if="apiHealth === 'idle'">
              <button
                class="rounded-md border px-2.5 py-1 text-xs hover:bg-muted"
                @click="pingApi"
              >
                Ping
              </button>
            </template>
            <template v-else>
              <span
                class="size-2 rounded-full"
                :class="{
                  'bg-muted-foreground/30': apiHealth === 'checking',
                  'bg-emerald-500 animate-pulse': apiHealth === 'ok',
                  'bg-red-500': apiHealth === 'error',
                }"
              />
              <span
                class="text-xs font-medium"
                :class="{
                  'text-muted-foreground': apiHealth === 'checking',
                  'text-emerald-600 dark:text-emerald-400': apiHealth === 'ok',
                  'text-red-600 dark:text-red-400': apiHealth === 'error',
                }"
              >
                {{
                  apiHealth === "checking"
                    ? "Pinging..."
                    : apiHealth === "ok"
                      ? "Reachable"
                      : "Unreachable"
                }}
              </span>
              <button
                class="ml-1 rounded-md border px-2 py-0.5 text-xs hover:bg-muted"
                @click="pingApi"
              >
                Retry
              </button>
            </template>
          </div>
        </div>
      </div>

      <p v-if="!isElectron" class="text-xs text-muted-foreground">
        Sidecar status only available in packaged app.
      </p>
    </div>

    <!-- Connection Settings -->
    <div class="space-y-3">
      <h2
        class="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        Connection
      </h2>
      <div class="rounded-lg border bg-card p-4 space-y-4">
        <div class="space-y-1">
          <label class="text-sm font-medium">API URL</label>
          <input
            v-model="apiUrl"
            type="text"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div class="space-y-1">
          <label class="text-sm font-medium">API Token</label>
          <input
            v-model="apiToken"
            type="password"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div class="flex gap-2">
          <button
            :disabled="appStore.connecting"
            class="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
            @click="appStore.checkConnection()"
          >
            {{ appStore.connecting ? "Testing..." : "Test Connection" }}
          </button>
          <button
            :disabled="saving"
            class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            @click="save"
          >
            {{ saving ? "Saving..." : "Save" }}
          </button>
        </div>
      </div>
    </div>

    <!-- About -->
    <div class="space-y-3">
      <h2
        class="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        About
      </h2>
      <div class="rounded-lg border bg-card divide-y">
        <div class="flex items-center justify-between px-4 py-3">
          <span class="text-sm text-muted-foreground">Application</span>
          <span class="text-sm font-medium">Traffick Boost Desktop</span>
        </div>
        <div class="flex items-center justify-between px-4 py-3">
          <span class="text-sm text-muted-foreground">Version</span>
          <span class="text-sm font-mono">{{ appVersion }}</span>
        </div>
        <div class="flex items-center justify-between px-4 py-3">
          <span class="text-sm text-muted-foreground">Mode</span>
          <span class="text-sm font-mono">
            {{ isElectron ? "Desktop (Electron)" : "Browser" }}
          </span>
        </div>
        <div class="flex items-center justify-between px-4 py-3">
          <span class="text-sm text-muted-foreground">Platform</span>
          <span class="text-sm font-mono capitalize">{{
            isElectron ? platform : "Web"
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>


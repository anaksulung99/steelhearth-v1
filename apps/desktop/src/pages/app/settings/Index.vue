<script setup lang="ts">
import { useAppStore } from "@/stores/app.store";

const appStore = useAppStore();
const apiUrl = ref(appStore.apiUrl);
const apiToken = ref(appStore.apiToken);
const saving = ref(false);

async function save() {
  saving.value = true;
  await appStore.saveSettings(apiUrl.value, apiToken.value);
  saving.value = false;
}
</script>

<template>
  <div class="p-6 w-full space-y-6">
    <div>
      <h1 class="text-2xl font-bold">App Settings</h1>
      <p class="text-sm text-muted-foreground mt-0.5">
        Configure API connection
      </p>
    </div>
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
</template>

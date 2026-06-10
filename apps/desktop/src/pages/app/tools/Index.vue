<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { settingsApi, ApiError } from "@/api";
import type { AppSetting } from "@/api";
import { toast } from "vue-sonner";

const settings = ref<AppSetting[]>([]);
const loading = ref(true);
const editKey = ref<string | null>(null);
const editValue = ref("");
const saving = ref(false);

onMounted(async () => {
  try {
    const res = await settingsApi.list();
    settings.value = res.data;
  } finally {
    loading.value = false;
  }
});

function startEdit(s: AppSetting) {
  editKey.value = s.key;
  editValue.value = s.isSecret ? "" : s.value;
}

async function saveEdit(key: string) {
  saving.value = true;
  try {
    await settingsApi.set(
      key,
      editValue.value,
      settings.value.find((s) => s.key === key)?.isSecret ?? false
    );
    const idx = settings.value.findIndex((s) => s.key === key);
    if (idx !== -1 && !settings.value[idx].isSecret)
      settings.value[idx].value = editValue.value;
    toast.success("Setting saved");
    editKey.value = null;
  } catch (err) {
    if (err instanceof ApiError) toast.error(err.message);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="p-6 space-y-4">
    <div>
      <h1 class="text-2xl font-bold">Tools & Settings</h1>
      <p class="text-sm text-muted-foreground mt-0.5">
        Application configuration
      </p>
    </div>

    <div v-if="loading" class="p-12 text-center text-sm text-muted-foreground">
      Loading...
    </div>

    <div
      v-else-if="!settings.length"
      class="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground"
    >
      Coming Soon
    </div>

    <div v-else class="rounded-lg border bg-card divide-y">
      <div v-for="s in settings" :key="s.key" class="px-4 py-3">
        <div v-if="editKey === s.key" class="flex items-center gap-2">
          <span class="text-sm font-mono font-medium w-48">{{ s.key }}</span>
          <input
            v-model="editValue"
            :type="s.isSecret ? 'password' : 'text'"
            class="flex-1 rounded-md border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            :disabled="saving"
            class="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
            @click="saveEdit(s.key)"
          >
            Save
          </button>
          <button
            class="rounded border px-2 py-1 text-xs hover:bg-muted"
            @click="editKey = null"
          >
            Cancel
          </button>
        </div>
        <div v-else class="flex items-center justify-between">
          <div>
            <p class="text-sm font-mono font-medium">{{ s.key }}</p>
            <p class="text-xs text-muted-foreground">
              {{ s.isSecret ? "••••••••" : s.value }}
            </p>
          </div>
          <button
            class="p-1 rounded hover:bg-muted text-muted-foreground"
            @click="startEdit(s)"
          >
            <Icon icon="material-symbols:edit-outline" class="size-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { fingerprintsApi, ApiError } from "@/api";
import type { FingerprintProfile } from "@/api";
import { useGlobalAlert } from "@/composables/useAlert";
import { toast } from "vue-sonner";

const router = useRouter();
const route = useRoute();
const { confirm } = useGlobalAlert();

const id = route.params.id as string;
const fp = ref<FingerprintProfile | null>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await fingerprintsApi.get(id);
    fp.value = res.data;
  } finally {
    loading.value = false;
  }
});

async function handleDelete() {
  if (!fp.value) return;
  const ok = await confirm(
    `Delete "${fp.value.name}"?`,
    "This action cannot be undone.",
    {
      confirmLabel: "Delete",
      confirmClass: "bg-destructive text-destructive-foreground",
    }
  );
  if (!ok) return;
  try {
    await fingerprintsApi.delete(id);
    toast.success("Fingerprint profile deleted");
    router.push("/app/fingerprints");
  } catch (err) {
    if (err instanceof ApiError) toast.error(err.message);
  }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button class="p-1 rounded hover:bg-muted" @click="router.back()">
          <Icon icon="material-symbols:arrow-back" class="size-5" />
        </button>
        <h1 class="text-2xl font-bold">
          {{ fp?.name ?? "Fingerprint Profile" }}
        </h1>
      </div>
      <div v-if="fp" class="flex gap-2">
        <router-link :to="`/app/fingerprints/${id}/edit`">
          <button
            class="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <Icon icon="material-symbols:edit-outline" class="size-4" />
            Edit
          </button>
        </router-link>
        <button
          class="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
          @click="handleDelete"
        >
          <Icon icon="material-symbols:delete-outline" class="size-4" />
          Delete
        </button>
      </div>
    </div>

    <div v-if="loading" class="p-12 text-center text-sm text-muted-foreground">
      Loading...
    </div>

    <div v-else-if="fp" class="grid grid-cols-2 gap-4">
      <div class="rounded-lg border bg-card p-4 space-y-3">
        <h2 class="font-semibold text-sm border-b pb-2">Device</h2>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-muted-foreground">Type</dt>
            <dd class="font-medium">{{ fp.deviceType }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-muted-foreground">Mobile</dt>
            <dd class="font-medium">{{ fp.isMobile ? "Yes" : "No" }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-muted-foreground">Viewport</dt>
            <dd class="font-medium">
              {{ fp.viewportWidth }}×{{ fp.viewportHeight }}
            </dd>
          </div>
        </dl>
      </div>
      <div class="rounded-lg border bg-card p-4 space-y-3">
        <h2 class="font-semibold text-sm border-b pb-2">OS & Browser</h2>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-muted-foreground">OS</dt>
            <dd class="font-medium">{{ fp.osName }} {{ fp.osVersion }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-muted-foreground">Browser</dt>
            <dd class="font-medium">
              {{ fp.browserName }} {{ fp.browserVersion }}
            </dd>
          </div>
        </dl>
      </div>
      <div class="rounded-lg border bg-card p-4 space-y-3">
        <h2 class="font-semibold text-sm border-b pb-2">Locale</h2>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-muted-foreground">Language</dt>
            <dd class="font-medium">{{ fp.language }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-muted-foreground">Timezone</dt>
            <dd class="font-medium">{{ fp.timezone }}</dd>
          </div>
        </dl>
      </div>
      <div
        v-if="fp.userAgent"
        class="rounded-lg border bg-card p-4 space-y-2 col-span-2"
      >
        <h2 class="font-semibold text-sm border-b pb-2">User Agent</h2>
        <p class="text-xs font-mono text-muted-foreground break-all">
          {{ fp.userAgent }}
        </p>
      </div>
    </div>
  </div>
</template>

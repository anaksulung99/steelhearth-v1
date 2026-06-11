<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { fingerprintsApi, ApiError } from "@/api";
import type { FingerprintProfile } from "@/api";
import { useGlobalAlert } from "@/composables/useAlert";
import { toast } from "vue3-toastify";

const router = useRouter();
const { confirm } = useGlobalAlert();

const items = ref<FingerprintProfile[]>([]);
const total = ref(0);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await fingerprintsApi.list({ limit: 100 });
    items.value = res.data;
    total.value = res.meta.total;
  } finally {
    loading.value = false;
  }
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
  try {
    await fingerprintsApi.delete(id);
    items.value = items.value.filter((f) => f.id !== id);
    total.value--;
    toast.success("Fingerprint profile deleted");
  } catch (err) {
    if (err instanceof ApiError) toast.error(err.message);
  }
}

const deviceIcon: Record<string, string> = {
  DESKTOP: "material-symbols:computer-outline",
  MOBILE: "material-symbols:smartphone",
};
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Fingerprint Profiles</h1>
        <p class="text-sm text-muted-foreground mt-0.5">{{ total }} profiles</p>
      </div>
      <router-link to="/app/fingerprints/create">
        <button
          class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Icon icon="material-symbols:add" class="size-4" />
          New Profile
        </button>
      </router-link>
    </div>

    <div v-if="loading" class="p-12 text-center text-sm text-muted-foreground">
      Loading...
    </div>

    <div
      v-else-if="!items.length"
      class="rounded-lg border bg-card p-12 text-center space-y-2"
    >
      <Icon
        icon="ooui:user-anonymous"
        class="size-10 text-muted-foreground mx-auto"
      />
      <p class="text-sm text-muted-foreground">No fingerprint profiles yet</p>
      <router-link
        to="/app/fingerprints/create"
        class="text-sm text-primary hover:underline"
        >Create your first profile</router-link
      >
    </div>

    <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="f in items"
        :key="f.id"
        class="rounded-lg border bg-card p-4 space-y-3 hover:border-primary/50 transition-colors"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-2">
            <Icon
              :icon="
                deviceIcon[f.deviceType] ?? 'material-symbols:computer-outline'
              "
              class="size-5 text-muted-foreground"
            />
            <div>
              <p class="font-medium text-sm">{{ f.name }}</p>
              <p class="text-xs text-muted-foreground">
                {{ f.osName }} · {{ f.browserName }}
              </p>
            </div>
          </div>
          <div class="flex gap-1">
            <router-link :to="`/app/fingerprints/${f.id}/edit`">
              <button class="p-1 rounded hover:bg-muted text-muted-foreground">
                <Icon icon="material-symbols:edit-outline" class="size-4" />
              </button>
            </router-link>
            <button
              class="p-1 rounded hover:bg-red-500/10 text-destructive"
              @click="handleDelete(f.id, f.name)"
            >
              <Icon icon="material-symbols:delete-outline" class="size-4" />
            </button>
          </div>
        </div>
        <dl class="text-xs text-muted-foreground space-y-1">
          <div class="flex justify-between">
            <dt>Viewport</dt>
            <dd class="text-foreground">
              {{ f.viewportWidth }}×{{ f.viewportHeight }}
            </dd>
          </div>
          <div class="flex justify-between">
            <dt>Language</dt>
            <dd class="text-foreground">{{ f.language }}</dd>
          </div>
          <div class="flex justify-between">
            <dt>Timezone</dt>
            <dd class="text-foreground">{{ f.timezone }}</dd>
          </div>
        </dl>
        <router-link
          :to="`/app/fingerprints/${f.id}/detail`"
          class="text-xs text-primary hover:underline"
          >View details →</router-link
        >
      </div>
    </div>
  </div>
</template>

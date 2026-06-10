<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { useBehaviourStore } from "@/stores/behaviour.store";
import { useGlobalAlert } from "@/composables/useAlert";

const router = useRouter();
const route = useRoute();
const behaviourStore = useBehaviourStore();
const { confirm } = useGlobalAlert();

const id = route.params.id as string;

onMounted(() => behaviourStore.fetchOne(id));

const b = computed(() => behaviourStore.current);

async function handleDelete() {
  if (!b.value) return;
  const ok = await confirm(
    `Delete "${b.value.name}"?`,
    "This action cannot be undone.",
    {
      confirmLabel: "Delete",
      confirmClass: "bg-destructive text-destructive-foreground",
    }
  );
  if (!ok) return;
  const success = await behaviourStore.remove(id);
  if (success) router.push("/app/behaviours");
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button class="p-1 rounded hover:bg-muted" @click="router.back()">
          <Icon icon="material-symbols:arrow-back" class="size-5" />
        </button>
        <h1 class="text-2xl font-bold">{{ b?.name ?? "Behaviour Profile" }}</h1>
      </div>
      <div v-if="b" class="flex gap-2">
        <router-link :to="`/app/behaviours/${id}/edit`">
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

    <div
      v-if="behaviourStore.loading"
      class="p-12 text-center text-sm text-muted-foreground"
    >
      Loading...
    </div>

    <div v-else-if="b" class="grid grid-cols-2 gap-4">
      <div class="rounded-lg border bg-card p-4 space-y-3">
        <h2 class="font-semibold text-sm border-b pb-2">Timing</h2>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-muted-foreground">Type</dt>
            <dd class="font-medium">{{ b.type.replace(/_/g, " ") }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-muted-foreground">Dwell Time</dt>
            <dd class="font-medium">
              {{ b.minDwellSeconds }}–{{ b.maxDwellSeconds }}s
            </dd>
          </div>
        </dl>
      </div>
      <div class="rounded-lg border bg-card p-4 space-y-3">
        <h2 class="font-semibold text-sm border-b pb-2">Scrolling</h2>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-muted-foreground">Scroll Count</dt>
            <dd class="font-medium">
              {{ b.minScrollCount }}–{{ b.maxScrollCount }}
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-muted-foreground">Scroll Speed</dt>
            <dd class="font-medium">
              {{ b.scrollSpeedMin }}–{{ b.scrollSpeedMax }} px/s
            </dd>
          </div>
        </dl>
      </div>
      <div class="rounded-lg border bg-card p-4 space-y-3">
        <h2 class="font-semibold text-sm border-b pb-2">Navigation</h2>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-muted-foreground">Internal Nav</dt>
            <dd class="font-medium">
              {{ b.enableInternalNav ? "Enabled" : "Disabled" }}
            </dd>
          </div>
          <div v-if="b.enableInternalNav" class="flex justify-between">
            <dt class="text-muted-foreground">Max Clicks</dt>
            <dd class="font-medium">{{ b.maxInternalClicks }}</dd>
          </div>
        </dl>
      </div>
      <div class="rounded-lg border bg-card p-4 space-y-3">
        <h2 class="font-semibold text-sm border-b pb-2">Meta</h2>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-muted-foreground">Created</dt>
            <dd class="font-medium">
              {{ new Date(b.createdAt).toLocaleDateString() }}
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-muted-foreground">Updated</dt>
            <dd class="font-medium">
              {{ new Date(b.updatedAt).toLocaleDateString() }}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>

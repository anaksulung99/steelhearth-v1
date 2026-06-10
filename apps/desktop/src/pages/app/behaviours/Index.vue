<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { useBehaviourStore } from "@/stores/behaviour.store";
import { useGlobalAlert } from "@/composables/useAlert";

const router = useRouter();
const behaviourStore = useBehaviourStore();
const { confirm } = useGlobalAlert();

onMounted(() => behaviourStore.fetchAll());

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
  await behaviourStore.remove(id);
}

const typeColor: Record<string, string> = {
  DEFAULT_READER: "bg-blue-500/15 text-blue-600",
  MOBILE_CASUAL: "bg-violet-500/15 text-violet-600",
  QUICK_SCANNER: "bg-orange-500/15 text-orange-600",
  DEEP_ENGAGER: "bg-emerald-500/15 text-emerald-600",
  CUSTOM_CLICKER: "bg-pink-500/15 text-pink-600",
};
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Behaviour Profiles</h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          {{ behaviourStore.total }} profiles
        </p>
      </div>
      <router-link to="/app/behaviours/create">
        <button
          class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Icon icon="material-symbols:add" class="size-4" />
          New Profile
        </button>
      </router-link>
    </div>

    <div
      v-if="behaviourStore.loading"
      class="p-12 text-center text-sm text-muted-foreground"
    >
      Loading...
    </div>

    <div
      v-else-if="!behaviourStore.items.length"
      class="rounded-lg border bg-card p-12 text-center space-y-2"
    >
      <Icon
        icon="material-symbols:neurology-outline"
        class="size-10 text-muted-foreground mx-auto"
      />
      <p class="text-sm text-muted-foreground">No behaviour profiles yet</p>
      <router-link
        to="/app/behaviours/create"
        class="text-sm text-primary hover:underline"
        >Create your first profile</router-link
      >
    </div>

    <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="b in behaviourStore.items"
        :key="b.id"
        class="rounded-lg border bg-card p-4 space-y-3 hover:border-primary/50 transition-colors"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="font-medium text-sm">{{ b.name }}</p>
            <span
              class="inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium"
              :class="typeColor[b.type] ?? 'bg-muted text-muted-foreground'"
            >
              {{ b.type.replace(/_/g, " ") }}
            </span>
          </div>
          <div class="flex gap-1">
            <router-link :to="`/app/behaviours/${b.id}/edit`">
              <button class="p-1 rounded hover:bg-muted text-muted-foreground">
                <Icon icon="material-symbols:edit-outline" class="size-4" />
              </button>
            </router-link>
            <button
              class="p-1 rounded hover:bg-red-500/10 text-destructive"
              @click="handleDelete(b.id, b.name)"
            >
              <Icon icon="material-symbols:delete-outline" class="size-4" />
            </button>
          </div>
        </div>
        <dl
          class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground"
        >
          <div class="flex justify-between col-span-2">
            <dt>Dwell</dt>
            <dd class="text-foreground">
              {{ b.minDwellSeconds }}–{{ b.maxDwellSeconds }}s
            </dd>
          </div>
          <div class="flex justify-between col-span-2">
            <dt>Scroll</dt>
            <dd class="text-foreground">
              {{ b.minScrollCount }}–{{ b.maxScrollCount }}x
            </dd>
          </div>
          <div class="flex justify-between col-span-2">
            <dt>Internal Nav</dt>
            <dd class="text-foreground">
              {{
                b.enableInternalNav ? `Yes (max ${b.maxInternalClicks})` : "No"
              }}
            </dd>
          </div>
        </dl>
        <router-link
          :to="`/app/behaviours/${b.id}/detail`"
          class="text-xs text-primary hover:underline"
          >View details →</router-link
        >
      </div>
    </div>
  </div>
</template>

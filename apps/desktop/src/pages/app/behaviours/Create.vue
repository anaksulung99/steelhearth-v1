<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { useBehaviourStore } from "@/stores/behaviour.store";
import type { CreateBehaviourDto } from "@/api";

const router = useRouter();
const behaviourStore = useBehaviourStore();

const form = reactive<CreateBehaviourDto>({
  name: "",
  type: "DEFAULT_READER",
  minDwellSeconds: 30,
  maxDwellSeconds: 120,
  minScrollCount: 2,
  maxScrollCount: 8,
  scrollSpeedMin: 100,
  scrollSpeedMax: 400,
  enableInternalNav: false,
  maxInternalClicks: 0,
  customClickSelectors: [],
});

const submitting = ref(false);

watch(
  () => form.type,
  (v) => {
    if (v === "CUSTOM_CLICKER" && (!form.customClickSelectors || form.customClickSelectors.length === 0)) {
      form.customClickSelectors = [{ selector: "", selectorType: "css", description: "", order: 0 }];
    }
  },
);

function addSelector() {
  form.customClickSelectors = [
    ...(form.customClickSelectors ?? []),
    { selector: "", selectorType: "css", description: "", order: (form.customClickSelectors?.length ?? 0) },
  ];
}

function removeSelector(idx: number) {
  form.customClickSelectors = (form.customClickSelectors ?? []).filter((_, i) => i !== idx);
}

async function submit() {
  if (!form.name) return;
  submitting.value = true;
  const payload = { ...form } as CreateBehaviourDto;
  // Strip selectors if type is not CUSTOM_CLICKER
  if (payload.type !== "CUSTOM_CLICKER") {
    payload.customClickSelectors = undefined;
  }
  const result = await behaviourStore.create(payload);
  submitting.value = false;
  if (result) router.push("/app/behaviours");
}
</script>

<template>
  <div class="p-6 w-full space-y-6">
    <div class="flex items-center gap-3">
      <button class="p-1 rounded hover:bg-muted" @click="router.back()">
        <Icon icon="material-symbols:arrow-back" class="size-5" />
      </button>
      <div>
        <h1 class="text-2xl font-bold">New Behaviour Profile</h1>
        <p class="text-sm text-muted-foreground">
          Define how sessions interact with the target page
        </p>
      </div>
    </div>

    <form class="space-y-4" @submit.prevent="submit">
      <div class="rounded-lg border bg-card p-4 space-y-4">
        <div class="space-y-1">
          <label class="text-sm font-medium"
            >Profile Name <span class="text-destructive">*</span></label
          >
          <input
            v-model="form.name"
            required
            type="text"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div class="space-y-1">
          <label class="text-sm font-medium">Type</label>
          <select
            v-model="form.type"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="DEFAULT_READER">Default Reader</option>
            <option value="MOBILE_CASUAL">Mobile Casual</option>
            <option value="QUICK_SCANNER">Quick Scanner</option>
            <option value="DEEP_ENGAGER">Deep Engager</option>
            <option value="CUSTOM_CLICKER">Custom Clicker</option>
          </select>
        </div>
      </div>

      <div class="rounded-lg border bg-card p-4 space-y-4">
        <h2 class="font-semibold text-sm">Dwell Time (seconds)</h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-sm font-medium">Min</label>
            <input
              v-model.number="form.minDwellSeconds"
              type="number"
              min="1"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium">Max</label>
            <input
              v-model.number="form.maxDwellSeconds"
              type="number"
              min="1"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      <div class="rounded-lg border bg-card p-4 space-y-4">
        <h2 class="font-semibold text-sm">Scroll</h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-sm font-medium">Min Count</label>
            <input
              v-model.number="form.minScrollCount"
              type="number"
              min="0"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium">Max Count</label>
            <input
              v-model.number="form.maxScrollCount"
              type="number"
              min="0"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium">Speed Min (px/s)</label>
            <input
              v-model.number="form.scrollSpeedMin"
              type="number"
              min="10"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium">Speed Max (px/s)</label>
            <input
              v-model.number="form.scrollSpeedMax"
              type="number"
              min="10"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      <div class="rounded-lg border bg-card p-4 space-y-4">
        <h2 class="font-semibold text-sm">Internal Navigation</h2>
        <div class="flex items-center gap-2">
          <input
            id="enableInternalNav"
            v-model="form.enableInternalNav"
            type="checkbox"
            class="rounded"
          />
          <label for="enableInternalNav" class="text-sm font-medium"
            >Enable internal page navigation</label
          >
        </div>
        <div v-if="form.enableInternalNav" class="space-y-1">
          <label class="text-sm font-medium">Max Internal Clicks</label>
          <input
            v-model.number="form.maxInternalClicks"
            type="number"
            min="1"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <!-- Custom Click Selectors — only shown for CUSTOM_CLICKER type -->
      <div v-if="form.type === 'CUSTOM_CLICKER'" class="rounded-lg border bg-card p-4 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-semibold text-sm">Click Selectors</h2>
            <p class="text-xs text-muted-foreground mt-0.5">CSS, XPath, or element id to click during the session</p>
          </div>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            @click="addSelector"
          >
            <Icon icon="material-symbols:add" class="size-3.5" />
            Add Selector
          </button>
        </div>

        <div
          v-if="!form.customClickSelectors || form.customClickSelectors.length === 0"
          class="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground"
        >
          No selectors yet — click "Add Selector" to begin
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(sel, idx) in form.customClickSelectors"
            :key="idx"
            class="rounded-md border bg-muted/30 p-3 space-y-2"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-muted-foreground">#{{ idx + 1 }}</span>
              <button
                type="button"
                class="text-destructive hover:opacity-70"
                @click="removeSelector(idx)"
              >
                <Icon icon="material-symbols:delete-outline" class="size-4" />
              </button>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div class="col-span-2 space-y-1">
                <label class="text-xs font-medium">Selector <span class="text-destructive">*</span></label>
                <input
                  v-model="sel.selector"
                  type="text"
                  required
                  placeholder="e.g. .btn-cta, //button, or submit-button"
                  class="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-medium">Type</label>
                <select
                  v-model="sel.selectorType"
                  class="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="css">CSS</option>
                  <option value="xpath">XPath</option>
                  <option value="elementId">Element ID</option>
                </select>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium">Description (optional)</label>
              <input
                v-model="sel.description"
                type="text"
                placeholder="e.g. Main CTA button"
                class="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="rounded-md border px-4 py-2 text-sm hover:bg-muted"
          @click="router.back()"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="submitting"
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {{ submitting ? "Creating..." : "Create Profile" }}
        </button>
      </div>
    </form>
  </div>
</template>

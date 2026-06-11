<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { useCampaignStore } from "@/stores/campaign.store";
import { useBehaviourStore } from "@/stores/behaviour.store";
import { useProxyStore } from "@/stores/proxy.store";
import { useGlobalAlert } from "@/composables/useAlert";
import { fingerprintsApi } from "@/api";
import type {
  CampaignClickSelector,
  FingerprintProfile,
  UpdateCampaignDto,
} from "@/api";

const router = useRouter();
const route = useRoute();
const campaignStore = useCampaignStore();
const behaviourStore = useBehaviourStore();
const proxyStore = useProxyStore();
const { warning } = useGlobalAlert();

const id = route.params.id as string;
const submitting = ref(false);
const loading = ref(true);
const fingerprints = ref<FingerprintProfile[]>([]);
const showClickSelectors = ref(false);
const countriesStr = ref("");

const form = reactive<UpdateCampaignDto>({
  name: "",
  targetUrl: "",
  description: "",
  launcherType: "PLAYWRIGHT",
  fingerprintProfileId: null,
  behaviourProfileId: null,
  proxyGroupIds: [],
  totalSessionsTarget: 100,
  dailyLimit: 20,
  sessionsPerHour: 5,
  headless: true,
  browserEngine: "CHROMIUM",
  geoMode: "proxy",
  targetCountries: [],
  clickSelectors: [],
});

onMounted(async () => {
  const [campaign] = await Promise.all([
    campaignStore.fetchOne(id),
    behaviourStore.fetchAll(),
    proxyStore.fetchGroups(),
    fingerprintsApi
      .list({ limit: 100 })
      .then((r) => {
        fingerprints.value = r.data;
      })
      .catch(() => {}),
  ]);

  if (!campaign) {
    loading.value = false;
    return;
  }

  if (campaign.status === "ACTIVE") {
    await warning(
      "Campaign is still running",
      "Pause or stop this campaign before editing its configuration."
    );
    router.replace(`/app/campaigns/${id}/detail`);
    return;
  }

  form.name = campaign.name;
  form.targetUrl = campaign.targetUrl;
  form.description = campaign.description ?? "";
  form.launcherType = campaign.launcherType;
  form.fingerprintProfileId = campaign.fingerprintProfileId;
  form.behaviourProfileId = campaign.behaviourProfileId;
  form.proxyGroupIds = campaign.proxyGroups?.map((g) => g.proxyGroupId) ?? [];
  form.totalSessionsTarget = campaign.totalSessionsTarget;
  form.dailyLimit = campaign.dailyLimit;
  form.sessionsPerHour = campaign.sessionsPerHour;
  form.headless = campaign.headless;
  form.browserEngine = campaign.browserEngine;
  form.geoMode = campaign.geoMode === "manual" ? "manual" : "proxy";
  form.targetCountries = [...campaign.targetCountries];
  form.clickSelectors = (campaign.clickSelectors ?? []).map((s) => ({
    selector: s.selector,
    selectorType: s.selectorType,
    description: s.description ?? "",
    order: s.order,
  }));
  countriesStr.value = campaign.targetCountries.join(", ");
  loading.value = false;
});

watch(
  () => form.geoMode,
  (mode) => {
    if (mode === "proxy") {
      form.targetCountries = [];
      countriesStr.value = "";
    } else {
      form.proxyGroupIds = [];
    }
  }
);

function toggleProxyGroup(groupId: string) {
  const current = form.proxyGroupIds ?? [];
  form.proxyGroupIds = current.includes(groupId)
    ? current.filter((id) => id !== groupId)
    : [...current, groupId];
}

function addClickSelector() {
  const current = form.clickSelectors ?? [];
  form.clickSelectors = [
    ...current,
    {
      selector: "",
      selectorType: "css",
      description: "",
      order: current.length,
    },
  ];
  showClickSelectors.value = true;
}

function removeClickSelector(index: number) {
  form.clickSelectors = (form.clickSelectors ?? [])
    .filter((_, i) => i !== index)
    .map((selector, order) => ({ ...selector, order }));
}

function normalizeSelectorType(selectorType?: string) {
  return selectorType === "xpath" || selectorType === "elementId"
    ? selectorType
    : "css";
}

function normalizeSelectors(selectors: Partial<CampaignClickSelector>[] = []) {
  return selectors
    .map((selector, order) => ({
      selector: selector.selector?.trim() ?? "",
      selectorType: normalizeSelectorType(selector.selectorType),
      description: selector.description?.trim() || undefined,
      order,
    }))
    .filter((selector) => selector.selector.length > 0);
}

function parseCountries() {
  return countriesStr.value
    .split(",")
    .map((country) => country.trim().toUpperCase())
    .filter((country) => /^[A-Z]{2}$/.test(country));
}

async function submit() {
  if (!form.name || !form.targetUrl) return;

  const geoMode = form.geoMode === "manual" ? "manual" : "proxy";
  const payload: UpdateCampaignDto = {
    name: form.name,
    targetUrl: form.targetUrl,
    description: form.description || "",
    launcherType: form.launcherType,
    fingerprintProfileId: form.fingerprintProfileId || null,
    behaviourProfileId: form.behaviourProfileId || null,
    totalSessionsTarget: Number(form.totalSessionsTarget ?? 0),
    dailyLimit: Number(form.dailyLimit ?? 1),
    sessionsPerHour: Number(form.sessionsPerHour ?? 1),
    headless: !!form.headless,
    browserEngine: form.browserEngine,
    geoMode,
    proxyGroupIds: geoMode === "proxy" ? (form.proxyGroupIds ?? []) : [],
    targetCountries: geoMode === "manual" ? parseCountries() : [],
    clickSelectors: normalizeSelectors(form.clickSelectors),
  };

  submitting.value = true;
  const result = await campaignStore.update(id, payload);
  submitting.value = false;
  if (result) router.push(`/app/campaigns/${id}/detail`);
}
</script>

<template>
  <div class="p-6 w-full space-y-6">
    <div class="flex items-center gap-3">
      <button class="p-1 rounded hover:bg-muted" @click="router.back()">
        <Icon icon="material-symbols:arrow-back" class="size-5" />
      </button>
      <div>
        <h1 class="text-2xl font-bold">Edit Campaign</h1>
        <p class="text-sm text-muted-foreground">
          Update campaign configuration
        </p>
      </div>
    </div>

    <div v-if="loading" class="p-12 text-center text-sm text-muted-foreground">
      Loading...
    </div>

    <form v-else class="space-y-4" @submit.prevent="submit">
      <div class="rounded-lg border bg-card p-4 space-y-4">
        <h2 class="font-semibold text-sm">Basic Info</h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1 col-span-2">
            <label class="text-sm font-medium"
              >Campaign Name <span class="text-destructive">*</span></label
            >
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div class="space-y-1 col-span-2">
            <label class="text-sm font-medium"
              >Target URL <span class="text-destructive">*</span></label
            >
            <input
              v-model="form.targetUrl"
              type="url"
              required
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div class="space-y-1 col-span-2">
            <Label class="text-sm font-medium">
              Browser Launcher <span class="text-destructive">*</span>
            </Label>
            <Select v-model="form.launcherType" :disabled="submitting">
              <SelectTrigger class="bg-input">
                <SelectValue
                  class="bg-input"
                  :placeholder="
                    form.launcherType ? form.launcherType : 'Select a launcher'
                  "
                />
              </SelectTrigger>
              <SelectContent class="w-full">
                <SelectGroup>
                  <SelectItem value="PLAYWRIGHT"> Playwright </SelectItem>
                  <SelectItem value="CRAWLEE"> Crawlee </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1 col-span-2">
            <label class="text-sm font-medium">Description</label>
            <textarea
              v-model="form.description"
              rows="2"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      <div class="rounded-lg border bg-card p-4 space-y-4">
        <h2 class="font-semibold text-sm">Session Settings</h2>
        <div class="grid grid-cols-3 gap-4">
          <div class="space-y-1">
            <label class="text-sm font-medium">Total Sessions</label>
            <input
              v-model.number="form.totalSessionsTarget"
              type="number"
              min="0"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium">Daily Limit</label>
            <input
              v-model.number="form.dailyLimit"
              type="number"
              min="1"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium">Sessions/Hour</label>
            <input
              v-model.number="form.sessionsPerHour"
              type="number"
              min="1"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      <div class="rounded-lg border bg-card p-4 space-y-4">
        <h2 class="font-semibold text-sm">Browser & Profiles</h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-sm font-medium">Browser Engine</label>
            <select
              v-model="form.browserEngine"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="CHROMIUM">Chromium</option>
              <option value="FIREFOX">Firefox</option>
              <option value="WEBKIT">WebKit</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium">Behaviour Profile</label>
            <select
              v-model="form.behaviourProfileId"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option :value="null">None (use default)</option>
              <option
                v-for="b in behaviourStore.items"
                :key="b.id"
                :value="b.id"
              >
                {{ b.name }}
              </option>
            </select>
          </div>
          <div class="space-y-1 col-span-2">
            <label class="text-sm font-medium">Fingerprint Profile</label>
            <select
              v-model="form.fingerprintProfileId"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option :value="null">None (use default)</option>
              <option v-for="f in fingerprints" :key="f.id" :value="f.id">
                {{ f.name }} - {{ f.osName }} / {{ f.browserName }}
              </option>
            </select>
          </div>
          <div class="flex items-center gap-2 col-span-2">
            <input
              id="headless"
              v-model="form.headless"
              type="checkbox"
              class="rounded"
            />
            <label for="headless" class="text-sm font-medium"
              >Headless mode</label
            >
          </div>
        </div>
      </div>

      <div class="rounded-lg border bg-card p-4 space-y-4">
        <h2 class="font-semibold text-sm">Geo & Proxy</h2>
        <div class="grid grid-cols-2 gap-3">
          <label
            class="flex items-center gap-2 rounded-md border px-4 py-3 cursor-pointer"
            :class="
              form.geoMode === 'proxy'
                ? 'border-primary bg-primary/5'
                : 'hover:bg-muted/50'
            "
          >
            <input
              v-model="form.geoMode"
              type="radio"
              value="proxy"
              class="accent-primary"
            />
            <span class="text-sm font-medium">Proxy Pool</span>
          </label>
          <label
            class="flex items-center gap-2 rounded-md border px-4 py-3 cursor-pointer"
            :class="
              form.geoMode === 'manual'
                ? 'border-primary bg-primary/5'
                : 'hover:bg-muted/50'
            "
          >
            <input
              v-model="form.geoMode"
              type="radio"
              value="manual"
              class="accent-primary"
            />
            <span class="text-sm font-medium">Manual Countries</span>
          </label>
        </div>

        <div v-if="form.geoMode === 'proxy'" class="space-y-2">
          <label class="text-sm font-medium">Proxy Groups</label>
          <div
            v-if="proxyStore.groups.length === 0"
            class="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground"
          >
            No proxy groups found.
          </div>
          <div v-else class="space-y-2">
            <label
              v-for="g in proxyStore.groups"
              :key="g.id"
              class="flex items-center gap-3 rounded-md border px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
              :class="
                (form.proxyGroupIds ?? []).includes(g.id)
                  ? 'border-primary bg-primary/5'
                  : ''
              "
            >
              <input
                type="checkbox"
                :checked="(form.proxyGroupIds ?? []).includes(g.id)"
                class="rounded accent-primary"
                @change="toggleProxyGroup(g.id)"
              />
              <span class="text-sm font-medium">{{ g.name }}</span>
              <span class="text-xs text-muted-foreground"
                >({{ g._count?.proxies ?? 0 }})</span
              >
            </label>
          </div>
        </div>

        <div v-else class="space-y-1">
          <label class="text-sm font-medium">Target Countries</label>
          <input
            v-model="countriesStr"
            type="text"
            placeholder="US, GB, ID, SG"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground">
            Comma-separated ISO 3166-1 alpha-2 country codes.
          </p>
        </div>
      </div>

      <div class="rounded-lg border bg-card">
        <button
          type="button"
          class="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted/50"
          @click="showClickSelectors = !showClickSelectors"
        >
          <span>Click Selectors ({{ form.clickSelectors?.length ?? 0 }})</span>
          <Icon
            :icon="
              showClickSelectors
                ? 'material-symbols:expand-less'
                : 'material-symbols:expand-more'
            "
            class="size-4"
          />
        </button>
        <div v-if="showClickSelectors" class="px-4 pb-4 space-y-4 border-t">
          <div class="flex justify-end pt-3">
            <button
              type="button"
              class="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              @click="addClickSelector"
            >
              <Icon icon="material-symbols:add" class="size-3.5" />
              Add Selector
            </button>
          </div>
          <div
            v-if="!form.clickSelectors?.length"
            class="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground"
          >
            No selectors
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="(sel, idx) in form.clickSelectors"
              :key="idx"
              class="rounded-md border bg-muted/30 p-3 space-y-2"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-muted-foreground"
                  >#{{ idx + 1 }}</span
                >
                <button
                  type="button"
                  class="text-destructive hover:opacity-70"
                  @click="removeClickSelector(idx)"
                >
                  <Icon icon="material-symbols:delete-outline" class="size-4" />
                </button>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div class="col-span-2 space-y-1">
                  <label class="text-xs font-medium">Selector</label>
                  <input
                    v-model="sel.selector"
                    type="text"
                    placeholder=".btn-cta, //button, or submit-button"
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
                <label class="text-xs font-medium">Description</label>
                <input
                  v-model="sel.description"
                  type="text"
                  placeholder="Optional"
                  class="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
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
          {{ submitting ? "Saving..." : "Save Changes" }}
        </button>
      </div>
    </form>
  </div>
</template>

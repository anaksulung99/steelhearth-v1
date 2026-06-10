<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { ref, reactive, onMounted, watch } from "vue";
import { useCampaignStore } from "@/stores/campaign.store";
import { useBehaviourStore } from "@/stores/behaviour.store";
import { useProxyStore } from "@/stores/proxy.store";
import { fingerprintsApi, ApiError } from "@/api";
import type { CreateCampaignDto, FingerprintProfile } from "@/api";
import { CountryList } from "@tb/shared";

const router = useRouter();
const campaignStore = useCampaignStore();
const behaviourStore = useBehaviourStore();
const proxyStore = useProxyStore();

const fingerprints = ref<FingerprintProfile[]>([]);
const showClickSelectors = ref(false);

// countriesStr is the raw comma-separated input for manual mode
// const countriesStr = ref("");

const form = reactive<CreateCampaignDto>({
  name: "",
  targetUrl: "",
  description: "",
  fingerprintProfileId: undefined,
  behaviourProfileId: undefined,
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

const submitting = ref(false);

onMounted(async () => {
  await Promise.all([
    behaviourStore.fetchAll(),
    proxyStore.fetchGroups(),
    fingerprintsApi
      .list({ limit: 100 })
      .then((r) => {
        fingerprints.value = r.data;
      })
      .catch(() => {}),
  ]);
});

// When switching geoMode, clear irrelevant fields
watch(
  () => form.geoMode,
  (mode) => {
    if (mode === "proxy") {
      form.targetCountries = [];
      // countriesStr.value = "";
    } else {
      form.proxyGroupIds = [];
    }
  }
);

function toggleProxyGroup(id: string) {
  const current = form.proxyGroupIds ?? [];
  const idx = current.indexOf(id);
  if (idx === -1) form.proxyGroupIds = [...current, id];
  else form.proxyGroupIds = current.filter((x) => x !== id);
}

function addClickSelector() {
  form.clickSelectors = [
    ...(form.clickSelectors ?? []),
    {
      selector: "",
      selectorType: "css",
      description: "",
      order: form.clickSelectors?.length ?? 0,
    },
  ];
}

function removeClickSelector(idx: number) {
  form.clickSelectors = (form.clickSelectors ?? []).filter((_, i) => i !== idx);
}

async function submit() {
  if (!form.name || !form.targetUrl) return;

  const payload: CreateCampaignDto = {
    ...form,
    // Strip empty strings from optional cuid fields — Vue select can produce "" for :value="undefined"
    behaviourProfileId: form.behaviourProfileId || undefined,
    fingerprintProfileId: form.fingerprintProfileId || undefined,
    // Ensure geoMode is always a valid enum value
    geoMode: (form.geoMode === "manual" ? "manual" : "proxy") as
      | "proxy"
      | "manual",
  };

  if (payload.geoMode === "manual") {
    // payload.targetCountries = countriesStr.value
    //   .split(",")
    //   .map((s) => s.trim().toUpperCase())
    //   .filter((s) => s.length === 2);
    payload.targetCountries = form.targetCountries;
    payload.proxyGroupIds = [];
  } else {
    payload.targetCountries = [];
  }

  submitting.value = true;
  const result = await campaignStore.create(payload);
  submitting.value = false;
  if (result) router.push("/app/campaigns");
}
</script>

<template>
  <div class="p-6 w-full space-y-6">
    <div class="flex items-center gap-3">
      <button class="p-1 rounded hover:bg-muted" @click="router.back()">
        <Icon icon="material-symbols:arrow-back" class="size-5" />
      </button>
      <div>
        <h1 class="text-2xl font-bold">New Campaign</h1>
        <p class="text-sm text-muted-foreground">
          Create a new traffic simulation campaign
        </p>
      </div>
    </div>
    <form class="space-y-4" @submit.prevent="submit">
      <!-- Basic Info -->
      <div class="rounded-lg border bg-card p-4 space-y-4">
        <h2 class="font-semibold text-sm">Basic Info</h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1 col-span-2">
            <Label class="text-sm font-medium">
              Campaign Name <span class="text-destructive">*</span>
            </Label>
            <Input
              v-model="form.name"
              type="text"
              required
              autocomplete="name"
              placeholder="Example: Test Campaign"
              class="bg-input"
              :disabled="submitting"
            />
          </div>
          <div class="space-y-1 col-span-2">
            <Label class="text-sm font-medium">
              Target URL <span class="text-destructive">*</span>
            </Label>
            <Input
              v-model="form.targetUrl"
              type="url"
              required
              placeholder="https://example.com"
              class="bg-input"
              :disabled="submitting"
            />
          </div>
          <div class="space-y-1 col-span-2">
            <Label class="text-sm font-medium">Description</Label>
            <Textarea
              v-model="form.description"
              rows="2"
              class="bg-input"
              placeholder="Enter campaign description here.."
              :disabled="submitting"
            />
          </div>
        </div>
      </div>

      <!-- Session Settings -->
      <div class="rounded-lg border bg-card p-4 space-y-4">
        <h2 class="font-semibold text-sm">Session Settings</h2>
        <div class="grid grid-cols-3 gap-4">
          <div class="space-y-1">
            <Label class="text-sm font-medium">Total Sessions</Label>
            <Input
              v-model.number="form.totalSessionsTarget"
              type="number"
              min="1"
              class="bg-input"
              :disabled="submitting"
            />
          </div>
          <div class="space-y-1">
            <Label class="text-sm font-medium">Daily Limit</Label>
            <Input
              v-model.number="form.dailyLimit"
              type="number"
              min="1"
              class="bg-input"
              :disabled="submitting"
            />
          </div>
          <div class="space-y-1">
            <Label class="text-sm font-medium">Sessions/Hour</Label>
            <Input
              v-model.number="form.sessionsPerHour"
              type="number"
              min="1"
              class="bg-input"
              :disabled="submitting"
            />
          </div>
        </div>
      </div>

      <!-- Browser & Profiles -->
      <div class="rounded-lg border bg-card p-4 space-y-4">
        <h2 class="font-semibold text-sm">Browser & Profiles</h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <Label class="text-sm font-medium">Browser Engine</Label>
            <Select v-model="form.browserEngine" :disabled="submitting">
              <SelectTrigger class="bg-input">
                <SelectValue
                  class="bg-input"
                  :placeholder="
                    form.browserEngine ? form.browserEngine : 'Select a browser'
                  "
                />
              </SelectTrigger>
              <SelectContent class="w-full">
                <SelectGroup>
                  <SelectItem value="CHROMIUM"> Chromium </SelectItem>
                  <SelectItem value="FIREFOX"> Firefox </SelectItem>
                  <SelectItem value="WEBKIT"> WebKit </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1">
            <Label class="text-sm font-medium">Behaviour Profile</Label>
            <Select
              v-model="form.behaviourProfileId"
              :disabled="submitting"
              @update:model-value="
                (val) => {
                  form.behaviourProfileId =
                    val === 'none' ? undefined : (val as string);
                }
              "
            >
              <SelectTrigger class="bg-input">
                <SelectValue
                  class="bg-input"
                  :placeholder="
                    form.behaviourProfileId
                      ? form.behaviourProfileId
                      : 'Select Behaviour Profile'
                  "
                />
              </SelectTrigger>
              <SelectContent class="w-full">
                <SelectGroup>
                  <SelectItem value="none"> None (use default) </SelectItem>
                  <SelectItem
                    v-for="b in behaviourStore.items"
                    :key="b.id"
                    :value="b.id"
                  >
                    {{ b.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1 col-span-2">
            <Label class="text-sm font-medium">Fingerprint Profile</Label>
            <Select
              v-model="form.fingerprintProfileId"
              :disabled="submitting"
              @update:model-value="
                (val) => {
                  form.fingerprintProfileId =
                    val === 'none' ? undefined : (val as string);
                }
              "
            >
              <SelectTrigger class="bg-input">
                <SelectValue
                  class="bg-input"
                  :placeholder="
                    form.fingerprintProfileId
                      ? form.fingerprintProfileId
                      : 'Select Fingerprint Profile'
                  "
                />
              </SelectTrigger>
              <SelectContent class="w-full">
                <SelectGroup>
                  <SelectItem value="none"> None (use default) </SelectItem>
                  <SelectItem
                    v-for="b in fingerprints"
                    :key="b.id"
                    :value="b.id"
                  >
                    {{ b.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="flex items-center gap-2 col-span-2">
            <Checkbox
              id="headless"
              v-model="form.headless"
              class="data-[state=checked]:emerald-blue-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white dark:data-[state=checked]:border-emerald-700 dark:data-[state=checked]:bg-emerald-700"
              :disabled="submitting"
            />
            <Label for="headless" class="text-sm font-medium">
              Headless mode
            </Label>
          </div>
        </div>
      </div>

      <!-- Geo / Proxy -->
      <div class="rounded-lg border bg-card p-4 space-y-4">
        <FieldGroup>
          <FieldSet>
            <FieldLabel for="geoMode"> Geo & Proxy </FieldLabel>
            <RadioGroup
              v-model="form.geoMode"
              name="geoMode"
              orientation="horizontal"
              :disabled="submitting"
            >
              <FieldLabel for="proxy">
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>Proxy Pool</FieldTitle>
                    <FieldDescription>
                      Route sessions through proxy groups
                    </FieldDescription>
                  </FieldContent>
                  <RadioGroupItem id="proxy" value="proxy" />
                </Field>
              </FieldLabel>
              <FieldLabel for="manual">
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>Manual Countries</FieldTitle>
                    <FieldDescription>
                      Specify target country codes only
                    </FieldDescription>
                  </FieldContent>
                  <RadioGroupItem id="manual" value="manual" />
                </Field>
              </FieldLabel>
            </RadioGroup>
          </FieldSet>
        </FieldGroup>

        <!-- proxy mode: pick proxy groups -->
        <div v-if="form.geoMode === 'proxy'" class="space-y-2">
          <Label class="text-sm font-medium">Select Proxy Groups</Label>
          <div
            v-if="proxyStore.groups.length === 0"
            class="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground"
          >
            No proxy groups found.
            <router-link
              to="/app/proxies"
              class="text-primary hover:underline ml-1"
            >
              Add proxy groups →
            </router-link>
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
                :disabled="submitting"
                @change="toggleProxyGroup(g.id)"
              />
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">{{ g.name }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ (g as any).proxyCount ?? "—" }} proxies
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- manual mode: country codes -->
        <div v-else class="space-y-1">
          <Label class="text-sm font-medium">Target Countries</Label>
          <!-- <Input
            v-model="countriesStr"
            type="text"
            placeholder="e.g. US, GB, ID, SG"
            class="bg-input"
            :disabled="submitting"
          /> -->
          <Select
            v-model="form.targetCountries"
            multiple
            :disabled="submitting"
            clear
          >
            <SelectTrigger class="bg-input">
              <SelectValue
                class="bg-input"
                :placeholder="
                  form.targetCountries && form.targetCountries?.length > 0
                    ? form.targetCountries.join(', ')
                    : 'Select Countries'
                "
              />
            </SelectTrigger>
            <SelectContent class="w-full">
              <SelectGroup>
                <SelectItem
                  v-for="c in CountryList"
                  :key="c.code"
                  :value="c.code"
                >
                  {{ c.name }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <p class="text-xs text-muted-foreground">
            Comma-separated ISO 3166-1 alpha-2 codes. Leave empty to allow any
            country.
          </p>
        </div>
      </div>

      <!-- Campaign-level Click Selectors (collapsible) -->
      <div class="rounded-lg border bg-card">
        <button
          type="button"
          class="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted/50"
          @click="showClickSelectors = !showClickSelectors"
        >
          <div class="flex items-center gap-2">
            <span>Click Selectors</span>
            <span
              v-if="(form.clickSelectors ?? []).length"
              class="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full"
            >
              {{ form.clickSelectors?.length }}
            </span>
          </div>
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
          <p class="text-xs text-muted-foreground pt-3">
            Campaign-level selectors merged with behaviour profile selectors at
            runtime.
          </p>
          <div class="flex justify-end">
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
            v-if="!form.clickSelectors || form.clickSelectors.length === 0"
            class="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground"
          >
            No selectors — optional
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
                  <Label class="text-xs font-medium"
                    >Selector <span class="text-destructive">*</span></Label
                  >
                  <Input
                    v-model="sel.selector"
                    type="text"
                    required
                    placeholder="e.g. .btn-cta, //button, or submit-button"
                    class="bg-input"
                  />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs font-medium">Type</Label>
                  <Select
                    v-model="sel.selectorType"
                    :disabled="submitting"
                    clear
                  >
                    <SelectTrigger class="bg-input">
                      <SelectValue
                        class="bg-input"
                        :placeholder="
                          sel.selectorType
                            ? sel.selectorType
                            : 'Select Selector Type'
                        "
                      />
                    </SelectTrigger>
                    <SelectContent class="w-full">
                      <SelectGroup>
                        <SelectItem value="css"> CSS </SelectItem>
                        <SelectItem value="xpath"> XPath </SelectItem>
                        <SelectItem value="elementId"> Element ID </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div class="space-y-1">
                <Label class="text-xs font-medium">
                  Description (optional)
                </Label>
                <Input
                  v-model="sel.description as string"
                  type="text"
                  placeholder="e.g. Subscribe button"
                  class="bg-input"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          :disabled="submitting"
          @click="router.back()"
        >
          Cancel
        </Button>
        <Button type="submit" :disabled="submitting">
          <Spinner v-if="submitting" />
          {{ submitting ? "Creating..." : "Create Campaign" }}
        </Button>
      </div>
    </form>
  </div>
</template>

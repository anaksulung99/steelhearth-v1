<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { ref } from "vue";
import { fingerprintsApi, ApiError } from "@/api";
import { toast } from "vue-sonner";
import {
  useFingerprintForm,
  OS_LABELS,
  BROWSER_LABELS,
} from "@/composables/useFingerprintForm";
import { TIMEZONE_LIST, LANGUAGE_CODE } from "@tb/shared";

const router = useRouter();
const submitting = ref(false);
const showAdvanced = ref(false);

const {
  form,
  availableOsOptions,
  availableOsVersionOptions,
  availableBrowserOptions,
  availableBrowserVersionOptions,
  applyPresets,
  generateUa,
  toPayload,
} = useFingerprintForm();

async function submit() {
  if (!form.name) return;
  submitting.value = true;
  try {
    await fingerprintsApi.create(toPayload() as any);
    toast.success("Fingerprint profile created");
    router.push("/app/fingerprints");
  } catch (err) {
    if (err instanceof ApiError) toast.error(err.message);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="p-6 w-full space-y-6">
    <div class="flex items-center gap-3">
      <button class="p-1 rounded hover:bg-muted" @click="router.back()">
        <Icon icon="material-symbols:arrow-back" class="size-5" />
      </button>
      <div>
        <h1 class="text-2xl font-bold">New Fingerprint Profile</h1>
        <p class="text-sm text-muted-foreground">
          Define browser fingerprint for sessions
        </p>
      </div>
    </div>

    <form class="space-y-4" @submit.prevent="submit">
      <!-- Basic Info -->
      <div class="rounded-lg border bg-card p-4 space-y-4">
        <h2 class="font-semibold text-sm">Basic Info</h2>
        <div class="space-y-1">
          <label class="text-sm font-medium"
            >Profile Name <span class="text-destructive">*</span></label
          >
          <input
            v-model="form.name"
            required
            type="text"
            placeholder="e.g. Windows Chrome Desktop"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div class="space-y-1">
          <label class="text-sm font-medium">Device Type</label>
          <select
            v-model="form.deviceType"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="DESKTOP">Desktop</option>
            <option value="MOBILE">Mobile</option>
          </select>
        </div>
      </div>

      <!-- OS -->
      <div class="rounded-lg border bg-card p-4 space-y-4">
        <h2 class="font-semibold text-sm">Operating System</h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-sm font-medium">OS</label>
            <select
              v-model="form.osName"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option v-for="os in availableOsOptions" :key="os" :value="os">
                {{ OS_LABELS[os] ?? os }}
              </option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium">OS Version</label>
            <select
              v-model="form.osVersion"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option
                v-for="v in availableOsVersionOptions"
                :key="v"
                :value="v"
              >
                {{ v }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Browser -->
      <div class="rounded-lg border bg-card p-4 space-y-4">
        <h2 class="font-semibold text-sm">Browser</h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-sm font-medium">Browser</label>
            <select
              v-model="form.browserName"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option v-for="b in availableBrowserOptions" :key="b" :value="b">
                {{ BROWSER_LABELS[b] ?? b }}
              </option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium">Browser Version</label>
            <select
              v-model="form.browserVersion"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option
                v-for="v in availableBrowserVersionOptions"
                :key="v"
                :value="v"
              >
                {{ v }}
              </option>
            </select>
          </div>
        </div>
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">User Agent</label>
            <button
              type="button"
              class="text-xs text-primary hover:underline"
              @click="generateUa"
            >
              Auto Generate
            </button>
          </div>
          <textarea
            v-model="form.userAgent"
            rows="2"
            placeholder="Leave empty or click Auto Generate"
            class="w-full rounded-md border bg-background px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <!-- Locale & Viewport -->
      <div class="rounded-lg border bg-card p-4 space-y-4">
        <h2 class="font-semibold text-sm">Locale & Viewport</h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-sm font-medium">Language</label>
            <input
              v-model="form.language"
              type="text"
              placeholder="en-US"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium">Locale</label>
            <input
              v-model="form.locale"
              type="text"
              placeholder="en-US"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium">Timezone</label>
            <select
              v-model="form.timezone"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option v-for="v in TIMEZONE_LIST" :key="v.id" :value="v.id">
                {{ v.name }}
              </option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium"
              >Languages (comma-separated)</label
            >
            <input
              v-model="form.languagesStr"
              type="text"
              placeholder="en-US, en"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium">Width (px)</label>
            <input
              v-model.number="form.viewportWidth"
              type="number"
              min="320"
              max="3840"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium">Height (px)</label>
            <input
              v-model.number="form.viewportHeight"
              type="number"
              min="240"
              max="2160"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      <!-- Advanced (collapsible) -->
      <div class="rounded-lg border bg-card">
        <button
          type="button"
          class="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted/50"
          @click="showAdvanced = !showAdvanced"
        >
          <span>Advanced Settings</span>
          <Icon
            :icon="
              showAdvanced
                ? 'material-symbols:expand-less'
                : 'material-symbols:expand-more'
            "
            class="size-4"
          />
        </button>
        <div v-if="showAdvanced" class="px-4 pb-4 space-y-4 border-t">
          <div class="grid grid-cols-2 gap-4 pt-4">
            <div class="space-y-1">
              <label class="text-sm font-medium"
                >Device Scale Factor (DPR)</label
              >
              <input
                v-model.number="form.deviceScaleFactor"
                type="number"
                min="1"
                max="3"
                step="0.25"
                class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium">Canvas Mode</label>
              <select
                v-model="form.canvasMode"
                class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="noise">Noise (recommended)</option>
                <option value="block">Block</option>
                <option value="off">Off</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium">CPU Threads</label>
              <input
                v-model.number="form.hardwareConcurrency"
                type="number"
                min="1"
                max="128"
                class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium">Device Memory (GB)</label>
              <input
                v-model.number="form.deviceMemory"
                type="number"
                min="1"
                max="128"
                class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div class="flex gap-6">
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input v-model="form.isMobile" type="checkbox" class="rounded" />
              isMobile
            </label>
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input v-model="form.hasTouch" type="checkbox" class="rounded" />
              hasTouch
            </label>
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium">WebGL Vendor</label>
            <input
              v-model="form.webglVendor"
              type="text"
              placeholder="e.g. Google Inc. (NVIDIA)"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium">WebGL Renderer</label>
            <input
              v-model="form.webglRenderer"
              type="text"
              placeholder="e.g. ANGLE (NVIDIA GeForce RTX 3060 ...)"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      <div class="flex justify-between gap-3">
        <button
          type="button"
          class="rounded-md border border-primary px-4 py-2 text-sm text-primary font-medium hover:bg-primary/10 flex items-center gap-2"
          @click="applyPresets"
        >
          <Icon icon="material-symbols:auto-fix-high" class="size-4" />
          Apply All Presets
        </button>
        <div class="flex gap-3">
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
      </div>
    </form>
  </div>
</template>

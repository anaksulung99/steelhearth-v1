<script lang="ts" setup>
import { useAppStore } from "@/stores/app.store"

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

const apiUrl = ref(appStore.apiUrl)
const email = ref(appStore.licenseSession?.user.email ?? "")
const license = ref(appStore.licenseKey)
const error = ref("")
const warning = ref("")

async function checkRuntimeRequirements() {
  if (!window.electronAPI?.checkRuntimeRequirements) return
  const result = await window.electronAPI.checkRuntimeRequirements()
  const messages: string[] = []

  if (!result.node.installed) {
    messages.push("Node.js belum terinstall atau belum tersedia di PATH.")
  }

  if (!result.playwright.installed) {
    messages.push("Playwright belum tersedia di aplikasi.")
  } else if (!result.playwright.allBrowsersInstalled) {
    const missing = Object.entries(result.playwright.browsers)
      .filter(([, installed]) => !installed)
      .map(([name]) => name)
      .join(", ")
    messages.push(`Playwright browsers belum lengkap: ${missing}. Jalankan playwright install terlebih dahulu.`)
  }

  warning.value = messages.join(" ")
}

async function connect() {
  error.value = ""
  appStore.apiUrl = apiUrl.value
  const ok = await appStore.checkConnection()
  if (!ok) {
    error.value = "Cannot connect to API server. Make sure the API is running."
    return
  }

  const activated = await appStore.activateLicense(email.value, license.value)
  if (activated) {
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/app"
    router.push(redirect)
  } else {
    error.value = "License activation failed."
  }
}

onMounted(async () => {
  await checkRuntimeRequirements()
  if (appStore.licenseSession) {
    const connected = await appStore.checkConnection()
    const valid = connected ? await appStore.validateLicense() : false
    if (valid) {
      const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/app"
      router.push(redirect)
    }
  }
})
</script>

<template>
  <div class="w-full max-w-md space-y-6">
    <div class="text-center space-y-1">
      <h1 class="text-2xl font-bold text-white">Activate License</h1>
      <p class="text-sm text-white/60">Use your registered email and license key to continue</p>
    </div>

    <form class="space-y-4" @submit.prevent="connect">
      <div class="space-y-2">
        <label class="text-sm font-medium text-white">API URL</label>
        <input
          v-model="apiUrl"
          type="text"
          placeholder="http://127.0.0.1:3741"
          class="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
        />
      </div>
      <div class="space-y-2">
        <label class="text-sm font-medium text-white">Email</label>
        <input
          v-model="email"
          type="email"
          required
          placeholder="dev@example.com"
          class="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
        />
      </div>
      <div class="space-y-2">
        <label class="text-sm font-medium text-white">License Key</label>
        <input
          v-model="license"
          type="password"
          required
          placeholder="Your license key"
          class="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
        />
      </div>

      <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
      <p v-if="warning" class="rounded-md border border-yellow-400/40 bg-yellow-400/10 px-3 py-2 text-sm text-yellow-200">
        {{ warning }}
      </p>

      <button
        type="submit"
        :disabled="appStore.connecting"
        class="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span v-if="appStore.connecting">Connecting...</span>
        <span v-else>Activate</span>
      </button>
    </form>
  </div>
</template>

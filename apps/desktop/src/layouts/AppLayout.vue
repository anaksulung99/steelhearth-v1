<script lang="ts" setup>
import { useWs } from "@/composables/useWs";
import { useCampaignStore } from "@/stores/campaign.store";
import { useProxyStore } from "@/stores/proxy.store";

const route = useRoute();
const currentTitle = computed(() => route.meta.title || "Aplikasi");

const ws = useWs();
const campaignStore = useCampaignStore();
const proxyStore = useProxyStore();

// ─── WS event handlers (named so we can off() them on unmount) ───────────────

// Campaign status
const onCampaignStarted = (d: any) =>
  campaignStore.patchStatus(d.campaignId, "ACTIVE");
const onCampaignPaused = (d: any) =>
  campaignStore.patchStatus(d.campaignId, "PAUSED");
const onCampaignStopped = (d: any) =>
  campaignStore.patchStatus(d.campaignId, "STOPPED");
const onCampaignCompleted = (d: any) =>
  campaignStore.patchStatus(d.campaignId, "COMPLETED");
const onCampaignFailed = (d: any) =>
  campaignStore.patchStatus(d.campaignId, "FAILED");

// Session progress
const onSessionProgress = (d: any) =>
  campaignStore.patchSessionProgress(d.sessionId, d.campaignId, d.progress);

// Proxy status
const onProxyActive = (d: any) =>
  proxyStore.patchProxy(d.proxyId, { status: "ACTIVE" });
const onProxyDead = (d: any) =>
  proxyStore.patchProxy(d.proxyId, { status: "DEAD" });
const onProxySlow = (d: any) =>
  proxyStore.patchProxy(d.proxyId, { status: "SLOW" });
const onProxyBlocked = (d: any) =>
  proxyStore.patchProxy(d.proxyId, { status: "BLOCKED" });

onMounted(() => {
  ws.connect();

  ws.on("campaign.started", onCampaignStarted);
  ws.on("campaign.paused", onCampaignPaused);
  ws.on("campaign.stopped", onCampaignStopped);
  ws.on("campaign.completed", onCampaignCompleted);
  ws.on("campaign.failed", onCampaignFailed);

  ws.on("session.progress", onSessionProgress);

  ws.on("proxy.active", onProxyActive);
  ws.on("proxy.dead", onProxyDead);
  ws.on("proxy.slow", onProxySlow);
  ws.on("proxy.blocked", onProxyBlocked);
});

onUnmounted(() => {
  ws.off("campaign.started", onCampaignStarted);
  ws.off("campaign.paused", onCampaignPaused);
  ws.off("campaign.stopped", onCampaignStopped);
  ws.off("campaign.completed", onCampaignCompleted);
  ws.off("campaign.failed", onCampaignFailed);

  ws.off("session.progress", onSessionProgress);

  ws.off("proxy.active", onProxyActive);
  ws.off("proxy.dead", onProxyDead);
  ws.off("proxy.slow", onProxySlow);
  ws.off("proxy.blocked", onProxyBlocked);

  ws.disconnect();
});
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header
        class="sticky top-0 flex h-12 z-999 shrink-0 items-center gap-2 border-b-2 border-neutral-300 dark:border-neutral-800 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-background"
      >
        <div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger class="-ml-1" />
          <Separator
            orientation="vertical"
            class="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem class="hidden md:block">
                <BreadcrumbLink href="#" class="text-primary">
                  {{ currentTitle }}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div class="ml-auto flex items-center gap-3">
            <!-- WS status indicator -->
            <span
              class="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
              :title="
                ws.connected.value
                  ? 'Real-time connected'
                  : 'Real-time disconnected'
              "
            >
              <span
                class="size-2 rounded-full"
                :class="
                  ws.connected.value
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-muted-foreground/40'
                "
              />
            </span>
            <MusicControl />
          </div>
        </div>
      </header>
      <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div class="flex h-screen w-full flex-col">
          <div class="mx-auto h-full w-full flex-1 overflow-y-auto">
            <router-view />
          </div>
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

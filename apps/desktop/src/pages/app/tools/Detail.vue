<script lang="ts" setup>
const router = useRouter();
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center gap-3">
      <button class="p-1 rounded hover:bg-muted" @click="router.back()">
        <span class="sr-only">Back</span>
        ←
      </button>
      <h1 class="text-2xl font-bold">Tool Detail</h1>
    </div>
    <div
      class="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground"
    >
      Coming soon
    </div>
  </div>
</template>

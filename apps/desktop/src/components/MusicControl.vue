<script lang="ts" setup>
import { Icon } from "@iconify/vue";

const {
  isPlaying,
  currentTrack,
  volume,
  isMuted,
  playlist,
  currentTimeFormatted,
  durationFormatted,
  progressPercent,
  togglePlay,
  setVolume,
  toggleMute,
  playNext,
  playPrevious,
  setTrack,
  seek,
  audioReady,
} = useBackgroundMusic();

const showPanel = ref(false);
let closeTimeout: any = null;

const handleMouseEnter = () => {
  if (closeTimeout) {
    clearTimeout(closeTimeout);
    closeTimeout = null;
  }
  showPanel.value = true;
};

const handleMouseLeave = () => {
  closeTimeout = setTimeout(() => {
    showPanel.value = false;
  }, 300);
};

const volumeInput = ref<number>(volume.value * 100);

const handleSeek = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const percent = (x / rect.width) * 100;
  seek(percent);
};

const handlePlayFromPanel = async () => {
  await togglePlay();
};
const handleSetTrack = async (track: any) => {
  await setTrack(track);
};

watch(volumeInput, (newVal) => {
  const val = (newVal ?? 0) / 100;
  if (volume.value !== val) {
    setVolume(val);
  }
});

watch(volume, (newVal) => {
  const val100 = Math.round(newVal * 100);
  if (volumeInput.value !== val100) {
    volumeInput.value = val100;
  }
});
</script>

<template>
  <div
    class="music-control relative"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Main Control Button -->
    <button
      class="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 transition-all duration-200 group cursor-pointer active:scale-95"
      :title="isPlaying ? 'Pause music' : 'Play music'"
      @click="togglePlay"
    >
      <div
        v-if="!audioReady"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div
          class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
        />
      </div>
      <!-- Audio Visualizer (when playing) -->
      <div
        v-else-if="isPlaying"
        class="absolute inset-0 flex items-center justify-center gap-0.5"
      >
        <span class="audio-bar" style="animation-delay: 0s"></span>
        <span class="audio-bar" style="animation-delay: 0.2s"></span>
        <span class="audio-bar" style="animation-delay: 0.4s"></span>
        <span class="audio-bar" style="animation-delay: 0.6s"></span>
        <span class="audio-bar" style="animation-delay: 0.8s"></span>
      </div>

      <!-- Icon -->
      <Icon
        :icon="
          isPlaying
            ? 'material-symbols:pause-rounded'
            : 'material-symbols:play-arrow'
        "
        class="size-4 text-red-700 dark:text-red-600 relative z-10"
      />
    </button>

    <!-- Dropdown Panel -->
    <div
      v-if="showPanel"
      class="absolute z-9999 right-0 top-10 w-80 bg-popover rounded-lg shadow-lg border border-border p-4"
    >
      <!-- Current Track Info -->
      <div class="flex items-center gap-3 mb-4">
        <div
          class="w-12 h-12 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center"
        >
          <Icon icon="heroicons:musical-note" class="w-6 h-6 text-primary" />
        </div>
        <div class="flex-1 min-w-0 overflow-hidden relative">
          <p class="text-sm font-medium whitespace-nowrap animate-marquee">
            {{ currentTrack?.title || "No track" }}
          </p>
          <p
            class="text-xs text-red-700 dark:text-red-600 whitespace-nowrap animate-pulse font-medium"
          >
            {{ currentTrack?.artist || "Unknown" }}
          </p>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="space-y-2 mb-4">
        <div
          class="relative h-1 bg-secondary rounded-full cursor-pointer group"
          @click="handleSeek"
        >
          <div
            class="absolute h-full bg-red-700 dark:bg-red-600 rounded-full transition-all"
            :style="{ width: `${progressPercent}%` }"
          />
          <div
            class="absolute w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            :style="{ left: `calc(${progressPercent}% - 6px)`, top: '-4px' }"
          />
        </div>
        <div class="flex justify-between text-xs text-muted-foreground">
          <span>{{ currentTimeFormatted }}</span>
          <span>{{ durationFormatted }}</span>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex items-center justify-center gap-4 mb-4">
        <button
          class="p-2 rounded-full bg-red-700 dark:bg-red-600 text-white hover:bg-red-700/80 transition-colors cursor-pointer active:scale-95"
          title="Previous"
          @click="playPrevious"
        >
          <Icon icon="heroicons:backward" class="w-4 h-4" />
        </button>

        <button
          class="p-3 rounded-full bg-red-700 dark:bg-red-600 text-white hover:bg-red-700/80 transition-colors cursor-pointer active:scale-95"
          :title="isPlaying ? 'Pause' : 'Play'"
          @click="handlePlayFromPanel"
        >
          <Icon
            :icon="isPlaying ? 'heroicons:pause' : 'heroicons:play'"
            class="w-5 h-5"
          />
        </button>

        <button
          class="p-2 rounded-full bg-red-700 dark:bg-red-600 text-white hover:bg-red-700/80 transition-colors cursor-pointer active:scale-95"
          title="Next"
          @click="playNext"
        >
          <Icon icon="heroicons:forward" class="w-4 h-4" />
        </button>
      </div>

      <!-- Volume Control -->
      <div class="flex items-center gap-2 pt-3 border-t border-border">
        <button
          class="p-1 hover:text-primary transition-colors cursor-pointer"
          title="Volume"
          @click="toggleMute"
        >
          <Icon
            :icon="
              isMuted || volume === 0
                ? 'heroicons:speaker-x-mark'
                : 'heroicons:speaker-wave'
            "
            class="w-4 h-4"
          />
        </button>
        <input
          v-model="volumeInput"
          type="range"
          min="0"
          max="100"
          class="custom-slider w-full h-1.5 rounded-lg appearance-none cursor-pointer"
          :style="{
            background: `linear-gradient(to right, #b91c1c 0%, #b91c1c ${volumeInput}%, #e5e5e5 ${volumeInput}%, #e5e5e5 100%)`,
          }"
        />
        <p class="text-xs text-muted-foreground">{{ volumeInput }}%</p>
      </div>

      <!-- Playlist -->
      <div class="mt-3 pt-3 border-t border-border">
        <p class="text-xs font-medium text-muted-foreground mb-2">Playlist</p>
        <div class="space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
          <button
            v-for="track in playlist"
            :key="track.id"
            class="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-secondary transition-colors flex items-center gap-2 cursor-pointer"
            :class="{
              'bg-primary/10 text-red-700 dark:text-red-600':
                currentTrack?.id === track.id,
            }"
            @click="handleSetTrack(track)"
          >
            <Icon
              :icon="
                currentTrack?.id === track.id && isPlaying
                  ? 'heroicons:play-circle'
                  : 'heroicons:musical-note'
              "
              class="w-4 h-4"
            />
            <span class="flex-1 truncate">{{ track.title }}</span>
            <span class="text-xs text-muted-foreground">{{
              track.artist
            }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "../style.css"

.audio-bar {
  @apply w-0.5 bg-primary rounded-full;
  height: 8px;
  animation: audio-wave 1.2s ease infinite;
  transform-origin: center;
}

@keyframes audio-wave {
  0%,
  100% {
    height: 8px;
  }
  50% {
    height: 20px;
  }
}

.custom-slider {
  -webkit-appearance: none;
  appearance: none;
  outline: none;
}
:deep(.dark) .custom-slider,
.dark .custom-slider {
  --bg-unfilled: #404040; /* Sisi kanan saat dark mode (neutral-700) */
}
.custom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #b91c1c; /* Warna merah (Red-700) */
  cursor: pointer;
  transition: transform 0.1s ease;
}

.custom-slider::-webkit-slider-thumb:active {
  transform: scale(1.2);
}
.custom-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border: 0;
  border-radius: 50%;
  background-color: #b91c1c;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.custom-slider::-moz-range-thumb:active {
  transform: scale(1.2);
}
</style>

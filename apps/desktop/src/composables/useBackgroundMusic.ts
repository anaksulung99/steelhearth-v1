import { Howl } from 'howler';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  fileName: string;
  volume?: number;
}

export const useBackgroundMusic = () => {
  const isPlaying = ref(false);
  const currentTrack = ref<MusicTrack | null>(null);
  const volume = ref(0.3);
  const isMuted = ref(false);
  const previousVolume = ref(0.3);
  const sound = ref<Howl | null>(null);
  const currentTime = ref(0);
  const duration = ref(0);
  const isLoaded = ref(false);
  const isElectron = ref(false);
  const audioReady = ref(false);

  const playlist = ref<MusicTrack[]>([
    {
      id: '1',
      title: 'She\'s Gone',
      artist: 'Steelheart',
      fileName: 'shes-gone.mp3',
    },
    {
      id: '2',
      title: 'Sweet Child of Mine',
      artist: 'Gun N\' Roses',
      fileName: 'gnr-sweet-child-o-mine.mp3',
    },
    {
      id: '3',
      title: 'Welcome To The Jungle',
      artist: 'Gun N\' Roses',
      fileName: 'gnr-welcome-to-the-jungle.mp3',
    },
    {
      id: '4',
      title: 'Seize the Day',
      artist: 'Avenged Sevenfold',
      fileName: 'a7x-seize-the-day.mp3',
    },
    {
      id: '5',
      title: 'Dear God',
      artist: 'Avenged Sevenfold',
      fileName: 'a7x-dear-god.mp3',
    },
    {
      id: '6',
      title: 'Rock and Rol',
      artist: 'Led Zeppelin',
      fileName: 'lz-rock-n-roll.mp3',
    },
    {
      id: '7',
      title: 'It\'s My Life',
      artist: 'Bon Jovi',
      fileName: 'bj-Its-my-life.mp3',
    },
   {
      id: '8',
      title: 'Highway to Hell',
      artist: 'AC/DC',
      fileName: 'acdc-highway-to-hell.mp3',
    },
    {
      id: '9',
      title: 'Smoke On the Water',
      artist: 'Deep Purple',
      fileName: 'deep-purple-smoke-on-the-water.mp3',
    },
    {
      id: '10',
      title: 'Still Loving You',
      artist: 'Scorpions',
      fileName: 'scorpions-still-lovin-you.mp3',
    },
  ]);

  const currentTrackIndex = ref(0);


  const getAudioUrl = async (fileName: string): Promise<string> => {
    if (window.electronAPI?.isElectron) {
      if (window.electronAPI.getAudioUrl) {
        return window.electronAPI.getAudioUrl(fileName);
      }

      return `local://music/${fileName}?t=${Date.now()}`;
    }

    return `/music/${fileName}`;
  };
  const testAudioConnection = async (fileName: string): Promise<boolean> => {
    if (window.electronAPI?.testLocalFile) {
      return await window.electronAPI.testLocalFile(`music/${fileName}`);
    }
    return false;
  };

  const initTrack = async (track: MusicTrack) => {
    if (sound.value) {
      sound.value.unload();
    }

    const audioUrl = await getAudioUrl(track.fileName);

    if (window.electronAPI?.isElectron) {
      const exists = await testAudioConnection(track.fileName);
      if (!exists) {
        console.error(`Audio file not accessible: ${track.fileName}`);
        return;
      }
    }

    sound.value = new Howl({
      src: [audioUrl],
      volume: isMuted.value ? 0 : volume.value,
      loop: true,
      autoplay: false,
      html5: false,
      onload: () => {
        isLoaded.value = true;
        duration.value = sound.value?.duration() || 0;
        audioReady.value = true;
      },
      onloaderror: (id, error) => {
        console.error(`Failed to load audio: ${track.fileName}`, error);
        audioReady.value = false;
      },
      onplay: () => {
        isPlaying.value = true;
        console.log('Howler onplay event triggered successfully!');
        requestAnimationFrame(updateTime);
      },
      onpause: () => {
        isPlaying.value = false;
        console.log('Howler onpause event triggered');
      },
      onend: () => {
        console.log('Howler track finished playing');
        playNext();
      },
      onstop: () => {
        isPlaying.value = false;
        console.log('Howler onstop event triggered');
      },
    });
  };

  const updateTime = () => {
    if (sound.value && isPlaying.value) {
      currentTime.value = sound.value.seek() as number;
      requestAnimationFrame(updateTime);
    }
  };

  const play = async () => {
    console.log('play() method called. Sound loaded:', !!sound.value);
    if (!sound.value && currentTrack.value) {
      await initTrack(currentTrack.value);
    }

    if (sound.value) {
      try {
        const playId = sound.value.play();
        console.log('Howl.play() executed, play ID returned:', playId);
        isPlaying.value = true;
      } catch (err) {
        console.error('Error during Howl.play():', err);
      }
    }
  };

  const pause = () => {
    if (sound.value) {
      sound.value.pause();
      isPlaying.value = false;
    }
  };

  const togglePlay = async () => {
    if (isPlaying.value) {
      pause();
    } else {
      await play();
    }
  };

  const stop = () => {
    if (sound.value) {
      sound.value.stop();
      isPlaying.value = false;
      currentTime.value = 0;
    }
  };

  const setVolume = (vol: number) => {
    volume.value = Math.max(0, Math.min(1, vol));
    if (sound.value) {
      sound.value.volume(isMuted.value ? 0 : volume.value);
    }
  };

  const toggleMute = () => {
    if (isMuted.value) {
      isMuted.value = false;
      setVolume(previousVolume.value);
    } else {
      previousVolume.value = volume.value;
      isMuted.value = true;
      setVolume(0);
    }
  };

  const playNext = async () => {
    currentTrackIndex.value = (currentTrackIndex.value + 1) % playlist.value.length;
    await setTrack(playlist.value[currentTrackIndex.value]);
    await play();
  };

  const playPrevious = async () => {
    currentTrackIndex.value = (currentTrackIndex.value - 1 + playlist.value.length) % playlist.value.length;
    await setTrack(playlist.value[currentTrackIndex.value]);
    await play();
  };

  const setTrack = async (track: MusicTrack) => {
    currentTrack.value = track;
    await initTrack(track);
    if (isPlaying.value) {
      await play();
    }
  };


  onMounted(async () => {
    isElectron.value = !!window.electronAPI?.isElectron;
    currentTrack.value = playlist.value[0];
    await initTrack(currentTrack.value);
  });

  onUnmounted(() => {
    if (sound.value) {
      sound.value.unload();
    }
  });

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTimeFormatted = computed(() => formatTime(currentTime.value));
  const durationFormatted = computed(() => formatTime(duration.value));
  const progressPercent = computed(() => {
    if (duration.value === 0) return 0;
    return (currentTime.value / duration.value) * 100;
  });

  const seek = (percent: number) => {
    if (sound.value && duration.value) {
      const seekTime = (percent / 100) * duration.value;
      sound.value.seek(seekTime);
      currentTime.value = seekTime;
    }
  };

  return {
    // State
    isPlaying,
    currentTrack,
    volume,
    isMuted,
    playlist,
    currentTime,
    duration,
    isLoaded,
    audioReady,
    currentTimeFormatted,
    durationFormatted,
    progressPercent,
    // Methods
    play,
    pause,
    togglePlay,
    stop,
    setVolume,
    toggleMute,
    playNext,
    playPrevious,
    setTrack,
    seek,
  };
};
import { contextBridge, ipcRenderer, net } from "electron";

type NetworkInterfaces = NodeJS.Dict<import("os").NetworkInterfaceInfo[]>;

interface ElectronAPI {
  checkConnection: () => boolean;
  getNetworkInfo: () => Promise<{
    online: boolean;
    interfaces: NetworkInterfaces;
  }>;
  send: (channel: string, data?: unknown) => void;
  receive: (channel: string, func: (...args: unknown[]) => void) => void;
  invoke: (channel: string, data?: unknown) => Promise<unknown>;
  removeListener: (channel: string, func: (...args: unknown[]) => void) => void;
  on: (...args: Parameters<typeof ipcRenderer.on>) => void;
  off: (...args: Parameters<typeof ipcRenderer.off>) => void;
  getResourcePath: (relativePath: string) => Promise<string>;
  getDeviceInfo: () => Promise<{ deviceId: string; deviceName: string }>;
  checkRuntimeRequirements: () => Promise<{
    node: { installed: boolean; version?: string; message?: string };
    playwright: {
      installed: boolean;
      browsers: { chromium: boolean; firefox: boolean; webkit: boolean };
      allBrowsersInstalled: boolean;
      message?: string;
    };
  }>;
  isElectron: boolean;
  testLocalFile: (filePath: string) => Promise<boolean>
  getAudioUrl: (fileName: string) => string
  getSidecarStatus: () => Promise<{ redis: boolean; api: boolean; worker: boolean }>
}

const electronAPI: ElectronAPI = {
  isElectron: true,
  // Network API
  checkConnection: (): boolean => net.isOnline(),

  getNetworkInfo: async (): Promise<{
    online: boolean;
    interfaces: NetworkInterfaces;
  }> => {
    let interfaces: NetworkInterfaces = {};

    try {
      const os = await import("node:os");
      interfaces = os.networkInterfaces();
    } catch {
      interfaces = {};
    }

    return {
      online: net.isOnline(),
      interfaces,
    };
  },

  // IPC Communication
  send: (channel: string, data?: unknown): void => {
    const validChannels = ["toMain", "window-control"];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  receive: (channel: string, func: (...args: unknown[]) => void): void => {
    const validChannels = ["fromMain", "update-available"];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => func(...args));
    }
  },

  invoke: (channel: string, data?: unknown): Promise<unknown> => {
    const validChannels = [
      "dialog",
      "file-system",
      "proxy-checker",
      "proxy-scraper",
      "fingerprint-tools",
      "campaign-queue",
      "campaign-scheduler",
      "campaign-recovery",
      "campaign-reconciliation",
      "get-resource-path"
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    return Promise.reject(new Error(`Invalid channel: ${channel}`));
  },

  removeListener: (
    channel: string,
    func: (...args: unknown[]) => void
  ): void => {
    ipcRenderer.removeListener(channel, func);
  },

  on: (...args: Parameters<typeof ipcRenderer.on>): void => {
    const [channel, listener] = args;
    ipcRenderer.on(channel, (event, ...listenerArgs) =>
      listener(event, ...listenerArgs)
    );
  },

  off: (...args: Parameters<typeof ipcRenderer.off>): void => {
    const [channel, ...omit] = args;
    ipcRenderer.off(channel, ...omit);
  },

  getResourcePath: async (relativePath: string): Promise<string> => {
    return await ipcRenderer.invoke('get-resource-path', relativePath);
  },

  getDeviceInfo: async (): Promise<{ deviceId: string; deviceName: string }> => {
    return await ipcRenderer.invoke('get-device-info');
  },

  checkRuntimeRequirements: async () => {
    return await ipcRenderer.invoke('check-runtime-requirements');
  },

  testLocalFile: async (filePath: string): Promise<boolean> => {
    try {
      const response = await fetch(`local://${filePath}`);
      return response.ok;
    } catch {
      return false;
    }
  },
  getAudioUrl: (fileName: string): string => {
    return `local://music/${fileName}?t=${Date.now()}`;
  },

  getSidecarStatus: async () => {
    return await ipcRenderer.invoke('get-sidecar-status')
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

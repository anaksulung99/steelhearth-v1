import type { UserRole } from "@tb/shared"

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }

  interface ElectronAPI {
    checkConnection: () => boolean;
    getNetworkInfo: () => Promise<{
      online: boolean;
      interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]>;
    }>;
    send: (channel: string, data?: any) => void;
    receive: (channel: string, func: (...args: any[]) => void) => void;
    invoke: (channel: string, data?: any) => Promise<any>;
    removeListener: (channel: string, func: (...args: any[]) => void) => void;
    on: (
      channel: string,
      listener: (event: unknown, ...args: unknown[]) => void,
    ) => void;
    off: (
      channel: string,
      listener: (event: unknown, ...args: unknown[]) => void,
    ) => void;
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
  }
  interface RetryOptions {
    maxRetries?: number;
    delayMs?: number;
    backoffMultiplier?: number;
  }
  interface NetworkInfo {
    online: boolean;
    type: "connected" | "disconnected" | "unknown";
    timestamp: string;
    networkInterfaces?: Array<{
      name: string;
      address: string;
      mac: string;
    }>;
  }

  interface AppNavMain {
    title: string;
    url: string;
    icon?: string;
    isActive?: boolean;
    roles?: UserRole[];
    children?: {
      title: string;
      url: string;
    }[];
  }
  interface PaginateMeta {
    total: number;
    page: number;
    limit: number;
    offset: number;
    totalPages: number;
    has_more: boolean;
  }
  interface ProxyStats {
    active: number
    total: number
    inactive: number
    testing: number
    banned: number
    error: number
    avg_response_time: number
  }
  interface BulkCreateProxyResult {
    success: number
    failed: number
    total: number
    errors: Array<{ proxy: string; error: string }>
  }
}

export { };

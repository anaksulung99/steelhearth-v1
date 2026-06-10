import { app, BrowserWindow, ipcMain, shell, nativeImage, protocol } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import { execFile } from 'node:child_process'

createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
const isDev = Boolean(VITE_DEV_SERVER_URL)

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

// Vite dev server does not use a production CSP, so Electron shows a noisy
// warning in development. Keep production warnings intact.
if (isDev) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
}

const devAppDataRoot = path.join(process.env.APP_ROOT, '.electron')
const appDataRoot = VITE_DEV_SERVER_URL
  ? devAppDataRoot
  : process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, app.getName())
    : path.join(app.getPath('temp'), app.getName())
const sessionDataRoot = path.join(appDataRoot, 'session')
const logsRoot = path.join(appDataRoot, 'logs')

fs.mkdirSync(appDataRoot, { recursive: true })
fs.mkdirSync(sessionDataRoot, { recursive: true })
fs.mkdirSync(logsRoot, { recursive: true })

app.setPath('userData', appDataRoot)
app.setPath('sessionData', sessionDataRoot)
app.setPath('logs', logsRoot)

let win: BrowserWindow | null

function isSafeExternalUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol)
  } catch {
    return false
  }
}
const iconPath = path.join(process.env.VITE_PUBLIC, 'logo.png')
const appIcon = nativeImage.createFromPath(iconPath);


ipcMain.handle('get-resource-path', async (_event, relativePath: string) => {
  return getResourcePath(relativePath);
});

ipcMain.handle('get-device-info', async () => {
  const deviceFile = path.join(appDataRoot, 'device.json')
  const base = [
    os.hostname(),
    os.platform(),
    os.arch(),
    os.cpus()?.[0]?.model ?? '',
    os.userInfo().username,
  ].join('|')

  let salt = ''
  try {
    const existing = JSON.parse(fs.readFileSync(deviceFile, 'utf8')) as { salt?: string }
    salt = existing.salt ?? ''
  } catch {
    salt = crypto.randomBytes(16).toString('hex')
    fs.writeFileSync(deviceFile, JSON.stringify({ salt }, null, 2))
  }

  return {
    deviceId: crypto.createHash('sha256').update(`${base}|${salt}`).digest('hex'),
    deviceName: `${os.hostname()} (${os.platform()} ${os.arch()})`,
  }
})

ipcMain.handle('check-runtime-requirements', async () => {
  const node = await new Promise<{ installed: boolean; version?: string; message?: string }>((resolve) => {
    execFile('node', ['--version'], { windowsHide: true, timeout: 5000 }, (error, stdout) => {
      if (error) {
        resolve({ installed: false, message: 'Node.js is not available in PATH.' })
        return
      }
      resolve({ installed: true, version: stdout.trim() })
    })
  })

  const browsers = {
    chromium: false,
    firefox: false,
    webkit: false,
  }
  let playwrightInstalled = false
  let playwrightMessage: string | undefined

  try {
    const pw = await import('playwright')
    playwrightInstalled = true
    browsers.chromium = fs.existsSync(pw.chromium.executablePath())
    browsers.firefox = fs.existsSync(pw.firefox.executablePath())
    browsers.webkit = fs.existsSync(pw.webkit.executablePath())
  } catch (error) {
    playwrightMessage = error instanceof Error ? error.message : String(error)
  }

  return {
    node,
    playwright: {
      installed: playwrightInstalled,
      browsers,
      allBrowsersInstalled: browsers.chromium && browsers.firefox && browsers.webkit,
      message: playwrightMessage,
    },
  }
})



function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: appIcon,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: false,
      webSecurity: true,
      webviewTag: false,
      devTools: isDev,
      autoplayPolicy: 'no-user-gesture-required',
    },
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) {
      void shell.openExternal(url)
    }

    return { action: 'deny' }
  })

  win.webContents.session.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      const allowedPermissions = ['media', 'autoplay', 'notifications'];
      if (allowedPermissions.includes(permission)) {
        callback(true);
      } else {
        callback(false);
      }
    }
  );

  win.webContents.on('will-attach-webview', (event) => {
    event.preventDefault()
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
    win?.webContents.executeJavaScript(`
      // Enable AudioContext for Howler
      if (typeof AudioContext !== 'undefined') {
        const audioContext = new AudioContext();
        audioContext.resume().then(() => {
          console.log('AudioContext resumed for background music');
        });
      }
      // Notify renderer that app is ready
      window.dispatchEvent(new CustomEvent('electron-ready'));
    `);
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})



protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      allowServiceWorkers: true,
    },
  },
]);
const getResourcePath = (relativePath: string) => {
  if (isDev) {
    const possiblePaths = [
      path.join(process.env.APP_ROOT, 'resources', relativePath),
      path.join(process.env.APP_ROOT, 'public', relativePath),
      path.join(process.env.APP_ROOT, 'dist', relativePath),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    return path.join(process.env.APP_ROOT, 'resources', relativePath);
  } else {
    // 1. Try process.resourcesPath/resources/relativePath (matching extraResources 'to: resources' configuration)
    const externalPathWithExtra = path.join(process.resourcesPath, 'resources', relativePath);
    if (fs.existsSync(externalPathWithExtra)) {
      return externalPathWithExtra;
    }

    // 2. Try process.resourcesPath/relativePath
    const externalPath = path.join(process.resourcesPath, relativePath);
    if (fs.existsSync(externalPath)) {
      return externalPath;
    }

    // 3. Fallback: Check inside the packed ASAR's dist directory
    return path.join(app.getAppPath(), 'dist', relativePath);
  }
};
const logToFile = (msg: string) => {
  try {
    const logFilePath = path.join(logsRoot, 'audio-debug.log');
    fs.appendFileSync(logFilePath, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (err) {
    // Ignore
  }
};

const serveLocalFile = async (request: Request): Promise<Response> => {
  logToFile(`serveLocalFile: Request URL = ${request.url}`);
  const url = new URL(request.url);
  // Reconstruct path including the host/authority part (e.g., "music") as custom protocol hostname is treated as part of the path
  let filePath = decodeURIComponent(url.host + url.pathname);

  if (filePath.startsWith('/')) {
    filePath = filePath.slice(1);
  }

  // Prevent directory traversal
  const safePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = getResourcePath(safePath);
  logToFile(`serveLocalFile: filePath = ${filePath}, safePath = ${safePath}, fullPath = ${fullPath}`);

  if (!fs.existsSync(fullPath)) {
    logToFile(`serveLocalFile: FILE NOT FOUND at = ${fullPath}`);
    return new Response(`File not found: ${filePath}`, { status: 404 });
  }

  // Determine content type
  const ext = path.extname(fullPath).toLowerCase();
  const contentType: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.json': 'application/json',
  };

  try {
    const fileBuffer = await fs.promises.readFile(fullPath);
    logToFile(`serveLocalFile: Successfully read file: ${fullPath} (${fileBuffer.length} bytes)`);
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType[ext] || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    logToFile(`serveLocalFile: ERROR reading file: ${error?.message || error}`);
    return new Response('Internal server error', { status: 500 });
  }
};
app.whenReady().then(async () => {
  protocol.handle('local', serveLocalFile);
  createWindow()
})

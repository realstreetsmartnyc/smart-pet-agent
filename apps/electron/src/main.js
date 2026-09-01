// Smart-Pet-Agent — Electron Main Process
// apps/electron/src/main.js
// Creates 3 windows (pet overlay + bubble + chat) matching PetClaw template,
// wired to our agent-loop instead of OpenClaw gateway.

const { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, screen } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

// Agent loop bridge (spawns our core agent as child process)
let agentProcess = null;
let agentReady = false;
const agentListeners = [];
let agentStdoutBuffer = '';
const agentSendBuffer = [];  // buffers messages sent before agent.ready
let runtimeStatus = { state: 'starting', summary: 'Smart Pet Agent runtime is starting' };

// Window references
let petWindow = null;
let bubbleWindow = null;
let chatWindow = null;
let tray = null;

// Pet state
let petState = {
  animState: 'static',
  visible: true,
  displayId: null,
  bounds: null,
  layout: store.get('petWindowLayout', { widthRatio: 0.18, heightRatio: 0.22, marginRight: 20, marginBottom: 20 }),
  pinned: false,
};

// ─── Agent Bridge ────────────────────────────────────────────────────────────

function startAgent() {
  // Development uses the workspace TypeScript runner; packaged builds use the bundled runtime.
  try {
    const { spawn } = require('child_process');
    const packaged = app.isPackaged;
    const agentEntry = packaged
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'src', 'agent-runtime.mjs')
      : path.join(__dirname, '../../../packages/core/src/index.ts');
    const rootDir = path.join(__dirname, '../../..');
    const args = packaged ? [agentEntry] : ['--import', 'tsx', agentEntry];
    agentProcess = spawn(process.execPath, args, {
      cwd: packaged ? path.dirname(agentEntry) : rootDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: packaged ? 'production' : 'development', ...(packaged ? { ELECTRON_RUN_AS_NODE: '1' } : {}) },
    });

    agentProcess.stdout.on('data', (data) => {
      agentStdoutBuffer += data.toString();
      const lines = agentStdoutBuffer.split('\n');
      agentStdoutBuffer = lines.pop() || '';
      for (const line of lines) {
        handleAgentStdoutLine(line);
      }
    });

    agentProcess.stderr.on('data', (data) => {
      console.error('[Agent ERR]', data.toString());
    });

    agentProcess.on('close', (code) => {
      console.log('[Agent] exited with code', code);
      agentReady = false;
      runtimeStatus = { state: 'error', summary: `Runtime stopped with code ${code}` };
      broadcastRuntimeEvent({
        version: 1,
        event: 'agent.status',
        timestamp: Date.now(),
        payload: runtimeStatus,
      });
      broadcastGatewayStatus();
    });
    agentProcess.on('error', (err) => {
      appendLog('error', 'agent process error', { message: err.message });
      console.error('[Agent] process error:', err);
    });
  } catch (err) {
    console.error('Failed to start agent:', err);
  }
}

function sendToAgent(message) {
  if (!agentProcess) {
    console.warn('[AgentBridge] sendToAgent: no process, buffer for flush');
    agentSendBuffer.push(message);
    return;
  }
  if (agentReady) {
    agentProcess.stdin.write(JSON.stringify(message) + '\n');
  } else {
    // Agent not ready yet — buffer and flush when agent.ready arrives
    // (see routeRuntimeEvent). Avoids dropping user messages sent at startup.
    agentSendBuffer.push(message);
  }
}

function handleAgentStdoutLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return;

  let event;
  try {
    event = JSON.parse(trimmed);
  } catch {
    console.log('[Agent]', trimmed);
    return;
  }

  if (!event || !event.event) {
    console.log('[Agent]', trimmed);
    return;
  }

  routeRuntimeEvent(event);
}

function routeRuntimeEvent(event) {
  if (event.event === 'agent.ready') {
    agentReady = true;
    appendLog('info', 'agent ready', { packaged: app.isPackaged });
    runtimeStatus = {
      state: 'ready',
      summary: event.payload?.summary || 'Ready on your desktop',
    };
    // Flush any messages buffered before the agent was ready
    while (agentSendBuffer.length > 0) {
      const buffered = agentSendBuffer.shift();
      agentProcess.stdin.write(JSON.stringify(buffered) + '\n');
    }
    agentListeners.forEach((fn) => fn(event));
  } else if (event.event === 'agent.status') {
    runtimeStatus = {
      state: event.payload?.state || 'starting',
      summary: event.payload?.summary || '',
    };
  } else if (event.event === 'pet.intent') {
    petState.animState = event.payload?.animation || petState.animState;
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.webContents.send('anim-state', petState.animState);
    }
    if (bubbleWindow && !bubbleWindow.isDestroyed()) {
      bubbleWindow.webContents.send('anim-state', petState.animState);
    }
  } else if (event.event === 'chat.chunk') {
    const chunk = event.payload?.text || '';
    if (bubbleWindow && !bubbleWindow.isDestroyed()) {
      bubbleWindow.webContents.send('ai-chunk', chunk, 'agent:main:main');
      bubbleWindow.showInactive();
      positionBubble();
    }
    if (chatWindow && !chatWindow.isDestroyed()) {
      chatWindow.webContents.send('ai-chunk', chunk, 'agent:main:main');
    }
    runtimeStatus = { state: 'busy', summary: 'Working on your request' };
  } else if (event.event === 'chat.done') {
    if (bubbleWindow && !bubbleWindow.isDestroyed()) {
      bubbleWindow.webContents.send('ai-done', event.payload || { ok: true });
    }
    if (chatWindow && !chatWindow.isDestroyed()) {
      chatWindow.webContents.send('ai-done', event.payload || { ok: true });
    }
    runtimeStatus = { state: 'ready', summary: 'Ready on your desktop' };
  } else if (event.event === 'chat.error') {
    if (chatWindow && !chatWindow.isDestroyed()) {
      chatWindow.webContents.send('ai-error', event.payload?.message || 'Unknown error', 'agent:main:main');
    }
    runtimeStatus = { state: 'error', summary: event.payload?.message || 'Runtime error' };
  } else if (event.event === 'permission.updated') {
    if (event.payload?.permission) {
      const cached = store.get('permissionCache', []);
      const next = Array.isArray(cached)
        ? [...cached.filter((item) => item.device !== event.payload.permission.device), event.payload.permission]
        : [event.payload.permission];
      store.set('permissionCache', next);
    } else if (Array.isArray(event.payload?.permissions)) {
      store.set('permissionCache', event.payload.permissions);
    }
    agentListeners.forEach((fn) => fn(event));
  } else if (event.event === 'task.started' || event.event === 'task.completed' || event.event === 'task.failed' || event.event === 'task.list') {
    agentListeners.forEach((fn) => fn(event));
  } else if (event.event === 'audit.list' || event.event === 'provider.list' || event.event === 'provider.saved' || event.event === 'chat.history') {
    agentListeners.forEach((fn) => fn(event));
  }

  broadcastRuntimeEvent(event);
  broadcastGatewayStatus();
}

function broadcastRuntimeEvent(event) {
  const windows = [petWindow, bubbleWindow, chatWindow].filter(Boolean);
  for (const win of windows) {
    if (win && !win.isDestroyed()) {
      win.webContents.send('runtime-event', event);
    }
  }
}

function broadcastGatewayStatus() {
  const status = {
    connected: agentReady,
    state: runtimeStatus.state,
    summary: runtimeStatus.summary,
  };
  const windows = [petWindow, bubbleWindow, chatWindow].filter(Boolean);
  for (const win of windows) {
    if (win && !win.isDestroyed()) {
      win.webContents.send('gateway-status', status);
    }
  }
}

// ─── Pet Window (Overlay) ──────────────────────────────────────────────────

function createPetWindow() {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workArea;
  const layout = petState.layout;

  const w = Math.round(width * layout.widthRatio);
  const h = Math.round(height * layout.heightRatio);

  petWindow = new BrowserWindow({
    width: w,
    height: h,
    x: width - w - layout.marginRight,
    y: height - h - layout.marginBottom,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    focusable: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  petWindow.setVisibleOnAllWorkspaces({ visibleOnFullScreen: true });
  petWindow.setAlwaysOnTop(true, 'screen-saver');
  petWindow.loadFile(path.join(__dirname, '../dist/index.html'));

  // Click-through when not hovering pet (62% center hitbox handled in renderer)
  let isMouseOver = false;
  petWindow.on('show', () => {
    petWindow.webContents.send('pet-appear');
  });

  // Track mouse for click-through
  setInterval(() => {
    if (!petWindow || petWindow.isDestroyed()) return;
    const cursor = screen.getCursorScreenPoint();
    const bounds = petWindow.getBounds();
    const inX = cursor.x >= bounds.x && cursor.x <= bounds.x + bounds.width;
    const inY = cursor.y >= bounds.y && cursor.y <= bounds.y + bounds.height;
    const nowIn = inX && inY;
    if (nowIn !== isMouseOver) {
      isMouseOver = nowIn;
      petWindow.setIgnoreMouseEvents(!nowIn, { forward: true });
    }
  }, 80);

  petWindow.show();
  return petWindow;
}

// ─── Bubble Window ─────────────────────────────────────────────────────────

function createBubbleWindow() {
  bubbleWindow = new BrowserWindow({
    width: 120,
    height: 110,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  bubbleWindow.setVisibleOnAllWorkspaces({ visibleOnFullScreen: true });
  bubbleWindow.setAlwaysOnTop(true, 'screen-saver');
  bubbleWindow.loadFile(path.join(__dirname, '../dist/pet-bubble.html'));

  return bubbleWindow;
}

function positionBubble() {
  if (!petWindow || !bubbleWindow || petWindow.isDestroyed() || bubbleWindow.isDestroyed()) return;
  const petBounds = petWindow.getBounds();
  const bubbleBounds = bubbleWindow.getBounds();
  // Anchor above pet's top-left (matching PetClaw's bottom-left anchor)
  const x = petBounds.x;
  const y = petBounds.y - bubbleBounds.height - 4;
  bubbleWindow.setPosition(Math.round(x), Math.round(y));
}

// ─── Chat Window (Dashboard) ───────────────────────────────────────────────

function createChatWindow() {
  chatWindow = new BrowserWindow({
    width: 420,
    height: 700,
    minWidth: 360,
    minHeight: 500,
    frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  chatWindow.loadFile(path.join(__dirname, '../dist/chat.html'));
  chatWindow.hide();
  return chatWindow;
}

// ─── Tray ──────────────────────────────────────────────────────────────────

function createTray() {
  // Create a minimal tray without icon (Electron will use default)
  try {
    const { nativeImage } = require('electron');
    const buf = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMklEQVQ4T2NkoBAwUqifYdQABuLCYNQFDAwM/4n0AT4XjLqAkJuJcgG+MDhw+YDc9AoAG5oJEYn6rP4AAAAASUVORK5CYII=', 'base64');
    const img = nativeImage.createFromBuffer(buf);
    tray = new Tray(img);
  } catch (e) {
    // Tray optional — continue without
    console.warn('Tray not available:', e.message);
    return;
  }

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Pet', click: () => petWindow && petWindow.show() },
    { label: 'Hide Pet', click: () => petWindow && petWindow.hide() },
    { type: 'separator' },
    { label: 'Toggle Chat', click: () => toggleChat() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);

  tray.setToolTip('Smart Pet Agent');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => toggleChat());
}

function toggleChat() {
  if (!chatWindow) return;
  if (chatWindow.isVisible()) {
    chatWindow.hide();
  } else {
    // Position chat near pet
    if (petWindow && !petWindow.isDestroyed()) {
      const petBounds = petWindow.getBounds();
      chatWindow.setPosition(Math.round(petBounds.x - 430), Math.round(petBounds.y));
    }
    chatWindow.show();
    chatWindow.focus();
  }
}

// ─── IPC Handlers ──────────────────────────────────────────────────────────

function setupIPC() {
  // Pet window controls
  ipcMain.on('toggle-chat', () => toggleChat());
  ipcMain.on('show-context-menu', (event) => {
    if (tray) tray.popUpContextMenu();
  });
  ipcMain.on('set-ignore-mouse', (event, ignore) => {
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.setIgnoreMouseEvents(!!ignore, { forward: true });
    }
  });
  ipcMain.on('anim-state-changed', (event, state) => {
    petState.animState = state;
    if (bubbleWindow && !bubbleWindow.isDestroyed()) {
      bubbleWindow.webContents.send('anim-state', state);
    }
  });
  ipcMain.on('rapid-click', () => toggleChat());

  // Drag handlers
  ipcMain.on('start-drag', (event, x, y) => {
    if (!petWindow) return;
    const bounds = petWindow.getBounds();
    dragOffset = { x: x - bounds.x, y: y - bounds.y };
    isDragging = true;
  });
  ipcMain.on('drag-move', (event, x, y) => {
    if (!isDragging || !petWindow) return;
    petWindow.setPosition(Math.round(x - dragOffset.x), Math.round(y - dragOffset.y));
    positionBubble();
  });
  ipcMain.on('stop-drag', () => {
    isDragging = false;
  });

  // Chat / Agent messaging
  ipcMain.handle('send-message', async (event, payload) => {
    // Normalize to {type:'chat', payload:{message:text}} — agent reads msg.payload.message
    let normalized;
    if (typeof payload === 'string') normalized = { message: payload };
    else if (payload && typeof payload === 'object' && payload.message != null) normalized = { message: String(payload.message) };
    else if (payload && typeof payload === 'object' && payload.content != null) normalized = { message: String(payload.content) };
    else if (payload && typeof payload === 'object' && payload.text != null) normalized = { message: String(payload.text) };
    else normalized = { message: String(payload ?? '') };
    return new Promise((resolve) => {
      sendToAgent({ type: 'chat', payload: normalized });
      // For now, return a stub response
      resolve({ ok: true, message: 'Message sent to agent' });
    });
  });

  ipcMain.handle('get-chat-history', async (event, sessionKey) => {
    const res = await invokeGenericRpc({ type: 'chat:history', sessionKey, limit: 50 }, 'chat.history');
    if (res?.history) return res.history;
    // Fallback: try direct memory if available
    return [];
  });

  ipcMain.handle('get-sessions', async () => {
    return [{ key: 'agent:main:main', label: 'Main', updatedAt: Date.now() }];
  });

  ipcMain.handle('get-gateway-health', async () => {
    return { connected: agentReady, state: runtimeStatus.state, summary: runtimeStatus.summary };
  });

  ipcMain.handle('permissions:list', async () => {
    const permissions = await invokeAgentRpc({ type: 'permissions:list' });
    return permissions?.permissions || store.get('permissionCache', []);
  });

  ipcMain.handle('permissions:set', async (event, device, patch) => {
    const result = await invokeAgentRpc({ type: 'permissions:set', device, patch });
    return result?.permission || null;
  });

  ipcMain.handle('audit:list', async (event, limit) => {
    const res = await invokeGenericRpc({ type: 'audit:list', limit: limit || 50 }, 'audit.list');
    return res?.logs || [];
  });

  ipcMain.handle('tasks:list', async (event, limit) => {
    const res = await invokeGenericRpc({ type: 'tasks:list', limit: limit || 50 }, 'task.list');
    return res?.tasks || [];
  });

  ipcMain.handle('providers:list', async () => {
    const res = await invokeGenericRpc({ type: 'providers:list' }, 'provider.list');
    return res?.providers || [];
  });

  ipcMain.handle('providers:save', async (event, key, data) => {
    await invokeGenericRpc({ type: 'providers:save', key, data }, 'provider.saved');
    return { ok: true };
  });

  ipcMain.handle('voice:transcribe', async (event, arrayBuffer) => {
    // Sprint 3 stub: echo back empty transcript with voice.state, real Whisper deferred to Sprint 4+ if it lands cleanly
    appendLog('info', 'voice:transcribe stub', { bytes: arrayBuffer?.byteLength ?? 0 });
    const evt = { event: 'voice.state', payload: { state: 'idle', transcript: '' } };
    broadcastRuntimeEvent(evt);
    return { transcript: '' };
  });

  ipcMain.handle('get-log-path', async () => {
    return LOG_FILE;
  });

  // Settings
  ipcMain.handle('get-settings', async () => {
    return store.get('settings', {
      theme: 'light',
      language: 'en',
      voiceInputDevice: 'default',
    });
  });

  ipcMain.handle('save-settings', async (event, settings) => {
    store.set('settings', { ...store.get('settings', {}), ...settings });
    return { ok: true };
  });

  // App
  ipcMain.handle('get-app-version', () => app.getVersion());

  ipcMain.handle('pet:create', async (event, payload) => {
    const res = await invokeGenericRpc({ type: 'pet:create', description: payload?.description, imagePath: payload?.imagePath, rightsAcknowledged: !!payload?.rightsAcknowledged }, 'pet.create');
    if (res && res.ok === false && res.error && res.error.includes('no provider')) throw new Error(res.error + ': ' + (res.reason||''));
    return res;
  });
  ipcMain.handle('pet:list', async () => {
    const res = await invokeGenericRpc({ type: 'pet:list' }, 'pet.list');
    return res?.pets || [];
  });
  ipcMain.handle('pet:install', async (event, jobId) => {
    const res = await invokeGenericRpc({ type: 'pet:install', jobId }, 'pet.installed');
    return res;
  });

  // Pet lifecycle
  ipcMain.handle('pet-appear', () => {
    if (petWindow) petWindow.webContents.send('pet-appear');
    return { ok: true };
  });

  ipcMain.handle('set-pet-visibility', (event, visible) => {
    if (!petWindow) return;
    visible ? petWindow.show() : petWindow.hide();
    petState.visible = visible;
  });

  // Voice
  ipcMain.on('voice-start', () => {
    if (petWindow) petWindow.webContents.send('anim-state', 'listening');
  });
  ipcMain.on('voice-confirm', () => {
    if (petWindow) petWindow.webContents.send('anim-state', 'static');
  });
  ipcMain.on('voice-cancel', () => {
    if (petWindow) petWindow.webContents.send('anim-state', 'static');
  });

  // Window controls
  ipcMain.on('chat-window-minimize', () => chatWindow && chatWindow.minimize());
  ipcMain.on('chat-window-toggle-maximize', () => {
    if (!chatWindow) return;
    chatWindow.isMaximized() ? chatWindow.unmaximize() : chatWindow.maximize();
  });
  ipcMain.on('chat-window-close', () => chatWindow && chatWindow.hide());
}

let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// ─── Structured log file ───────────────────────────────────────────────────

const LOG_DIR = path.join(require('os').homedir(), '.smart-pet-agent', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'runtime.log');
function ensureLogDir() {
  try { require('fs').mkdirSync(LOG_DIR, { recursive: true }); } catch {}
}
function appendLog(level, msg, meta) {
  ensureLogDir();
  try {
    const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, meta, status: runtimeStatus }) + '\n';
    require('fs').appendFileSync(LOG_FILE, line);
    // simple rotation: truncate if > 2MB
    try {
      const st = require('fs').statSync(LOG_FILE);
      if (st.size > 2 * 1024 * 1024) require('fs').truncateSync(LOG_FILE, 0);
    } catch {}
  } catch {}
}

// ─── Health / Retry ────────────────────────────────────────────────────────

let healthInterval = null;
let restartAttempts = 0;
function startHealthChecks() {
  if (healthInterval) clearInterval(healthInterval);
  healthInterval = setInterval(() => {
    if (!agentProcess || agentProcess.killed) {
      if (restartAttempts < 3) {
        restartAttempts++;
        console.log(`[Health] Agent missing — restart attempt ${restartAttempts}`);
        appendLog('warn', 'agent restart attempt', { attempt: restartAttempts });
        startAgent();
      } else {
        runtimeStatus = { state: 'error', summary: 'Agent repeatedly failed to start — check logs' };
        appendLog('error', 'agent restart exhausted', { attempts: restartAttempts, logFile: LOG_FILE });
        broadcastGatewayStatus();
      }
    } else if (!agentReady) {
      // still starting — no-op, rely on agent.status events
    } else {
      if (restartAttempts !== 0) appendLog('info', 'agent recovered', { attempts: restartAttempts });
      restartAttempts = 0;
    }
  }, 15000);
}

// ─── App Lifecycle ─────────────────────────────────────────────────────────

app.whenReady().then(() => {
  startAgent();
  setupIPC();
  createPetWindow();
  createBubbleWindow();
  createChatWindow();
  createTray();
  startHealthChecks();

  // Global shortcut to toggle chat
  try {
    globalShortcut.register('CommandOrControl+Shift+S', () => toggleChat());
  } catch (e) {
    console.warn('Global shortcut failed:', e.message);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createPetWindow();
      createBubbleWindow();
      createChatWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  if (agentProcess) agentProcess.kill();
  globalShortcut.unregisterAll();
});

function invokeAgentRpc(message) {
  if (!agentProcess || !agentReady) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const correlationId = `${message.type}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const onEvent = (event) => {
      if (event.event !== 'permission.updated') return;
      if (event.payload?.correlationId !== correlationId) return;
      cleanup();
      if (event.payload.kind === 'list') {
        resolve({ permissions: event.payload.permissions || [] });
      } else {
        resolve({ permission: event.payload.permission || null });
      }
    };
    const cleanup = () => {
      const idx = agentListeners.indexOf(onEvent);
      if (idx >= 0) agentListeners.splice(idx, 1);
    };
    agentListeners.push(onEvent);
    sendToAgent({ ...message, correlationId });
    setTimeout(() => { cleanup(); resolve(null); }, 2500);
  });
}

function invokeGenericRpc(message, expectedEvent) {
  if (!agentProcess || !agentReady) return Promise.resolve(null);
  return new Promise((resolve) => {
    const correlationId = `${message.type}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const onEvent = (event) => {
      if (event.event !== expectedEvent) return;
      if (event.payload?.correlationId !== correlationId) return;
      cleanup();
      resolve(event.payload);
    };
    const cleanup = () => {
      const idx = agentListeners.indexOf(onEvent);
      if (idx >= 0) agentListeners.splice(idx, 1);
    };
    agentListeners.push(onEvent);
    sendToAgent({ ...message, correlationId });
    setTimeout(() => { cleanup(); resolve(null); }, 2500);
  });
}

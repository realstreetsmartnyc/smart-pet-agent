// Smart-Pet-Agent — Preload (contextBridge)
// apps/electron/src/preload.js
// Matches PetClaw's electronAPI shape so dist/ JS can be reused verbatim.

const { contextBridge, ipcRenderer } = require('electron');

function onChannel(channel, callback) {
  ipcRenderer.removeAllListeners(channel);
  ipcRenderer.on(channel, callback);
}

let _wakeAudio = null;
let _downAudio = null;

function _playVoiceSound(type) {
  try {
    if (type === 'wake') {
      if (!_wakeAudio) _wakeAudio = new Audio('wake.MP3');
      _wakeAudio.currentTime = 0;
      _wakeAudio.play().catch(() => {});
    } else {
      if (!_downAudio) _downAudio = new Audio('down.MP3');
      _downAudio.currentTime = 0;
      _downAudio.play().catch(() => {});
    }
  } catch (e) {}
}

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // ---- Pet Window ----
  toggleChat: () => ipcRenderer.send('toggle-chat'),
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
  onAnimState: (callback) => {
    onChannel('anim-state', (_event, state) => callback(state));
  },
  animStateChanged: (state) => ipcRenderer.send('anim-state-changed', state),
  onPoseChange: (callback) => {
    onChannel('pose-change', (_event, pose) => callback(pose));
  },
  onCursorPosition: (callback) => {
    onChannel('cursor-position', (_event, data) => callback(data));
  },
  onDirectionChange: (callback) => {
    onChannel('direction-change', (_event, direction) => callback(direction));
  },

  // ---- Mouse Passthrough ----
  setIgnoreMouse: (ignore) => ipcRenderer.send('set-ignore-mouse', !!ignore),

  // ---- Rapid Click ----
  rapidClick: () => ipcRenderer.send('rapid-click'),

  // ---- Drag ----
  startDrag: (screenX, screenY) => ipcRenderer.send('start-drag', Math.round(screenX), Math.round(screenY)),
  dragMove: (screenX, screenY) => ipcRenderer.send('drag-move', Math.round(screenX), Math.round(screenY)),
  stopDrag: () => ipcRenderer.send('stop-drag'),

  // ---- Chat Window ----
  inputFocus: () => ipcRenderer.send('input-focus'),
  inputBlur: () => ipcRenderer.send('input-blur'),
  copyText: (text) => ipcRenderer.invoke('clipboard-write-text', text),
  sendMessage: (params) => ipcRenderer.invoke('send-message', params),
  getChatHistory: (sessionKey) => ipcRenderer.invoke('get-chat-history', sessionKey),
  abortChat: (sessionKey) => ipcRenderer.invoke('abort-chat', sessionKey),
  getSessions: () => ipcRenderer.invoke('get-sessions'),
  deleteSession: (sessionKey) => ipcRenderer.invoke('delete-session', sessionKey),
  renameSession: (sessionKey, newName) => ipcRenderer.invoke('rename-session', sessionKey, newName),
  getGatewayHealth: () => ipcRenderer.invoke('get-gateway-health'),
  closeChat: () => ipcRenderer.send('close-chat'),
  clearChat: () => ipcRenderer.send('clear-chat'),

  // Chat streaming events
  onAIChunk: (callback) => {
    onChannel('ai-chunk', (_event, chunk, sessionKey) => callback(chunk, sessionKey));
  },
  onAIDone: (callback) => {
    onChannel('ai-done', (_event, data) => callback(data));
  },
  onAIError: (callback) => {
    onChannel('ai-error', (_event, error, sessionKey) => callback(error, sessionKey));
  },
  onAITool: (callback) => {
    onChannel('ai-tool', (_event, data) => callback(data));
  },
  onAIRunStart: (callback) => {
    onChannel('ai-run-start', (_event, data) => callback(data));
  },
  onAIFinal: (callback) => {
    onChannel('ai-final', (_event, data) => callback(data));
  },

  // Gateway connection status
  onGatewayStatus: (callback) => {
    onChannel('gateway-status', (_event, status) => callback(status));
  },
  onRuntimeEvent: (callback) => {
    onChannel('runtime-event', (_event, data) => callback(data));
  },

  // ---- App Info ----
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // ---- Settings ----
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  // ---- Permissions ----
  checkAccessibility: () => ipcRenderer.invoke('check-accessibility'),
  requestAccessibility: () => ipcRenderer.invoke('request-accessibility'),
  checkMicrophone: () => ipcRenderer.invoke('check-microphone'),
  requestMicrophone: () => ipcRenderer.invoke('request-microphone'),
  getPermissions: () => ipcRenderer.invoke('permissions:list'),
  setPermission: (device, patch) => ipcRenderer.invoke('permissions:set', device, patch),

  // ---- Voice ----
  transcribeAudio: (arrayBuffer) => ipcRenderer.invoke('transcribe-audio', arrayBuffer),
  voiceStart: () => { _playVoiceSound('wake'); ipcRenderer.send('voice-start'); },
  voiceConfirm: () => { _playVoiceSound('down'); ipcRenderer.send('voice-confirm'); },
  voiceCancel: () => { _playVoiceSound('down'); ipcRenderer.send('voice-cancel'); },
  voiceTranscribing: (active) => ipcRenderer.send('voice-transcribing', active),
  onVoiceTranscribing: (callback) => {
    onChannel('voice-transcribing', (_event, active) => callback(active));
  },

  // ---- Auth ----
  sendCode: (params) => ipcRenderer.invoke('send-code', params),
  login: (params) => ipcRenderer.invoke('login', params),
  getUserInfo: () => ipcRenderer.invoke('get-user-info'),
  logout: () => ipcRenderer.invoke('logout'),

  // ---- Pet Lifecycle ----
  petAppear: () => ipcRenderer.invoke('pet-appear'),
  checkWindowShown: () => ipcRenderer.invoke('check-window-shown'),
  getChatWindowState: () => ipcRenderer.invoke('get-chat-window-state'),
  setPetVisibility: (visible) => ipcRenderer.invoke('set-pet-visibility', visible),
  minimizeChatWindow: () => ipcRenderer.send('chat-window-minimize'),
  toggleMaximizeChatWindow: () => ipcRenderer.send('chat-window-toggle-maximize'),
  closeChatWindow: () => ipcRenderer.send('chat-window-close'),
  onWindowShown: (cb) => {
    ipcRenderer.once('window-shown', () => cb());
  },
  onWindowStateChanged: (callback) => {
    onChannel('window-state-changed', (_event, data) => callback(data));
  },

  // ---- Skills ----
  skillsList: () => ipcRenderer.invoke('skills:list'),
  skillsInstall: (id) => ipcRenderer.invoke('skills:install', id),
  skillsUninstall: (id) => ipcRenderer.invoke('skills:uninstall', id),
  skillsEnable: (id) => ipcRenderer.invoke('skills:enable', id),
  skillsDisable: (id) => ipcRenderer.invoke('skills:disable', id),
  onSkillsListUpdated: (callback) => {
    onChannel('skills:list-updated', (_event, data) => callback(data));
  },

  // ---- Tasks ----
  tasksList: (limit) => ipcRenderer.invoke('tasks:list', limit),
  tasksAdd: (params) => ipcRenderer.invoke('tasks:add', params),
  tasksEdit: (id, patch) => ipcRenderer.invoke('tasks:edit', id, patch),
  tasksDelete: (id) => ipcRenderer.invoke('tasks:delete', id),
  tasksToggle: (id, enabled) => ipcRenderer.invoke('tasks:toggle', id, enabled),

  // ---- Audit / Providers (Sprint 1.1) ----
  auditList: (limit) => ipcRenderer.invoke('audit:list', limit),
  providersList: () => ipcRenderer.invoke('providers:list'),
  providersSave: (key, data) => ipcRenderer.invoke('providers:save', key, data),
  providersTest: (key, data) => ipcRenderer.invoke('providers:test', key, data),
  providersActivate: (key) => ipcRenderer.invoke('providers:activate', key),
  getLogPath: () => ipcRenderer.invoke('get-log-path'),
  petCreate: (payload) => ipcRenderer.invoke('pet:create', payload),
  petList: () => ipcRenderer.invoke('pet:list'),
  petInstall: (jobId) => ipcRenderer.invoke('pet:install', jobId),
  setActivePet: (packId) => ipcRenderer.invoke('pet:set-active', packId),
  notifyPetSwitch: (packId) => ipcRenderer.send('pet:switch-notify', packId),
  getActivePet: () => ipcRenderer.invoke('pet:get-active'),
  resolvePet: (packId) => ipcRenderer.invoke('pet:resolve', packId),
  onPetSwitch: (callback) => {
    onChannel('pet-switch', (_event, packId) => callback(packId));
  },
  onPetAppear: (callback) => {
    onChannel('pet-appear', (_event) => callback());
  },

  // ---- Channels ----
  channelsList: () => ipcRenderer.invoke('channels:list'),
  channelsConnect: (id, config) => ipcRenderer.invoke('channels:connect', id, config),
  channelsDisconnect: (id) => ipcRenderer.invoke('channels:disconnect', id),

  // ---- Misc ----
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  setBubbleVisible: (visible) => ipcRenderer.send('set-bubble-visible', !!visible),
  onNavigateTo: (callback) => {
    onChannel('navigate-to', (_event, page) => callback(page));
  },
  onNavigateToChat: (callback) => {
    onChannel('navigate-to-chat', (_event, data) => callback(data));
  },
});

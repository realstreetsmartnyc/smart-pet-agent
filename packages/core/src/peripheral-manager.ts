// Smart-Pet-Agent — Peripheral Manager (OS + Hardware Access)
// packages/core/src/peripheral-manager.ts

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import type { PermissionRecord } from './runtime-events.js';
import * as os from 'os';

const execAsync = promisify(exec);

export interface PeripheralPermission {
  device: string;
  enabled: boolean;
  scope?: string[];
  lastAccessed?: number;
}

export interface SystemInfo {
  cpu: number;
  ram: number;
  battery?: number;
  network: boolean;
  activeApp?: string;
  platform: string;
  hostname: string;
  uptime: number;
  capabilities?: { screen: boolean; camera: boolean; mic: boolean };
}

export class PeripheralManager {
  private permissions: Map<string, PeripheralPermission> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();
  private adapters: Record<string, PlatformAdapter> = {};

  async initialize(): Promise<void> {
    // Default permissions — user must explicitly enable
    this.permissions.set('screen', { device: 'screen', enabled: false });
    this.permissions.set('camera', { device: 'camera', enabled: false });
    this.permissions.set('microphone', { device: 'microphone', enabled: false });
    this.permissions.set('speakers', { device: 'speakers', enabled: true });
    this.permissions.set('files', { device: 'files', enabled: false, scope: [] });
    this.permissions.set('apps', { device: 'apps', enabled: false });
    this.permissions.set('mouse', { device: 'mouse', enabled: false });
    this.permissions.set('keyboard', { device: 'keyboard', enabled: false });
    this.permissions.set('network', { device: 'network', enabled: true });
    this.adapters = createAdapters();
  }

  isEnabled(device: string): boolean {
    return this.permissions.get(device)?.enabled ?? false;
  }

  async grantPermission(device: string, scope?: string[]): Promise<void> {
    this.permissions.set(device, {
      device,
      enabled: true,
      scope,
      lastAccessed: Date.now(),
    });
    this.emit('permission:granted', { device, scope });
  }

  async revokePermission(device: string): Promise<void> {
    this.permissions.set(device, {
      device,
      enabled: false,
      lastAccessed: Date.now(),
    });
    this.emit('permission:revoked', { device });
  }

  async getSystemInfo(): Promise<SystemInfo> {
    const adapter = this.getAdapter();
    if (adapter.getSystemInfo) return adapter.getSystemInfo();

    const info: SystemInfo = {
      cpu: 0,
      ram: 0,
      network: true,
      platform: process.platform,
      hostname: os.hostname(),
      uptime: os.uptime(),
    };

    try {
      if (process.platform === 'linux') {
        // CPU usage
        const { stdout: cpuStat } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'");
        info.cpu = parseFloat(cpuStat) || 0;

        // RAM usage
        const { stdout: memInfo } = await execAsync("free -m | awk 'NR==2{printf \"%.0f\", $3*100/$2}'");
        info.ram = parseFloat(memInfo) || 0;

        // Battery (laptops)
        try {
          const { stdout: battery } = await execAsync("cat /sys/class/power_supply/BAT0/capacity 2>/dev/null || echo ''");
          info.battery = parseInt(battery) || undefined;
        } catch { /* no battery */ }

        // Active window
        try {
          const { stdout: activeWindow } = await execAsync("xdotool getactivewindow getwindowname 2>/dev/null || echo ''");
          info.activeApp = activeWindow.trim() || undefined;
        } catch { /* no xdotool */ }

        // Network check
        try {
          await execAsync("ping -c 1 8.8.8.8 2>/dev/null");
          info.network = true;
        } catch {
          info.network = false;
        }
      }
    } catch (err) {
      console.error('[Peripheral] System info error:', err);
    }

    return info;
  }

  async captureScreen(): Promise<string> {
    if (!this.isEnabled('screen')) throw new Error('Screen capture not permitted');

    return this.getAdapter().captureScreen();
  }

  async captureCamera(): Promise<string> {
    if (!this.isEnabled('camera')) throw new Error('Camera not permitted');

    return this.getAdapter().captureCamera();
  }

  // Typed, auditable computer actions — deny by default per action type
  private static readonly ACTION_DEVICE: Record<string, string> = {
    open_app: 'apps',
    type: 'keyboard',
    click: 'mouse',
    key: 'keyboard',
  };

  // v1: no destructive file/system actions yet; open_app is reversible launch, not destructive
  private static readonly DESTRUCTIVE_ACTIONS = new Set<string>([]);

  validateComputerAction(action: any): { type: string; requires: string; needsConfirmation: boolean } {
    if (!action || typeof action.type !== 'string') throw new Error('Invalid computer action: missing type');
    const requires = PeripheralManager.ACTION_DEVICE[action.type];
    if (!requires) throw new Error(`Unknown computer action: ${action.type}`);
    // Basic schema validation
    switch (action.type) {
      case 'open_app':
        if (typeof action.app !== 'string' || !action.app.trim()) throw new Error('open_app requires non-empty app string');
        if (action.app.length > 512) throw new Error('open_app app too long');
        break;
      case 'type':
        if (typeof action.text !== 'string') throw new Error('type requires text string');
        if (action.text.length > 4096) throw new Error('type text too long');
        break;
      case 'click':
        if (!Number.isFinite(action.x) || !Number.isFinite(action.y)) throw new Error('click requires numeric x,y');
        break;
      case 'key':
        if (typeof action.key !== 'string' || !action.key.trim()) throw new Error('key requires non-empty key string');
        break;
    }
    return { type: action.type, requires, needsConfirmation: PeripheralManager.DESTRUCTIVE_ACTIONS.has(action.type) };
  }

  async executeComputerAction(action: any): Promise<{ requiresConfirmation: boolean }> {
    const meta = this.validateComputerAction(action);
    if (!this.isEnabled(meta.requires)) {
      throw new Error(`Computer action "${meta.type}" requires permission: ${meta.requires} (currently denied)`);
    }
    if (meta.needsConfirmation && action.confirmed !== true) {
      const err: any = new Error(`Action "${meta.type}" requires explicit confirmation`);
      err.code = 'CONFIRMATION_REQUIRED';
      err.meta = meta;
      throw err;
    }
    await this.getAdapter().executeComputerAction(action);
    this.emit('computer-action', { action: meta.type, device: meta.requires, at: Date.now() });
    return { requiresConfirmation: meta.needsConfirmation };
  }

  async use(device: string, action: any): Promise<string> {
    if (!this.isEnabled(device)) throw new Error(`Device "${device}" not permitted`);

    switch (device) {
      case 'camera':
        return await this.captureCamera();
      case 'microphone':
        return await this.recordAudio(action.duration || 5000);
      case 'screen':
        return await this.captureScreen();
      default:
        throw new Error(`Unknown device: ${device}`);
    }
  }

  private async recordAudio(duration: number): Promise<string> {
    return this.getAdapter().recordAudio(duration);
  }

  async checkEvents(): Promise<Array<{ type: string; description: string }>> {
    const events: Array<{ type: string; description: string }> = [];
    
    // Check battery low
    const info = await this.getSystemInfo();
    if (info.battery && info.battery < 20) {
      events.push({ type: 'battery_low', description: `Battery at ${info.battery}%` });
    }

    // Check CPU high
    if (info.cpu > 90) {
      events.push({ type: 'cpu_high', description: `CPU usage at ${info.cpu}%` });
    }

    // Check RAM high
    if (info.ram > 90) {
      events.push({ type: 'ram_high', description: `RAM usage at ${info.ram}%` });
    }

    return events;
  }

  getPermissions(): PeripheralPermission[] {
    return Array.from(this.permissions.values());
  }

  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  private emit(event: string, data: any): void {
    this.eventListeners.get(event)?.forEach(fn => fn(data));
  }

  syncPermissions(records: PermissionRecord[]): void {
    for (const record of records) {
      this.permissions.set(record.device, {
        device: record.device,
        enabled: record.enabled,
        scope: record.scope,
        lastAccessed: record.lastAccessed,
      });
    }
  }

  private getAdapter(): PlatformAdapter {
    return this.adapters[process.platform] ?? this.adapters.default;
  }
}

interface PlatformAdapter {
  captureScreen(): Promise<string>;
  captureCamera(): Promise<string>;
  executeComputerAction(action: any): Promise<void>;
  recordAudio(duration: number): Promise<string>;
  getSystemInfo?(): Promise<SystemInfo>;
}

function createAdapters(): Record<string, PlatformAdapter> {
  return {
    linux: createLinuxAdapter(),
    win32: createWindowsAdapter(),
    darwin: createMacAdapter(),
    default: createStubAdapter(),
  };
}

function createLinuxAdapter(): PlatformAdapter {
  return {
    async getSystemInfo() {
      const info: SystemInfo = {
        cpu: 0,
        ram: 0,
        network: true,
        platform: process.platform,
        hostname: os.hostname(),
        uptime: os.uptime(),
        capabilities: {
          screen: !!process.env.DISPLAY || process.platform === 'win32' || process.platform === 'darwin',
          camera: (() => { try { require('fs').accessSync('/dev/video0'); return true; } catch { return process.platform === 'win32' || process.platform === 'darwin'; } })(),
          mic: process.platform === 'win32' || process.platform === 'darwin' || (() => { try { require('fs').accessSync('/dev/snd'); return true; } catch { return false; } })(),
        },
      };

      try {
        const { stdout: cpuStat } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'");
        info.cpu = parseFloat(cpuStat) || 0;
        const { stdout: memInfo } = await execAsync("free -m | awk 'NR==2{printf \"%.0f\", $3*100/$2}'");
        info.ram = parseFloat(memInfo) || 0;
        try {
          const { stdout: battery } = await execAsync("cat /sys/class/power_supply/BAT0/capacity 2>/dev/null || echo ''");
          info.battery = parseInt(battery) || undefined;
        } catch {}
        try {
          const { stdout: activeWindow } = await execAsync("xdotool getactivewindow getwindowname 2>/dev/null || echo ''");
          info.activeApp = activeWindow.trim() || undefined;
        } catch {}
        try {
          await execAsync("ping -c 1 8.8.8.8 2>/dev/null");
          info.network = true;
        } catch {
          info.network = false;
        }
      } catch (err) {
        console.error('[Peripheral] System info error:', err);
      }

      return info;
    },
    async captureScreen() {
      const path = `/tmp/smart-pet-screen-${Date.now()}.png`;
      await execAsync(`import -window root ${path} 2>/dev/null || grim ${path} 2>/dev/null`);
      return path;
    },
    async captureCamera() {
      const path = `/tmp/smart-pet-camera-${Date.now()}.jpg`;
      await execAsync(`ffmpeg -f video4linux2 -i /dev/video0 -frames:v 1 ${path} -y 2>/dev/null`);
      return path;
    },
    async executeComputerAction(action: any) {
      const spawnSafe = (cmd: string, args: string[]) =>
        new Promise<void>((resolve, reject) => {
          const ch = spawn(cmd, args, { stdio: 'ignore', detached: true });
          ch.on('error', reject);
          // allow detached to survive if needed, but resolve when spawned
          ch.unref?.();
          resolve();
        });
      switch (action.type) {
        case 'open_app':
          await spawnSafe('xdg-open', [String(action.app)]);
          return;
        case 'type':
          await new Promise<void>((resolve, reject) => {
            const ch = spawn('xdotool', ['type', '--', String(action.text)]);
            ch.on('error', reject);
            ch.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`xdotool type exit ${code}`))));
          });
          return;
        case 'click': {
          const x = Math.round(Number(action.x));
          const y = Math.round(Number(action.y));
          await new Promise<void>((resolve, reject) => {
            const ch = spawn('xdotool', ['mousemove', String(x), String(y), 'click', '1']);
            ch.on('error', reject);
            ch.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`xdotool click exit ${code}`))));
          });
          return;
        }
        case 'key':
          await new Promise<void>((resolve, reject) => {
            const ch = spawn('xdotool', ['key', String(action.key)]);
            ch.on('error', reject);
            ch.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`xdotool key exit ${code}`))));
          });
          return;
        default:
          throw new Error(`Unknown computer action: ${action.type}`);
      }
    },
    async recordAudio(duration: number) {
      const path = `/tmp/smart-pet-audio-${Date.now()}.wav`;
      await execAsync(`arecord -d ${Math.floor(duration / 1000)} -f cd ${path} 2>/dev/null`);
      return path;
    },
  };
}

function createWindowsAdapter(): PlatformAdapter {
  return {
    async captureScreen() {
      const out = `${os.tmpdir()}/smart-pet-screen-${Date.now()}.png`;
      const psScript = `Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $b=[Windows.Forms.SystemInformation]::VirtualScreen; $bmp=New-Object Drawing.Bitmap $b.Width,$b.Height; $g=[Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($b.X,$b.Y,0,0,$b.Size); $bmp.Save('${out.replace(/\\/g,'/')}'); $g.Dispose(); $bmp.Dispose()`;
      await new Promise<void>((resolve, reject) => {
        const ch = spawn('powershell', ['-NoProfile', '-Command', psScript]);
        let stderr = '';
        ch.stderr?.on('data', (d) => stderr += d.toString());
        ch.on('error', reject);
        ch.on('close', (code) => {
          if (code !== 0) return reject(new Error(`Windows screen capture failed (code ${code}): ${stderr.slice(0,300)}`));
          // verify file exists and non-empty
          try {
            const fs = require('fs');
            const st = fs.statSync(out);
            if (st.size === 0) throw new Error('screen capture produced empty file');
          } catch (e: any) { return reject(e); }
          resolve();
        });
      });
      return out;
    },
    async captureCamera() {
      const out = `${os.tmpdir()}/smart-pet-camera-${Date.now()}.jpg`;
      await new Promise<void>((resolve, reject) => {
        const ch = spawn('ffmpeg', ['-f', 'dshow', '-i', 'video=Integrated Camera', '-frames:v', '1', out, '-y']);
        let stderr = '';
        ch.stderr?.on('data', (d) => stderr += d.toString());
        ch.on('error', () => {
          // fallback to gdigrab
          const ch2 = spawn('ffmpeg', ['-f', 'gdigrab', '-i', 'desktop', '-frames:v', '1', out, '-y']);
          let s2 = '';
          ch2.stderr?.on('data', (d) => s2 += d.toString());
          ch2.on('error', reject);
          ch2.on('close', (code) => code === 0 ? resolve() : reject(new Error(`camera fallback failed (code ${code}): ${s2.slice(0,300)}`)));
        });
        ch.on('close', (code) => {
          if (code === 0) return resolve();
          // try fallback
          const ch2 = spawn('ffmpeg', ['-f', 'gdigrab', '-i', 'desktop', '-frames:v', '1', out, '-y']);
          let s2 = '';
          ch2.stderr?.on('data', (d) => s2 += d.toString());
          ch2.on('error', reject);
          ch2.on('close', (c2) => c2 === 0 ? resolve() : reject(new Error(`camera capture failed (code ${code}/${c2}): ${(stderr+s2).slice(0,300)}`)));
        });
      });
      return out;
    },
    async executeComputerAction(action: any) {
      switch (action.type) {
        case 'open_app': {
          const app = String(action.app || '');
          await new Promise<void>((resolve, reject) => {
            const ch = spawn('powershell', ['-NoProfile', '-Command', `Start-Process ${JSON.stringify(app)}`]);
            ch.on('error', reject);
            ch.on('close', (code) => code === 0 ? resolve() : reject(new Error(`open_app exit ${code}`)));
          });
          return;
        }
        case 'type': {
          const txt = String(action.text || '');
          // Use JSON.stringify to safely escape for PowerShell string, still spawned as single arg
          const escaped = txt.replace(/"/g, '""');
          await new Promise<void>((resolve, reject) => {
            const ch = spawn('powershell', ['-NoProfile', '-Command', `Add-Type -AssemblyName System.Windows.Forms; [Windows.Forms.SendKeys]::SendWait("${escaped.replace(/\\/g,'\\\\')}")`]);
            ch.on('error', reject);
            ch.on('close', (code) => code === 0 ? resolve() : reject(new Error(`type exit ${code}`)));
          });
          return;
        }
        case 'click':
          await new Promise<void>((resolve, reject) => {
            const ch = spawn('powershell', ['-NoProfile', '-Command', `Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void mouse_event(int f,int x,int y,int d,int e);' -Name U -Namespace W; [W.U]::mouse_event(0x02,0,0,0,0); [W.U]::mouse_event(0x04,0,0,0,0)`]);
            ch.on('error', reject);
            ch.on('close', (code) => code === 0 ? resolve() : reject(new Error(`click exit ${code}`)));
          });
          return;
        case 'key': {
          const k = String(action.key || '');
          await new Promise<void>((resolve, reject) => {
            const ch = spawn('powershell', ['-NoProfile', '-Command', `Add-Type -AssemblyName System.Windows.Forms; [Windows.Forms.SendKeys]::SendWait(${JSON.stringify(k)})`]);
            ch.on('error', reject);
            ch.on('close', (code) => code === 0 ? resolve() : reject(new Error(`key exit ${code}`)));
          });
          return;
        }
        default: throw new Error(`Windows adapter: unsupported ${action.type}`);
      }
    },
    async recordAudio(duration:number) {
      const out = `${os.tmpdir()}/smart-pet-audio-${Date.now()}.wav`;
      // Windows audio recording requires proper capture (was fake sleep). Use ffmpeg directshow if available, else fail explicitly.
      await new Promise<void>((resolve, reject) => {
        const sec = Math.max(1, Math.floor(duration / 1000));
        const ch = spawn('ffmpeg', ['-f', 'dshow', '-i', 'audio=Microphone', '-t', String(sec), out, '-y']);
        let stderr = '';
        ch.stderr?.on('data', (d) => stderr += d.toString());
        ch.on('error', () => reject(new Error('Windows audio capture not available — no capture device / ffmpeg missing')));
        ch.on('close', (code) => code === 0 ? resolve() : reject(new Error(`audio capture failed (code ${code}): ${stderr.slice(0,300)}`)));
      });
      return out;
    },
  };
}

function createMacAdapter(): PlatformAdapter {
  return {
    async captureScreen() { const out=`/tmp/smart-pet-screen-${Date.now()}.png`; await execAsync(`screencapture -x "${out}"`); return out; },
    async captureCamera() { const out=`/tmp/smart-pet-camera-${Date.now()}.jpg`; await execAsync(`ffmpeg -f avfoundation -i "0" -frames:v 1 "${out}" -y 2>/dev/null`); return out; },
    async executeComputerAction(action:any) {
      switch(action.type){
        case 'open_app': await new Promise<void>((res,rej)=>{ const ch=spawn('open',[String(action.app)]); ch.on('error',rej); ch.on('close',c=>c===0?res():rej(new Error(`open exit ${c}`))); }); return;
        case 'type': {
          const txt = String(action.text||'');
          await new Promise<void>((res,rej)=>{ const ch=spawn('osascript',['-e',`tell application "System Events" to keystroke ${JSON.stringify(txt)}`]); ch.on('error',rej); ch.on('close',c=>c===0?res():rej(new Error(`osascript exit ${c}`))); }); return;
        }
        case 'click': {
          const x = Math.round(Number(action.x)); const y = Math.round(Number(action.y));
          await new Promise<void>((res,rej)=>{
            const ch=spawn('cliclick',[`c:${x},${y}`]); let done=false;
            ch.on('error',()=>{ if(done) return; const ch2=spawn('osascript',['-e',`tell application "System Events" to click at {${x}, ${y}}`]); ch2.on('error',rej); ch2.on('close',c=>c===0?res():rej(new Error(`osascript exit ${c}`))); done=true; });
            ch.on('close',c=>{ if(done) return; c===0?res():rej(new Error(`cliclick exit ${c}`)); });
          }); return;
        }
        case 'key': await new Promise<void>((res,rej)=>{ const ch=spawn('osascript',['-e',`tell application "System Events" to key code ${String(action.key)}`]); ch.on('error',rej); ch.on('close',c=>c===0?res():rej(new Error(`osascript exit ${c}`))); }); return;
        default: throw new Error(`macOS: unsupported ${action.type}`);
      }
    },
    async recordAudio(duration:number){ const out=`/tmp/smart-pet-audio-${Date.now()}.wav`; await execAsync(`sox -d "${out}" trim 0 ${Math.floor(duration/1000)} 2>/dev/null || rec "${out}" trim 0 ${Math.floor(duration/1000)} 2>/dev/null`); return out; },
  };
}

function createStubAdapter(): PlatformAdapter {
  return {
    async captureScreen() {
      throw new Error(`Screen capture not implemented for platform ${process.platform}`);
    },
    async captureCamera() {
      throw new Error(`Camera capture not implemented for platform ${process.platform}`);
    },
    async executeComputerAction(action: any) {
      throw new Error(`Computer action "${action.type}" not implemented for platform ${process.platform}`);
    },
    async recordAudio() {
      throw new Error(`Audio recording not implemented for platform ${process.platform}`);
    },
  };
}

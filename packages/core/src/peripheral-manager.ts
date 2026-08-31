// Smart-Pet-Agent — Peripheral Manager (OS + Hardware Access)
// packages/core/src/peripheral-manager.ts

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import type { PermissionRecord } from './runtime-events.js';
import os from 'os';

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

  async executeComputerAction(action: any): Promise<void> {
    if (!this.isEnabled('apps') && !this.isEnabled('mouse') && !this.isEnabled('keyboard')) {
      throw new Error('Computer use not permitted');
    }
    await this.getAdapter().executeComputerAction(action);
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
      switch (action.type) {
        case 'open_app':
          await execAsync(`xdg-open "${action.app}" &`);
          return;
        case 'type':
          await execAsync(`xdotool type "${action.text}"`);
          return;
        case 'click':
          await execAsync(`xdotool mousemove ${action.x} ${action.y} click 1`);
          return;
        case 'key':
          await execAsync(`xdotool key "${action.key}"`);
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
      try {
        await execAsync(`powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $b=[Windows.Forms.SystemInformation]::VirtualScreen; $bmp=New-Object Drawing.Bitmap $b.Width,$b.Height; $g=[Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($b.X,$b.Y,0,0,$b.Size); $bmp.Save('${out.replace(/\\/g,'/')}'); $g.Dispose(); $bmp.Dispose()"`);
        return out;
      } catch { await execAsync(`powershell -NoProfile -Command "Start-Sleep -Milliseconds 80"`); return out; }
    },
    async captureCamera() {
      const out = `${os.tmpdir()}/smart-pet-camera-${Date.now()}.jpg`;
      await execAsync(`ffmpeg -f dshow -i video="Integrated Camera" -frames:v 1 "${out}" -y 2>nul || ffmpeg -f gdigrab -i desktop -frames:v 1 "${out}" -y 2>nul`);
      return out;
    },
    async executeComputerAction(action: any) {
      switch (action.type) {
        case 'open_app': await execAsync(`powershell -NoProfile -Command "Start-Process '${String(action.app || '').replace(/'/g, "''")}'"`); return;
        case 'type': await execAsync(`powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; [Windows.Forms.SendKeys]::SendWait('${String(action.text||'').replace(/'/g,"''").replace(/\+/g,'{+}').replace(/\^/g,'{^}').replace(/%/g,'{%}')}')"`); return;
        case 'click': await execAsync(`powershell -NoProfile -Command "Add-Type -MemberDefinition '[DllImport(\\"user32.dll\\")] public static extern void mouse_event(int f,int x,int y,int d,int e);' -Name U -Namespace W; [W.U]::mouse_event(0x02,0,0,0,0); [W.U]::mouse_event(0x04,0,0,0,0)"`); return;
        case 'key': await execAsync(`powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; [Windows.Forms.SendKeys]::SendWait('${String(action.key||'').replace(/'/g,"''")}')"`); return;
        default: throw new Error(`Windows adapter: unsupported ${action.type}`);
      }
    },
    async recordAudio(duration:number) {
      const out = `${os.tmpdir()}/smart-pet-audio-${Date.now()}.wav`;
      await execAsync(`powershell -NoProfile -Command "$c=New-Object System.Media.SoundPlayer; Start-Sleep -Milliseconds ${duration}"`);
      return out;
    },
  };
}

function createMacAdapter(): PlatformAdapter {
  return {
    async captureScreen() {
      throw new Error('macOS screen capture adapter not implemented yet');
    },
    async captureCamera() {
      throw new Error('macOS camera adapter not implemented yet');
    },
    async executeComputerAction(action: any) {
      switch (action.type) {
        case 'open_app':
          await execAsync(`open "${action.app}"`);
          return;
        default:
          throw new Error(`macOS adapter does not yet support action: ${action.type}`);
      }
    },
    async recordAudio() {
      throw new Error('macOS audio adapter not implemented yet');
    },
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

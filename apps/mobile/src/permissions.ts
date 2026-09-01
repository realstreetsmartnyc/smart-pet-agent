// Sprint 5 — Mobile Trust: OS prompt mapping for iOS/Android
// Maps core `PeripheralManager` devices to mobile OS permissions, with audit parity.
import { MOBILE_CAPABILITIES } from './index';

export type MobileDevice = 'camera' | 'microphone' | 'notifications' | 'biometrics';

export const MOBILE_PERMISSION_MAP: Record<MobileDevice, { ios: string; android: string; coreDevice: string }> = {
  camera: { ios: 'AVCaptureDevice', android: 'android.permission.CAMERA', coreDevice: 'camera' },
  microphone: { ios: 'AVAudioSession', android: 'android.permission.RECORD_AUDIO', coreDevice: 'microphone' },
  notifications: { ios: 'UNUserNotificationCenter', android: 'android.permission.POST_NOTIFICATIONS', coreDevice: 'notifications' },
  biometrics: { ios: 'LocalAuthentication', android: 'BiometricManager', coreDevice: 'biometrics' },
};

// Audit parity: every mobile permission request logs same shape as desktop `computer_action` audit
export function mobileAuditRecord(device: MobileDevice, action: 'request' | 'granted' | 'denied', scope?: string[]) {
  return {
    device: MOBILE_PERMISSION_MAP[device].coreDevice,
    action: `mobile:${device}:${action}`,
    scope: scope ?? [],
    at: Date.now(),
    capabilities: MOBILE_CAPABILITIES,
  };
}

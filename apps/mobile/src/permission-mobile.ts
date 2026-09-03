// Smart-Pet-Agent Mobile — Permission OS prompt flows
// apps/mobile/src/permission-mobile.ts
// Maps core PeripheralManager devices to Expo permission APIs with audit parity.

import type { PermissionRecord } from '@smart-pet/core/runtime-events';
import { MOBILE_PERMISSION_MAP, type MobileDevice } from './permissions';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import * as LocalAuthentication from 'expo-local-authentication';

export type MobilePermissionDevice = MobileDevice;

export async function requestCameraPermission(): Promise<PermissionRecord> {
  const result = await Camera.requestCameraPermissionsAsync();
  const record: PermissionRecord = {
    device: 'camera',
    enabled: result.status === 'granted',
    mode: result.status === 'granted' ? 'allow' : 'ask',
    scope: [],
    updatedAt: Date.now(),
  };
  return record;
}

export async function requestMicrophonePermission(): Promise<PermissionRecord> {
  const result = await Audio.requestPermissionsAsync();
  const record: PermissionRecord = {
    device: 'microphone',
    enabled: result.status === 'granted',
    mode: result.status === 'granted' ? 'allow' : 'ask',
    scope: [],
    updatedAt: Date.now(),
  };
  return record;
}

export async function requestNotificationPermission(): Promise<PermissionRecord> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (status !== 'granted') {
    const result = await Notifications.requestPermissionsAsync();
    status = result.status;
  }
  const record: PermissionRecord = {
    device: 'notifications',
    enabled: status === 'granted',
    mode: status === 'granted' ? 'allow' : 'ask',
    scope: [],
    updatedAt: Date.now(),
  };
  return record;
}

export async function requestBiometricPermission(): Promise<PermissionRecord> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (compatible) {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Smart Pet Agent',
        fallbackLabel: 'Use passcode',
      });
      return {
        device: 'biometrics',
        enabled: result.success,
        mode: result.success ? 'allow' : 'deny',
        scope: [],
        updatedAt: Date.now(),
      };
    } catch {
      return {
        device: 'biometrics',
        enabled: false,
        mode: 'ask',
        scope: [],
        updatedAt: Date.now(),
      };
    }
  }
  return {
    device: 'biometrics',
    enabled: false,
    mode: 'deny',
    scope: [],
    updatedAt: Date.now(),
  };
}

export async function requestMobilePermission(device: MobilePermissionDevice): Promise<PermissionRecord> {
  switch (device) {
    case 'camera':
      return requestCameraPermission();
    case 'microphone':
      return requestMicrophonePermission();
    case 'notifications':
      return requestNotificationPermission();
    case 'biometrics':
      return requestBiometricPermission();
    default:
      throw new Error(`Unknown mobile permission device: ${device}`);
  }
}

export async function checkMobilePermission(device: MobilePermissionDevice): Promise<PermissionRecord> {
  let enabled = false;
  switch (device) {
    case 'camera': {
      const cam = await Camera.getCameraPermissionsAsync();
      enabled = cam.status === 'granted';
      break;
    }
    case 'microphone': {
      const mic = await Audio.getPermissionsAsync();
      enabled = mic.status === 'granted';
      break;
    }
    case 'notifications': {
      const notif = await Notifications.getPermissionsAsync();
      enabled = notif.status === 'granted';
      break;
    }
    case 'biometrics': {
      const bio = await LocalAuthentication.hasHardwareAsync();
      enabled = bio;
      break;
    }
  }
  return {
    device: MOBILE_PERMISSION_MAP[device].coreDevice,
    enabled,
    mode: enabled ? 'allow' : 'ask',
    scope: [],
    updatedAt: Date.now(),
  };
}

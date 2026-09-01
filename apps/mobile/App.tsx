import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Camera from 'expo-camera';
import { Audio } from 'expo-av';
import { mobileSmoke, MOBILE_CAPABILITIES } from './src/index';
import { MobileMemoryStore } from './src/memory-mobile';
import { useRuntimeEvents } from './src/useRuntimeEvents';
import { requestMobilePermission, checkMobilePermission } from './src/permission-mobile';
import { mobileAuditRecord } from './src/permissions';

SplashScreen.preventAutoHideAsync();

type PermissionDevice = 'camera' | 'microphone' | 'notifications' | 'biometrics';

export default function App() {
  const [ready, setReady] = useState(false);
  const [text, setText] = useState('');
  const [memory] = useState(() => new MobileMemoryStore());
  const { state, on, emit, reset } = useRuntimeEvents();
  const [permissionStatus, setPermissionStatus] = useState<Record<string, string>>({});
  const [systemReady, setSystemReady] = useState(false);

  const logRuntime = useCallback(
    (tag: string, msg: string) => {
      emit({
        version: 1,
        event: 'agent.status',
        timestamp: Date.now(),
        payload: { state: 'busy', summary: `[${tag}] ${msg}` },
      });
    },
    [emit]
  );

  useEffect(() => {
    (async () => {
      try {
        await memory.initialize();
        const r = await mobileSmoke();
        if (!r.ok) {
          Alert.alert('Runtime Error', r.details);
          return;
        }

        emit({
          version: 1,
          event: 'agent.status',
          timestamp: Date.now(),
          payload: { state: 'ready', summary: 'Mobile runtime ready' },
        });

        const perms = await memory.listPermissions();
        if (perms.length === 0) {
          const defaults = [
            { device: 'camera', enabled: false, mode: 'ask' as const, scope: [], updatedAt: Date.now() },
            { device: 'microphone', enabled: false, mode: 'ask' as const, scope: [], updatedAt: Date.now() },
            { device: 'notifications', enabled: false, mode: 'ask' as const, scope: [], updatedAt: Date.now() },
            { device: 'biometrics', enabled: false, mode: 'ask' as const, scope: [], updatedAt: Date.now() },
          ];
          for (const p of defaults) await memory.savePermission(p);
        }

        const savedPerms = await memory.listPermissions();
        const statusMap: Record<string, string> = {};
        for (const p of savedPerms) {
          statusMap[p.device] = p.enabled ? 'granted' : 'denied';
        }
        setPermissionStatus(statusMap);
        emit({
          version: 1,
          event: 'permission.updated',
          timestamp: Date.now(),
          payload: { permissions: savedPerms },
        });

        const cam = await Camera.getCameraPermissionsAsync();
        const bio = await LocalAuthentication.hasHardwareAsync();
        setSystemReady(true);
        await SplashScreen.hideAsync();
        setReady(true);
      } catch (e: any) {
        Alert.alert('Initialization Error', e?.message || String(e));
      }
    })();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = Notifications.addNotificationReceivedListener((n) => {
      emit({
        version: 1,
        event: 'voice.state',
        timestamp: Date.now(),
        payload: { state: 'transcribing', transcript: n.request.content.title || '' },
      });
    });
    return () => sub.remove();
  }, [emit]);

  useEffect(() => {
    const unsub1 = on('chat.chunk', () => {});
    const unsub2 = on('chat.done', () => {});
    const unsub3 = on('chat.error', () => {});
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [on]);

  const onSend = useCallback(async () => {
    if (!text.trim()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userText = text.trim();
    setText('');
    emit({
      version: 1,
      event: 'agent.status',
      timestamp: Date.now(),
      payload: { state: 'busy', summary: 'Thinking…' },
    });

    try {
      await memory.store({
        input: userText,
        response: `[mobile stub] ${userText}`,
        mood: state.petIntent?.mood || 'neutral',
        timestamp: Date.now(),
      });
      const taskId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await memory.createTask(taskId, 'chat', userText);
      emit({ version: 1, event: 'task.started', timestamp: Date.now(), payload: { type: 'chat', taskId } });

      await new Promise((r) => setTimeout(r, 400));
      const words = userText.split(/(\s+)/);
      let acc = '';
      for (let i = 0; i < words.length; i++) {
        acc = words[i];
        if (acc) {
          emit({
            version: 1,
            event: 'chat.chunk',
            timestamp: Date.now(),
            payload: { text: acc, provider: 'mobile-stub', mood: 'neutral', animation: 'talk' },
          });
        }
        if (i % 5 === 4) await new Promise((r) => setTimeout(r, 24));
      }

      emit({ version: 1, event: 'chat.done', timestamp: Date.now(), payload: { ok: true, taskId } });
      emit({ version: 1, event: 'task.completed', timestamp: Date.now(), payload: { type: 'chat', taskId } });
      await memory.updateTask(taskId, 'completed', `[mobile stub] ${userText}`);
      await memory.logAudit('chat.completed', null, 'mobile', userText.slice(0, 300));
      emit({
        version: 1,
        event: 'agent.status',
        timestamp: Date.now(),
        payload: { state: 'ready', summary: 'Ready on your mobile' },
      });
    } catch (e: any) {
      emit({
        version: 1,
        event: 'chat.error',
        timestamp: Date.now(),
        payload: { message: e?.message || String(e) },
      });
    }
  }, [text, memory, state.petIntent?.mood, emit]);

  const onNotify = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Smart Pet Agent', body: 'Mobile runtime is alive.' },
      trigger: null,
    });
    logRuntime('notify', 'scheduled');
  }, [logRuntime]);

  const onBiometric = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Smart Pet Agent',
      fallbackLabel: 'Use passcode',
    });
    logRuntime('biometric', result.success ? 'ok' : 'failed/cancel');
  }, [logRuntime]);

  const onRequestPermission = useCallback(
    async (device: PermissionDevice) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        const record = await requestMobilePermission(device);
        await memory.savePermission(record);
        await memory.logAudit('permission.updated', device, record.mode, JSON.stringify(record));
        const perms = await memory.listPermissions();
        emit({
          version: 1,
          event: 'permission.updated',
          timestamp: Date.now(),
          payload: { permissions: perms },
        });
        setPermissionStatus((prev) => ({ ...prev, [device]: record.enabled ? 'granted' : 'denied' }));
        logRuntime('permission', `${device}:${record.mode}`);
      } catch (e: any) {
        Alert.alert('Permission Error', e?.message || String(e));
      }
    },
    [memory, emit, logRuntime]
  );

  const loadHistory = useCallback(async () => {
    const history = await memory.getChatHistory(20);
    emit({ version: 1, event: 'chat.history', timestamp: Date.now(), payload: { history } });
  }, [memory, emit]);

  const loadTasks = useCallback(async () => {
    const tasks = await memory.listTasks(20);
    emit({ version: 1, event: 'task.list', timestamp: Date.now(), payload: { tasks } });
  }, [memory, emit]);

  const loadAudit = useCallback(async () => {
    const logs = await memory.getAuditLogs(20);
    emit({ version: 1, event: 'audit.list', timestamp: Date.now(), payload: { logs } });
  }, [memory, emit]);

  useEffect(() => {
    if (!ready) return;
    loadHistory();
    loadTasks();
    loadAudit();
  }, [ready, loadHistory, loadTasks, loadAudit]);

  const statusColor =
    state.status.state === 'ready'
      ? '#2da56a'
      : state.status.state === 'error'
        ? '#d64545'
        : '#ff8a1f';

  if (!ready) {
    return (
      <View style={styles.center}>
        <Text style={styles.brand}>Smart Pet Agent</Text>
        <Text style={styles.muted}>Loading mobile runtime…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.brand}>Smart Pet Agent</Text>
        <Text style={[styles.statusLine, { color: statusColor }]}>
          {state.status.state.toUpperCase()} — {state.status.summary}
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Chat</Text>
          <ScrollView style={styles.chatBox}>
            {state.chatHistory.slice(-10).map((h, i) => (
              <Text
                key={i}
                style={[styles.log, h.role === 'user' ? styles.userMsg : styles.agentMsg]}
              >
                {h.role === 'user' ? 'You' : 'Agent'}: {h.content}
              </Text>
            ))}
            {state.chunks
              .filter((_, i) => i >= state.chunks.length - 20)
              .map((c, i) => (
                <Text key={i} style={styles.agentMsg}>
                  {c.text}
                </Text>
              ))}
            {state.error && <Text style={styles.errorMsg}>Error: {state.error}</Text>}
          </ScrollView>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Ask your pet something…"
            placeholderTextColor="rgba(242,239,232,0.42)"
            style={styles.input}
            onSubmitEditing={onSend}
            returnKeyType="send"
          />
          <Pressable onPress={onSend} style={styles.sendBtn}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <Pressable onPress={() => onRequestPermission('camera')} style={styles.pill}>
            <Text style={styles.pillText}>Camera</Text>
          </Pressable>
          <Pressable onPress={() => onRequestPermission('microphone')} style={styles.pill}>
            <Text style={styles.pillText}>Mic</Text>
          </Pressable>
          <Pressable onPress={() => onRequestPermission('notifications')} style={styles.pill}>
            <Text style={styles.pillText}>Notify</Text>
          </Pressable>
          <Pressable onPress={() => onRequestPermission('biometrics')} style={styles.pill}>
            <Text style={styles.pillText}>Bio</Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <Pressable onPress={onNotify} style={styles.pill}>
            <Text style={styles.pillText}>Notify</Text>
          </Pressable>
          <Pressable onPress={onBiometric} style={styles.pill}>
            <Text style={styles.pillText}>Biometric</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Permissions</Text>
          {Object.keys(permissionStatus).length === 0 && (
            <Text style={styles.log}>No permissions requested yet.</Text>
          )}
          {Object.entries(permissionStatus).map(([device, status]) => (
            <Text key={device} style={styles.log}>
              {device}: {status}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tasks</Text>
          {state.tasks.length === 0 && <Text style={styles.log}>No tasks yet.</Text>}
          {state.tasks.slice(0, 10).map((t) => (
            <Text key={t.id} style={styles.log}>
              {t.type} · {t.status} · {t.input.slice(0, 40)}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Audit</Text>
          {state.auditLogs.length === 0 && <Text style={styles.log}>No audit logs yet.</Text>}
          {state.auditLogs.slice(0, 10).map((l) => (
            <Text key={l.id} style={styles.log}>
              [{l.event}] {l.device}:{l.action} — {l.detail?.slice(0, 60)}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Runtime Capabilities</Text>
          <Text style={styles.log}>
            Screen: {MOBILE_CAPABILITIES.screen ? 'yes' : 'no'} · Camera:{' '}
            {MOBILE_CAPABILITIES.camera ? 'yes' : 'no'} · Mic:{' '}
            {MOBILE_CAPABILITIES.mic ? 'yes' : 'no'} · Notifications:{' '}
            {MOBILE_CAPABILITIES.notifications ? 'yes' : 'no'} · Haptics:{' '}
            {MOBILE_CAPABILITIES.haptics ? 'yes' : 'no'} · Biometrics:{' '}
            {MOBILE_CAPABILITIES.biometrics ? 'yes' : 'no'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0d10' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 14 },
  center: { flex: 1, backgroundColor: '#0a0d10', alignItems: 'center', justifyContent: 'center', gap: 12 },
  brand: { color: '#f4b400', fontSize: 24, fontWeight: '800', letterSpacing: 0.4 },
  muted: { color: 'rgba(242,239,232,0.68)', fontSize: 13 },
  statusLine: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    marginBottom: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: 'rgba(244,180,0,0.18)',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 14,
    gap: 8,
  },
  cardTitle: {
    color: '#f4b400',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.12,
    fontWeight: '700',
  },
  log: {
    color: 'rgba(242,239,232,0.72)',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 12,
  },
  userMsg: { color: '#f4b400', fontWeight: '600' },
  agentMsg: { color: 'rgba(242,239,232,0.88)' },
  errorMsg: { color: '#d64545', fontWeight: '700' },
  chatBox: { maxHeight: 180, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#f2efe8',
    padding: 12,
    fontSize: 15,
  },
  sendBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#ff8a1f',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sendText: { color: '#1a1306', fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10 },
  pill: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(244,180,0,0.24)',
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(244,180,0,0.08)',
  },
  pillText: { color: '#f4b400', fontWeight: '700', fontSize: 13 },
});

#!/usr/bin/env node
// Smart-Pet-Agent TUI — Ink-based, cross-platform (Linux/Mac/Win)
import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { AgentLoop } from '@smart-pet/core/agent-loop';

function getDataDir(): string {
  if (process.env.SMART_PET_TEST === '1') return path.join(os.tmpdir(), 'smart-pet-agent-tui');
  const p = path.join(os.homedir(), '.smart-pet-agent');
  try { fs.mkdirSync(p, { recursive: true }); return p; } catch { const f = path.join(os.tmpdir(), 'smart-pet-agent-tui'); fs.mkdirSync(f, { recursive: true }); return f; }
}
function getMemoryPath(): string {
  if (process.env.SMART_PET_TEST === '1') return ':memory:';
  return path.join(getDataDir(), 'memory.db');
}

const App = () => {
  const { exit } = useApp();
  const [lines, setLines] = useState<string[]>(['🐾 Smart-Pet-Agent TUI v0.1.0 — type, press Enter, Ctrl+C to exit']);
  const [input, setInput] = useState('');
  const [agent, setAgent] = useState<AgentLoop | null>(null);
  const [ready, setReady] = useState(false);
  const isTTY = Boolean(process.stdin.isTTY && process.stdout.isTTY);

  useEffect(() => {
    const a = new AgentLoop({ aiProviders: {}, memoryPath: getMemoryPath() });
    a.initialize().then(() => { setAgent(a); setReady(true); setLines(l => [...l, '✓ Agent ready — providers: ollama/litellm (custom LiteLLM https://my-litellm:4000/v1 supported)']); }).catch(e => setLines(l => [...l, `✖ Init failed: ${e}`]));
  }, []);

  useInput(async (char, key) => {
    if (key.ctrl && char === 'c') { exit(); return; }
    if (key.return) {
      const text = input.trim();
      if (!text) return;
      setLines(l => [...l, `You > ${text}`]);
      setInput('');
      if (text === 'exit' || text === 'quit') { exit(); return; }
      if (text === 'help') { setLines(l => [...l, 'Commands: help, state, exit, <message>']); return; }
      if (text === 'state' && agent) { setLines(l => [...l, JSON.stringify(agent.getState(), null, 2)]); return; }
      if (!agent || !ready) { setLines(l => [...l, '… agent not ready']); return; }
      try {
        const resp = await agent.processInput({ type: 'text', content: text });
        setLines(l => [...l, `Smart: ${resp.text} [${resp.mood}/${resp.animation}]`]);
      } catch (e: any) { setLines(l => [...l, `Error: ${e.message}`]); }
      return;
    }
    if (key.backspace || key.delete) { setInput(s => s.slice(0, -1)); return; }
    if (char && !key.ctrl && !key.meta) setInput(s => s + char);
  }, { isActive: isTTY });

  if (!isTTY) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text>Smart-Pet-Agent TUI requires a TTY — run in a terminal (Linux/Mac/Win Terminal, iTerm, Windows Terminal)</Text>
        <Text>For CI/headless, use CLI: pnpm --filter @smart-pet/cli dev</Text>
      </Box>
    );
  }
  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="round" borderColor="cyan" paddingX={1}><Text color="cyan">Smart-Pet-Agent — TUI (Ink) — Linux/Mac/Win</Text></Box>
      <Box flexDirection="column" marginTop={1}>
        {lines.slice(-12).map((l, i) => <Text key={i}>{l}</Text>)}
      </Box>
      <Box marginTop={1}><Text color="yellow">You &gt; </Text><Text>{input}</Text><Text color="gray">█</Text></Box>
      {!ready && <Text color="gray">… initializing (SMART_PET_TEST=1 uses :memory:)</Text>}
    </Box>
  );
};

render(<App />);

# Templates

Starter scaffolds for adding pets and provider presets. They reuse the existing spec and pet pack layout so the docs site has no duplicated truth.

## Pet templates

The canonical spec is [CUSTOM_PET_SPEC.md](CUSTOM_PET_SPEC.md); the shipped example is [PETS.md](PETS.md) (`pets/default-nyc-orb`, canvas fallback orb). Use these templates:

**Minimal pet (canvas orb fallback)**

```
pets/my-orb/
├── manifest.json        # id, name, engine:"canvas", preview
└── pet.config.json      # states: idle/listening/thinking/acting/...
```

Copy `pets/default-nyc-orb/manifest.json` and `pet.config.json` and edit `id`/`name`.

**Video pet**

```
pets/my-video-pet/
├── manifest.json        # engine:"video", preview:"assets/static.webm"
├── pet.config.json      # per-state src/loop/next
└── assets/
    ├── static.webm      # required (idle loop)
    ├── begin.webm, listening.webm, task-loop.webm ...
    └── icons/           # optional tray/bubble assets
```

Validate with `bash scripts/validate-pet.sh --checkAssets` and runtime `validatePetPack(manifest, config)` — see [CUSTOM_PET_SPEC.md](CUSTOM_PET_SPEC.md).

## Provider preset template

Seed `AIManager` via **Settings → Model Providers** or code:

```ts
new AIManager({
  ollama: { name:'ollama', type:'ollama', baseURL:'http://localhost:11434', model:'llama3.1', capabilities:['chat','streaming'] },
  openai: { name:'openai', type:'openai', baseURL:'https://api.openai.com/v1', apiKey: process.env.OPENAI_API_KEY!, model:'gpt-4o', capabilities:['chat','vision','tools'] },
})
```

See [LLM Providers](llm-providers.md) for the full type table.

## More templates

- Brand/visual direction: `docs/SMART_PET_AGENT_UI_BRAND_BRIEF_2026-08-30.md`
- Release notes template: `docs/RELEASE_NOTES_v1.0.0_READY.md`
- Waitlist landing: `docs/marketing/waitlist-landing/index.html`

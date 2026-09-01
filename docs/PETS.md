# Pets — default-nyc-orb (v1.0.0 canvas fallback)

Engine: `canvas` (CSS orb fallback, not `.webm` video). `validatePetPack` with `checkAssets:true` only warns for `video` engine.

| Intent | Halo | Animation | Notes |
|--------|------|-----------|-------|
| idle | — | idle | CSS orb resting |
| listening | civic-500 | listening | voiceTranscribing → listening halo |
| thinking | taxi-500 | thinking | ai.chat reasoning |
| planning | taxi-500 | planning | fixed in 2026-08-31 (was missing) |
| acting | signal-500 | acting | computer_use |
| waiting | steel-500 | waiting | provider pending |
| asking_permission | signal-500 | asking | confirmation required |
| celebrating | success-500 | celebrating | task.completed |
| warning | alert-500 | warning | permission denied |
| sleeping | steel-700 | sleeping | idle timeout |
| resuming | civic-500 | resuming | on restart |

`preview.svg` (927 B) is the only shipped asset for `default-nyc-orb`; no fake `.webm` files. Future video packs will add `assets/*.webm` and be verified via `bash scripts/validate-pet.sh --checkAssets`.

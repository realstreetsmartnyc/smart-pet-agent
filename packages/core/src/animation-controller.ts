// Smart-Pet-Agent — Animation Controller (Thought-Driven)
// packages/core/src/animation-controller.ts

export interface AnimationState {
  name: string;
  duration: number;
  loop: boolean;
  blendShape?: Record<string, number>;
}

export class AnimationController {
  private currentAnimation: string = 'idle';
  private queue: AnimationState[] = [];
  private listeners: Function[] = [];

  // Thought-driven animation library
  private animations: Record<string, AnimationState> = {
    idle: { name: 'idle', duration: 0, loop: true, blendShape: { breathe: 0.5 } },
    walk: { name: 'walk', duration: 800, loop: false, blendShape: { move: 1.0, legs: 0.8 } },
    fly: { name: 'fly', duration: 1200, loop: false, blendShape: { wings: 1.0, lift: 0.9 } },
    smile: { name: 'smile', duration: 600, loop: false, blendShape: { mouthSmile: 1.0, eyesHappy: 0.8 } },
    talk: { name: 'talk', duration: 0, loop: true, blendShape: { mouthOpen: 0.6, headTilt: 0.2 } },
    sleep: { name: 'sleep', duration: 0, loop: true, blendShape: { eyesClosed: 1.0, breathe: 0.3 } },
    dance: { name: 'dance', duration: 2000, loop: true, blendShape: { bodySway: 0.8, arms: 0.6 } },
    wink: { name: 'wink', duration: 400, loop: false, blendShape: { eyeWinkLeft: 1.0 } },
    think: { name: 'think', duration: 0, loop: true, blendShape: { headTilt: 0.4, browFurrow: 0.3 } },
    wave: { name: 'wave', duration: 800, loop: false, blendShape: { armWave: 1.0 } },
    sad: { name: 'sad', duration: 0, loop: true, blendShape: { mouthFrown: 0.7, eyesSad: 0.6 } },
    angry: { name: 'angry', duration: 0, loop: true, blendShape: { browAngry: 0.8, mouthTight: 0.5 } },
    point: { name: 'point', duration: 600, loop: false, blendShape: { armPoint: 1.0 } },
    alert: { name: 'alert', duration: 500, loop: false, blendShape: { eyesWide: 0.9, bodyStiff: 0.7 } },
    celebrate: { name: 'celebrate', duration: 1500, loop: false, blendShape: { jump: 1.0, armsUp: 0.9 } },
  };

  async play(name: string, params?: any): Promise<void> {
    const anim = this.animations[name];
    if (!anim) {
      console.warn(`[Animation] Unknown: ${name}`);
      return;
    }

    this.currentAnimation = name;
    this.emit('animation:start', { name, ...anim });

    if (anim.duration > 0) {
      await new Promise(resolve => setTimeout(resolve, anim.duration));
      this.emit('animation:complete', { name });
    }
  }

  getCurrent(): string {
    return this.currentAnimation;
  }

  getAvailable(): string[] {
    return Object.keys(this.animations);
  }

  on(listener: Function): void {
    this.listeners.push(listener);
  }

  private emit(event: string, data: any): void {
    this.listeners.forEach(fn => fn(event, data));
  }
}

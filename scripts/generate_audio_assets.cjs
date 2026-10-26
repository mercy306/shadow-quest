const fs = require('fs');
const path = require('path');

const sampleRate = 44100;

function createWavBuffer(samples, rate = sampleRate) {
  const byteLength = samples.length * 2;
  const buffer = Buffer.alloc(44 + byteLength);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + byteLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // Mono
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24);
  buffer.writeUInt32LE(rate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(byteLength, 40);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(s < 0 ? s * 0x8000 : s * 0x7FFF, 44 + i * 2);
  }

  return buffer;
}

// 1. Sword Swing (air whoosh + blade sweep)
function genSwordSwing() {
  const duration = 0.22;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.sin((t / duration) * Math.PI);
    const freq = 420 * Math.exp(-t * 8) + 80;
    const tone = Math.sin(2 * Math.PI * freq * t);
    const noise = (Math.random() * 2 - 1) * 0.45;
    samples[i] = (tone * 0.6 + noise * 0.4) * env * 0.85;
  }
  return samples;
}

// 2. Sword Impact (metallic clash + thud)
function genSwordHit() {
  const duration = 0.32;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 14);
    const metal1 = Math.sin(2 * Math.PI * 1120 * t);
    const metal2 = Math.sin(2 * Math.PI * 840 * t);
    const thud = Math.sin(2 * Math.PI * 140 * Math.exp(-t * 20) * t);
    const noise = (Math.random() * 2 - 1) * 0.3;
    samples[i] = (metal1 * 0.35 + metal2 * 0.35 + thud * 0.45 + noise * 0.2) * env;
  }
  return samples;
}

// 3. Enemy Attack (beast whoosh + roar)
function genEnemyAttack() {
  const duration = 0.45;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.sin((t / duration) * Math.PI);
    const growl = Math.sin(2 * Math.PI * (160 + Math.sin(t * 40) * 40) * t);
    const sub = Math.sin(2 * Math.PI * 75 * t);
    const noise = (Math.random() * 2 - 1) * 0.35;
    samples[i] = (growl * 0.5 + sub * 0.4 + noise * 0.3) * env * 0.9;
  }
  return samples;
}

// 4. Enemy Death (deep descent + crumbling impact)
function genEnemyDeath() {
  const duration = 0.7;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 4.5);
    const freq = 280 * Math.exp(-t * 5) + 40;
    const tone = Math.sin(2 * Math.PI * freq * t);
    const sub = Math.sin(2 * Math.PI * (freq * 0.5) * t);
    const rumble = (Math.random() * 2 - 1) * 0.4;
    samples[i] = (tone * 0.45 + sub * 0.35 + rumble * 0.3) * env;
  }
  return samples;
}

// 5. Crystal Collect (crystalline sparkling chimes)
function genCrystalCollect() {
  const duration = 0.75;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  const freqs = [1046.50, 1318.51, 1567.98, 1975.53, 2093.00];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sum = 0;
    freqs.forEach((f, idx) => {
      const delay = idx * 0.05;
      if (t >= delay) {
        const localT = t - delay;
        const env = Math.exp(-localT * 6.0);
        sum += Math.sin(2 * Math.PI * f * localT) * env * 0.22;
      }
    });
    samples[i] = sum;
  }
  return samples;
}

// 6. Player Damage (body impact thud + pain warning)
function genPlayerDamage() {
  const duration = 0.35;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 10);
    const thud = Math.sin(2 * Math.PI * 90 * Math.exp(-t * 12) * t);
    const sting1 = Math.sin(2 * Math.PI * 220 * t);
    const sting2 = Math.sin(2 * Math.PI * 233 * t); // Dissonant clash
    const noise = (Math.random() * 2 - 1) * 0.25;
    samples[i] = (thud * 0.6 + (sting1 + sting2) * 0.25 + noise * 0.2) * env;
  }
  return samples;
}

// 7. Jump (airy upward pitch glide)
function genJump() {
  const duration = 0.25;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.sin((t / duration) * Math.PI);
    const freq = 120 + 260 * (t / duration);
    const tone = Math.sin(2 * Math.PI * freq * t);
    const noise = (Math.random() * 2 - 1) * 0.25;
    samples[i] = (tone * 0.6 + noise * 0.3) * env * 0.7;
  }
  return samples;
}

// 8. Land (solid footstep crunch)
function genLand() {
  const duration = 0.18;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 22);
    const thud = Math.sin(2 * Math.PI * 70 * t);
    const crunch = (Math.random() * 2 - 1) * 0.45;
    samples[i] = (thud * 0.55 + crunch * 0.45) * env;
  }
  return samples;
}

// 9. Victory Fanfare (glorious orchestral brass chord)
function genVictoryFanfare() {
  const duration = 2.4;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  const notes = [
    { f: 523.25, t: 0.0, d: 0.2 },
    { f: 659.25, t: 0.18, d: 0.2 },
    { f: 783.99, t: 0.36, d: 0.3 },
    { f: 1046.50, t: 0.6, d: 1.7 },
    { f: 1318.51, t: 0.6, d: 1.7 }
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sum = 0;
    notes.forEach(n => {
      if (t >= n.t && t <= n.t + n.d) {
        const localT = t - n.t;
        const env = Math.min(1, localT / 0.04) * Math.exp(-localT * 1.8);
        const osc1 = Math.sin(2 * Math.PI * n.f * localT);
        const osc2 = Math.sin(2 * Math.PI * (n.f * 2) * localT) * 0.3;
        sum += (osc1 + osc2) * env * 0.25;
      }
    });
    samples[i] = sum;
  }
  return samples;
}

// 10. Forest Ambience (looping 4-second gentle wind & woodland drone)
function genForestAmbience() {
  const duration = 4.0;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const drone1 = Math.sin(2 * Math.PI * 146.83 * t); // D3
    const drone2 = Math.sin(2 * Math.PI * 220.00 * t); // A3
    const drone3 = Math.sin(2 * Math.PI * 293.66 * t); // D4
    const lfo = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.5 * t);
    const rustle = (Math.random() * 2 - 1) * 0.08 * lfo;
    samples[i] = ((drone1 * 0.4 + drone2 * 0.3 + drone3 * 0.2) * 0.18 + rustle) * 0.5;
  }
  return samples;
}

// 11. Ruins Nocturne Ambience (mystical nocturnal pad & low wind)
function genRuinsAmbience() {
  const duration = 4.0;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const drone1 = Math.sin(2 * Math.PI * 110.00 * t); // A2
    const drone2 = Math.sin(2 * Math.PI * 164.81 * t); // E3
    const drone3 = Math.sin(2 * Math.PI * 261.63 * t); // C4 (minor)
    const lfo = 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.25 * t);
    const mist = (Math.random() * 2 - 1) * 0.06 * lfo;
    samples[i] = ((drone1 * 0.4 + drone2 * 0.35 + drone3 * 0.25) * 0.2 + mist) * 0.5;
  }
  return samples;
}

const outDir = path.join(__dirname, '..', 'public', 'audio');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const sounds = [
  { name: 'sword_swing.wav', gen: genSwordSwing },
  { name: 'sword_hit.wav', gen: genSwordHit },
  { name: 'enemy_attack.wav', gen: genEnemyAttack },
  { name: 'enemy_death.wav', gen: genEnemyDeath },
  { name: 'crystal_collect.wav', gen: genCrystalCollect },
  { name: 'player_damage.wav', gen: genPlayerDamage },
  { name: 'jump.wav', gen: genJump },
  { name: 'land.wav', gen: genLand },
  { name: 'victory.wav', gen: genVictoryFanfare },
  { name: 'forest_ambience.wav', gen: genForestAmbience },
  { name: 'ruins_ambience.wav', gen: genRuinsAmbience }
];

sounds.forEach(s => {
  const samples = s.gen();
  const wavBuf = createWavBuffer(samples);
  const targetPath = path.join(outDir, s.name);
  fs.writeFileSync(targetPath, wavBuf);
  console.log(`Generated audio asset: ${s.name} (${(wavBuf.length / 1024).toFixed(1)} KB)`);
});

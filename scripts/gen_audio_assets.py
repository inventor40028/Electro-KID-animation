"""Synthesizes the engine's royalty-free sound library: public/sfx/*.wav and public/music/*.wav.

Everything is generated procedurally with numpy, so the engine has no third-party audio licensing.
Drop your own files with the same names into public/sfx or public/music to override any of them.
usage: python scripts/gen_audio_assets.py
"""
import os
import wave
import numpy as np
from scipy.signal import lfilter

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SFX_DIR = os.path.join(ROOT, "public", "sfx")
MUS_DIR = os.path.join(ROOT, "public", "music")
rng = np.random.default_rng(42)


def t_(d):
    return np.arange(int(SR * d)) / SR


def env(n, a=0.005, d=0.2, curve=4.0):
    t = np.arange(n) / SR
    att = np.clip(t / max(a, 1e-4), 0, 1)
    dec = np.exp(-np.maximum(t - a, 0) * curve / max(d, 1e-4))
    return att * dec


def noise(d):
    return rng.uniform(-1, 1, int(SR * d))


def lp(x, cutoff):
    """one-pole low-pass; cutoff may be an array (applied block-wise)"""
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    y = np.empty_like(x)
    zi = np.zeros(1)
    B = 256
    for i in range(0, len(x), B):
        a = np.exp(-2 * np.pi * cutoff[i] / SR)
        y[i:i + B], zi = lfilter([1 - a], [1, -a], x[i:i + B], zi=zi * 1.0)
    return y


def lp_fast(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    return lfilter([1 - a], [1, -a], x)


def hp(x, cutoff):
    return x - lp_fast(x, cutoff)


def sweep(f0, f1, d, shape="sin"):
    t = t_(d)
    f = f0 * (f1 / f0) ** (t / d) if f0 > 0 and f1 > 0 else np.linspace(f0, f1, len(t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) if shape == "sin" else np.sign(np.sin(ph)) * 0.6


def tone(f, d, kind="sin"):
    t = t_(d)
    if kind == "sin":
        return np.sin(2 * np.pi * f * t)
    if kind == "tri":
        return 2 * np.abs(2 * ((f * t) % 1) - 1) - 1
    if kind == "saw":
        return 2 * ((f * t) % 1) - 1
    if kind == "sq":
        return np.sign(np.sin(2 * np.pi * f * t))


def bell(f, d, bright=1.0):
    t = t_(d)
    mod = np.sin(2 * np.pi * f * 3.5 * t) * bright * 2.0 * np.exp(-t * 6)
    return np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 3.0)


def pad(x, d):
    n = int(SR * d)
    return np.pad(x, (0, max(0, n - len(x))))[:n]


def mix(*xs):
    n = max(len(x) for x in xs)
    out = np.zeros(n)
    for x in xs:
        out[: len(x)] += x
    return out


def at(x, delay):
    return np.concatenate([np.zeros(int(SR * delay)), x])


def norm(x, peak=0.89):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


def fade(x, fi=0.003, fo=0.05):
    n = len(x)
    a = np.ones(n)
    i = min(n // 4, int(SR * fi))
    o = min(n // 3, int(SR * fo))
    if i:
        a[:i] = np.linspace(0, 1, i)
    if o:
        a[-o:] *= np.linspace(1, 0, o)
    return x * a


def save(path, x, stereo=False):
    x = np.clip(x, -1, 1)
    data = (x * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2 if stereo else 1)
        w.setsampwidth(2)
        w.setframerate(SR)
        if stereo:
            data = data.reshape(-1)
        w.writeframes(data.tobytes())


# ------------------------------------------------------------------ SFX
def whoosh(d=0.55, up=True):
    n = noise(d)
    t = t_(d)
    shape = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    cut = 300 + 3500 * (t / d if up else 1 - t / d)
    return lp_fast(n, 1800) * 0 + lp(n, cut) * shape * 1.5


def build_sfx():
    S = {}
    S["whoosh"] = whoosh(0.6)
    S["swoosh"] = whoosh(0.32)
    S["pop"] = mix(sweep(900, 250, 0.09) * env(int(SR * 0.09), 0.001, 0.05), lp_fast(noise(0.03), 4000) * env(int(SR * 0.03), 0.001, 0.01) * 0.4)
    S["click"] = lp_fast(noise(0.02), 6000) * env(int(SR * 0.02), 0.0005, 0.004)
    S["ding"] = bell(1318, 1.2, 0.6)
    S["sparkle"] = mix(*[at(bell(f, 0.7, 0.4) * 0.6, i * 0.06) for i, f in enumerate([2093, 2637, 3136, 4186, 3520])], hp(noise(0.8), 6000) * env(int(SR * 0.8), 0.05, 0.6) * 0.15)
    S["chime"] = mix(*[at(bell(f, 1.5, 0.3), i * 0.09) for i, f in enumerate([1046, 1318, 1568, 2093])])
    S["impact"] = mix(sweep(120, 40, 0.5) * env(int(SR * 0.5), 0.001, 0.3) * 1.2, lp_fast(noise(0.25), 1500) * env(int(SR * 0.25), 0.001, 0.08))
    S["thud"] = mix(sweep(90, 45, 0.35) * env(int(SR * 0.35), 0.001, 0.15), lp_fast(noise(0.1), 600) * env(int(SR * 0.1), 0.001, 0.03) * 0.8)
    S["boom"] = mix(sweep(70, 25, 2.0) * env(int(SR * 2.0), 0.002, 1.2) * 1.3, lp(noise(2.0), np.linspace(2500, 120, int(SR * 2.0))) * env(int(SR * 2.0), 0.002, 1.0))
    S["crash"] = mix(hp(noise(1.2), 1500) * env(int(SR * 1.2), 0.001, 0.5), S["thud"] * 0.8, *[at(bell(f, 0.4, 2) * 0.25, rng.uniform(0, 0.25)) for f in rng.uniform(2000, 6000, 8)])
    S["glass"] = mix(*[at(bell(f, 0.5, 3) * 0.35, rng.uniform(0, 0.35)) for f in rng.uniform(2500, 7500, 16)], hp(noise(0.6), 3000) * env(int(SR * 0.6), 0.001, 0.2) * 0.5)
    S["cash"] = mix(lp_fast(noise(0.15), 3000) * env(int(SR * 0.15), 0.001, 0.05), at(bell(2637, 1.0, 0.8), 0.08), at(bell(3520, 1.0, 0.8), 0.12))
    S["coins"] = mix(*[at(bell(f, 0.3, 1.5) * 0.4, i * 0.05 + rng.uniform(0, 0.03)) for i, f in enumerate(rng.uniform(3000, 6000, 10))])
    S["tick"] = mix(lp_fast(noise(0.015), 5000) * env(int(SR * 0.015), 0.0005, 0.004), at(lp_fast(noise(0.015), 3000) * env(int(SR * 0.015), 0.0005, 0.004) * 0.7, 0.5))
    S["clock"] = mix(*[at(S["tick"] * 0.8, i * 1.0) for i in range(3)])
    beat = sweep(70, 45, 0.15) * env(int(SR * 0.15), 0.002, 0.07)
    S["heartbeat"] = mix(beat, at(beat * 0.7, 0.22), at(beat, 0.9), at(beat * 0.7, 1.12))
    S["rumble"] = lp(noise(2.5), 120) * np.sin(np.pi * t_(2.5) / 2.5) * 6
    S["splash"] = mix(lp(noise(0.9), np.linspace(6000, 600, int(SR * 0.9))) * env(int(SR * 0.9), 0.002, 0.4), sweep(400, 150, 0.2) * env(int(SR * 0.2), 0.001, 0.1) * 0.5)
    S["water"] = mix(*[at(sweep(rng.uniform(500, 900), rng.uniform(1200, 2000), 0.06) * env(int(SR * 0.06), 0.002, 0.03) * 0.5, rng.uniform(0, 1.2)) for _ in range(14)])
    S["wind"] = lp(noise(3.0), 400 + 300 * np.sin(t_(3.0) * 2)) * np.sin(np.pi * t_(3.0) / 3.0) * 3
    rain = hp(noise(3.0), 2500) * 0.25
    for _ in range(60):
        rain = mix(rain, at(lp_fast(noise(0.01), 4000) * env(int(SR * 0.01), 0.0005, 0.003) * 0.5, rng.uniform(0, 2.9)))
    S["rain"] = rain * np.minimum(1, np.minimum(t_(len(rain) / SR) / 0.4, 1))
    S["thunder"] = mix(lp(noise(3.0), np.linspace(3000, 150, int(SR * 3.0))) * env(int(SR * 3.0), 0.01, 1.8) * 1.4, S["boom"] * 0.5)
    S["slide"] = sweep(300, 1200, 0.4, "sq") * env(int(SR * 0.4), 0.02, 0.4, 2) * 0.3
    t = t_(0.5)
    S["boing"] = np.sin(2 * np.pi * np.cumsum(180 + 120 * np.sin(2 * np.pi * 12 * t) * np.exp(-t * 4)) / SR) * env(len(t), 0.002, 0.45, 3)
    S["scratch"] = lp(noise(0.5), 300 + 2500 * np.abs(np.sin(2 * np.pi * 4 * t))) * env(len(t), 0.01, 0.5, 2) * 2
    S["type"] = mix(*[at(S["click"] * 0.8, i * 0.09 + rng.uniform(0, 0.03)) for i in range(10)])
    S["alarm"] = mix(*[at(tone(880, 0.25, "sq") * 0.25 * env(int(SR * 0.25), 0.005, 0.25, 1), i * 0.35) for i in range(4)])
    S["buzz"] = lp_fast(tone(110, 0.6, "saw"), 1800) * env(int(SR * 0.6), 0.01, 0.6, 1) * 0.6
    S["beep"] = tone(1000, 0.15) * env(int(SR * 0.15), 0.003, 0.15, 1) * 0.5
    S["bell"] = bell(880, 2.5, 1.0)
    S["gasp"] = lp(noise(0.45), np.linspace(1200, 3500, int(SR * 0.45))) * env(int(SR * 0.45), 0.08, 0.35, 3) * 1.2
    laugh = np.zeros(1)
    for i in range(6):
        laugh = mix(laugh, at(lp_fast(tone(240 - i * 10, 0.12, "saw"), 1500) * env(int(SR * 0.12), 0.01, 0.1, 3) * 0.5, i * 0.16))
    S["laugh"] = laugh
    crowd = np.zeros(int(SR * 2.5))
    for _ in range(18):
        crowd = mix(crowd, at(laugh * rng.uniform(0.2, 0.5), rng.uniform(0, 1.6)))
    S["crowd"] = mix(crowd, lp(noise(2.5), 900) * 0.15)
    step = lp_fast(noise(0.06), 900) * env(int(SR * 0.06), 0.001, 0.02)
    S["footsteps"] = mix(*[at(step * (0.8 if i % 2 else 1), i * 0.32) for i in range(6)])
    S["door"] = mix(sweep(200, 140, 0.6, "sq") * 0.08 * env(int(SR * 0.6), 0.05, 0.6, 2), at(S["thud"], 0.55))
    k = mix(lp_fast(noise(0.05), 1200) * env(int(SR * 0.05), 0.001, 0.015), sweep(160, 100, 0.08) * env(int(SR * 0.08), 0.001, 0.03))
    S["knock"] = mix(k, at(k, 0.18), at(k, 0.36))
    S["paper"] = hp(noise(0.35), 2500) * env(int(SR * 0.35), 0.02, 0.3, 3) * 0.8
    S["stamp"] = mix(S["thud"], lp_fast(noise(0.05), 3000) * env(int(SR * 0.05), 0.001, 0.02) * 0.5)
    S["riser"] = mix(sweep(200, 1600, 2.0, "sq") * 0.08, lp(noise(2.0), np.linspace(400, 8000, int(SR * 2.0))) * 0.6) * np.linspace(0, 1, int(SR * 2.0)) ** 2
    S["drop"] = mix(sweep(600, 40, 0.8) * env(int(SR * 0.8), 0.002, 0.8, 2), S["impact"] * 0.8)
    S["suspense"] = mix(*[tone(f, 3.0, "saw") * 0.12 for f in [110, 116.5, 164.8]]) * np.sin(np.pi * t_(3.0) / 3.0)
    S["suspense"] = lp_fast(S["suspense"], 900)
    S["magic"] = mix(*[at(bell(f, 0.9, 0.5) * 0.5, i * 0.05) for i, f in enumerate([1046, 1318, 1568, 2093, 2637, 3136, 4186])], hp(noise(1.2), 5000) * env(int(SR * 1.2), 0.1, 1.0, 3) * 0.2)
    S["fail"] = mix(*[at(lp_fast(tone(f, 0.35, "saw"), 1500) * env(int(SR * 0.35), 0.01, 0.35, 2) * 0.4, i * 0.3) for i, f in enumerate([392, 370, 349, 330])])
    S["success"] = mix(*[at(bell(f, 0.8, 0.6) * 0.6, i * 0.1) for i, f in enumerate([523, 659, 784, 1046])])
    S["punch"] = mix(lp_fast(noise(0.12), 2000) * env(int(SR * 0.12), 0.001, 0.04) * 1.2, sweep(150, 50, 0.2) * env(int(SR * 0.2), 0.001, 0.08))
    S["zap"] = sweep(2500, 200, 0.3, "sq") * env(int(SR * 0.3), 0.001, 0.3, 3) * 0.4
    S["fire"] = lp(noise(2.5), 1200) * (0.5 + 0.5 * np.abs(np.sin(t_(2.5) * 9))) * np.sin(np.pi * t_(2.5) / 2.5) * 2
    S["engine"] = lp_fast(tone(45, 2.0, "saw") * (1 + 0.4 * np.sin(2 * np.pi * 12 * t_(2.0))), 500) * np.sin(np.pi * t_(2.0) / 2.0)
    S["horn"] = lp_fast(mix(tone(392, 0.6, "saw"), tone(494, 0.6, "saw")), 2500) * env(int(SR * 0.6), 0.02, 0.6, 1) * 0.4
    S["gunshot"] = mix(hp(noise(0.5), 400) * env(int(SR * 0.5), 0.0005, 0.12) * 1.3, sweep(200, 50, 0.3) * env(int(SR * 0.3), 0.001, 0.1))
    S["metal"] = mix(*[bell(f, 1.0, 2.5) * 0.4 for f in [523, 1307, 2210, 3301]], lp_fast(noise(0.05), 5000) * env(int(SR * 0.05), 0.0005, 0.01))
    S["creak"] = lp_fast(np.sign(np.sin(2 * np.pi * np.cumsum(60 + 40 * np.sin(2 * np.pi * 1.5 * t_(1.0))) / SR)) * (rng.uniform(0, 1, int(SR)) > 0.6), 1500) * np.sin(np.pi * t_(1.0)) * 0.6
    S["squeak"] = sweep(1800, 2600, 0.15) * env(int(SR * 0.15), 0.01, 0.15, 2) * 0.4
    os.makedirs(SFX_DIR, exist_ok=True)
    for name, x in S.items():
        save(os.path.join(SFX_DIR, f"{name}.wav"), fade(norm(x, 0.85)))
    return list(S)


# ------------------------------------------------------------------ MUSIC
NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}


def hz(name, octave):
    return 440.0 * 2 ** ((NOTE[name] + (octave - 4) * 12 - 9) / 12)


def chord_freqs(root, quality, octave=3):
    iv = {"maj": [0, 4, 7, 11], "min": [0, 3, 7, 10], "sus": [0, 5, 7, 10], "dim": [0, 3, 6, 9]}[quality]
    base = NOTE[root] + (octave - 4) * 12 - 9
    return [440.0 * 2 ** ((base + i) / 12) for i in iv]


def ks_pluck(f, d, damp=0.996):
    n = int(SR * d)
    p = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, p)
    out = np.zeros(n + p)
    for k in range(0, n, p):
        out[k:k + p] = buf
        buf = damp * 0.5 * (buf + np.roll(buf, -1))
    return out[:n]


def soft_pad(freqs, d):
    t = t_(d)
    x = np.zeros(len(t))
    for f in freqs:
        for det in (-0.12, 0.0, 0.12):
            x += 2 * (((f * 2 ** (det / 12)) * t + rng.uniform()) % 1) - 1
    x = lp_fast(x / (len(freqs) * 3), 900)
    a = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.6)
    return x * a


def kick():
    return sweep(110, 40, 0.3) * env(int(SR * 0.3), 0.001, 0.15)


def hat():
    return hp(noise(0.05), 7000) * env(int(SR * 0.05), 0.0005, 0.02) * 0.35


MOODS = {
    # bpm, progression, scale notes for plucks, drums
    "curious": (96, [("C", "maj"), ("A", "min"), ("F", "maj"), ("G", "sus")], ["C", "E", "G", "A", "D"], "light"),
    "warm": (84, [("F", "maj"), ("C", "maj"), ("D", "min"), ("A#", "maj")], ["F", "A", "C", "D", "G"], "none"),
    "mystery": (80, [("A", "min"), ("F", "maj"), ("D", "min"), ("E", "sus")], ["A", "C", "E", "B", "D"], "none"),
    "tense": (110, [("D", "min"), ("D", "min"), ("A#", "maj"), ("A", "sus")], ["D", "F", "A", "C#", "E"], "pulse"),
    "upbeat": (118, [("G", "maj"), ("E", "min"), ("C", "maj"), ("D", "maj")], ["G", "B", "D", "E", "A"], "full"),
    "sad": (72, [("A", "min"), ("F", "maj"), ("C", "maj"), ("G", "maj")], ["A", "C", "E", "G"], "none"),
}


def build_music():
    os.makedirs(MUS_DIR, exist_ok=True)
    for mood, (bpm, prog, scale, drums) in MOODS.items():
        beat = 60 / bpm
        bar = beat * 4
        bars = 16
        total = bar * bars
        out = np.zeros(int(SR * total) + SR)
        for b in range(bars):
            root, q = prog[b % len(prog)]
            start = int(SR * b * bar)
            p = soft_pad(chord_freqs(root, q, 3), bar + 0.4) * 0.5
            out[start:start + len(p)] += p
            bass = lp_fast(tone(hz(root, 2), bar, "tri"), 400) * env(int(SR * bar), 0.01, bar, 1.5) * 0.45
            out[start:start + len(bass)] += bass
            for s in range(8):
                if (s + b) % 3 == 2 and mood in ("sad", "warm"):
                    continue
                n = scale[(s * 2 + b) % len(scale)]
                octv = 5 if s % 2 else 4
                pl = ks_pluck(hz(n, octv), beat * 1.5, 0.995) * 0.18
                i0 = start + int(SR * s * beat / 2)
                out[i0:i0 + len(pl)] += pl[: max(0, len(out) - i0)]
            if drums != "none":
                for s in range(4):
                    i0 = start + int(SR * s * beat)
                    if drums in ("full", "pulse") or s in (0, 2):
                        k = kick() * (0.5 if drums == "light" else 0.7)
                        out[i0:i0 + len(k)] += k
                    for h in range(2):
                        j = i0 + int(SR * h * beat / 2)
                        hh = hat() * (0.6 if drums == "light" else 1)
                        out[j:j + len(hh)] += hh
        out = out[: int(SR * total)]
        # seamless loop: crossfade the tail into the head
        xf = int(SR * 0.5)
        out[:xf] = out[:xf] * np.linspace(0, 1, xf) + 0
        out[-xf:] *= np.linspace(1, 0, xf)
        save(os.path.join(MUS_DIR, f"{mood}.wav"), norm(out, 0.7))
        print("music", mood, f"{total:.1f}s")


if __name__ == "__main__":
    names = build_sfx()
    print("sfx:", len(names))
    build_music()

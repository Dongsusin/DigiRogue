"""Render the original, AI-composed Digirouge soundtrack.
No recordings, samples, melodies, MIDI files or soundfonts are imported.
Reproduce: python -m pip install numpy scipy soundfile
           python scripts/audio/render_soundtrack.py
"""
from pathlib import Path
import sys, json, hashlib
ROOT = Path(__file__).resolve().parents[2]
runtime = ROOT / ".cache" / "audio-runtime"
if runtime.exists(): sys.path.insert(0, str(runtime))
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
OUT = ROOT / "public" / "BGM" / "ai"
OUT.mkdir(parents=True, exist_ok=True)
TAU = 2 * np.pi
MAJOR = [0, 2, 4, 5, 7, 9, 11]
MINOR = [0, 2, 3, 5, 7, 8, 10]
SCALES = {"major": MAJOR, "minor": MINOR, "lydian": [0, 2, 4, 6, 7, 9, 11],
          "dorian": [0, 2, 3, 5, 7, 9, 10], "harmonic-minor": [0, 2, 3, 5, 7, 8, 11]}
# Melodies are scale degrees, beat onset, beat length. Each phrase spans two bars.
MOTIFS = {
    "digital-dawn": [
        [(4,0,1),(5,1,.5),(6,1.5,.5),(8,2,1.5),(6,3.5,.5),(5,4,1),(4,5,1),(2,6,2)],
        [(4,0,1),(5,1,1),(6,2,.75),(5,2.75,.25),(4,3,1),(2,4,1),(1,5,.5),(2,5.5,.5),(4,6,2)],
        [(6,0,1.5),(8,1.5,.5),(9,2,1),(8,3,1),(6,4,1),(5,5,1),(4,6,2)],
        [(5,0,1),(4,1,.5),(2,1.5,.5),(1,2,1),(2,3,1),(4,4,1.5),(5,5.5,.5),(4,6,2)]],
    "packet-meadow": [
        [(0,0,.5),(2,.75,.5),(4,1.5,.75),(6,2.5,.5),(4,3.25,.5),(5,4,.5),(4,4.75,.5),(2,5.5,1),(1,7,.75)],
        [(2,0,.5),(4,.75,.5),(5,1.5,1),(4,3,.5),(2,4,.5),(1,4.75,.5),(0,5.5,1.5)],
        [(4,0,.75),(6,1,.5),(8,1.75,.75),(6,3,.75),(5,4,.5),(4,4.75,.5),(2,5.5,1),(4,7,.75)],
        [(5,0,.75),(4,1,.5),(2,1.75,.75),(1,3,.75),(0,4,1.5),(2,6,.75),(0,7,.75)]],
    "circuit-breakers": [
        [(0,0,.75),(0,1,.25),(2,1.5,.5),(4,2,.75),(5,3,.5),(4,3.5,.5),(2,4,1),(0,5,.5),(-1,6,.5),(0,7,.75)],
        [(4,0,1),(5,1.5,.5),(6,2,.75),(8,3,.75),(6,4,1),(5,5,.5),(4,6,1.5)],
        [(6,0,.75),(6,1,.25),(8,1.5,.5),(9,2,1),(8,3.5,.5),(6,4,1),(5,5,.5),(4,6,1.5)],
        [(5,0,1),(4,1.5,.5),(2,2,.75),(1,3,.75),(0,4,1.5),(-1,6,.5),(0,7,.75)]],
    "overclock-apex": [
        [(0,0,.5),(1,.75,.25),(2,1.5,.5),(4,2,.75),(3,3,.5),(2,3.75,.25),(1,4.5,.5),(0,5.5,1),(-1,7,.5)],
        [(4,0,.75),(5,1,.5),(6,1.75,.75),(5,3,.5),(4,4,1),(3,5.5,.5),(2,6.5,1)],
        [(7,0,1),(6,1.5,.5),(5,2,.75),(4,3,.5),(6,4,.75),(5,5,.5),(4,6,1.5)],
        [(3,0,1),(2,1.5,.5),(1,2,.75),(-1,3,.5),(0,4,1.5),(4,6,.5),(0,7,.75)]],
    "homeward-signal": [
        [(4,0,1.5),(2,2,1),(1,3,1),(0,4,2),(2,6,1.5)],
        [(1,0,2),(2,2,1),(4,3,1),(5,4,1.5),(4,6,1.5)],
        [(6,0,2),(5,2,1),(4,3,1),(2,4,2),(1,6,1.5)],
        [(2,0,1.5),(1,2,1),(0,3,1),(-1,4,1.5),(0,6,2)]],
    "neon-horizon": [
        [(0,0,.75),(4,1,.5),(6,1.75,.75),(8,3,1),(7,4.5,.5),(6,5.25,.75),(4,6.5,1)],
        [(2,0,1.25),(4,1.5,.5),(5,2.25,.75),(6,3.5,.5),(4,4.25,.75),(2,5.5,.5),(1,6.5,1)],
        [(4,0,.75),(6,1,.5),(9,1.75,1.25),(8,3.5,.5),(7,4.25,.75),(6,5.5,.5),(8,6.5,1)],
        [(5,0,.75),(4,1,.5),(2,1.75,.75),(4,3,.5),(1,4,1),(2,5.5,.5),(0,6.5,1)]],
    "prism-canopy": [
        [(2,.25,.75),(3,1.25,.5),(4,2,1.25),(6,3.5,.5),(5,4.25,.75),(3,5.5,.75),(4,7,.75)],
        [(6,.25,.75),(4,1.25,.5),(3,2,1),(2,3.5,.5),(0,4.25,1.25),(1,6,.75),(2,7,.75)],
        [(4,.25,.75),(5,1.25,.5),(6,2,1),(8,3.5,.5),(7,4.25,.75),(6,5.5,.75),(3,7,.75)],
        [(5,.25,.75),(3,1.25,.5),(2,2,1.25),(1,3.5,.5),(2,4.25,.75),(0,5.5,2)]],
    "pulse-runners": [
        [(0,0,.5),(2,.75,.25),(3,1.25,.5),(4,2,.75),(6,3,.5),(5,3.75,.25),(4,4.5,.5),(2,5.5,.75),(0,7,.5)],
        [(2,0,.5),(4,.75,.25),(5,1.25,.5),(6,2,.75),(8,3,.5),(6,3.75,.25),(5,4.5,.5),(4,5.5,1.75)],
        [(6,0,.5),(8,.75,.25),(9,1.25,.5),(8,2,.75),(6,3,.5),(5,3.75,.25),(6,4.5,.5),(4,5.5,.75),(2,7,.5)],
        [(5,0,.5),(4,.75,.25),(2,1.25,.5),(3,2,.75),(1,3,.5),(2,3.75,.25),(0,4.5,1),(-1,6,.5),(0,7,.75)]],
    "singularity-core": [
        [(0,0,.75),(6,1,.25),(7,1.5,.5),(4,2.5,.5),(3,3.25,.75),(2,4.5,.5),(1,5.25,.75),(-1,6.5,1)],
        [(0,0,1.5),(2,2,.5),(3,2.75,.75),(4,4,.5),(6,4.75,.75),(7,6,1.5)],
        [(9,0,.75),(7,1,.25),(6,1.5,.5),(4,2.5,.5),(6,3.25,.75),(5,4.5,.5),(4,5.25,.75),(3,6.5,1)],
        [(4,0,.75),(3,1,.25),(1,1.5,.5),(2,2.5,.5),(-1,3.25,.75),(0,4.5,1.5),(7,6.5,.5),(0,7.25,.5)]],
    "starlight-harbor": [
        [(2,.5,1.5),(4,2.5,1),(6,4,2),(5,6.5,1)],
        [(4,.5,1.5),(2,2.5,1),(1,4,1.5),(2,6,1.5)],
        [(6,.5,1.5),(8,2.5,1),(7,4,1.5),(4,6,1.5)],
        [(5,.5,1.5),(4,2.5,1),(2,4,1),(1,5.5,.5),(0,6.5,1)]],
}
TRACKS = [
    dict(id="digital-dawn", title="디지털 새벽", scene="title", bpm=116, key=62, mode="major", bars=64,
         progression=[0,4,5,3,0,4,3,4], bridge=[5,3,0,4,5,1,3,4], seed=821),
    dict(id="packet-meadow", title="패킷 초원", scene="exploration", bpm=124, key=57, mode="major", bars=64,
         progression=[0,3,5,4,0,1,3,4], bridge=[5,1,3,4,5,3,1,4], seed=1229),
    dict(id="circuit-breakers", title="서킷 브레이커", scene="battle", bpm=148, key=64, mode="minor", bars=64,
         progression=[0,5,2,6,0,3,5,6], bridge=[3,5,6,0,3,5,1,6], seed=2333),
    dict(id="overclock-apex", title="오버클럭", scene="boss", bpm=156, key=66, mode="minor", bars=64,
         progression=[0,0,5,6,0,3,1,6], bridge=[5,6,0,3,5,1,6,6], seed=4127),
    dict(id="homeward-signal", title="돌아오는 신호", scene="rest", bpm=92, key=62, mode="major", bars=48,
         progression=[0,5,3,4,0,2,3,4], bridge=[5,3,0,4,1,3,4,4], seed=6121),
    dict(id="neon-horizon", title="네온 지평선", scene="title", bpm=120, key=59, mode="major", bars=64,
         progression=[0,2,3,4,5,4,1,4], bridge=[3,2,5,4,1,3,2,4], seed=7919,
         leadVoice="glass", bridgeVoice="pluck", padVoice="strings", arpVoice="pluck",
         harmonyVoice="glass", groove="four-floor", bassPattern="offbeat", arpPattern="ascending",
         arrangement="Glass-synth anthem with rising plucks, wide strings, and a four-on-the-floor pulse"),
    dict(id="prism-canopy", title="프리즘 숲길", scene="exploration", bpm=112, key=65, mode="lydian", bars=64,
         progression=[0,1,4,0,3,1,5,4], bridge=[1,3,0,2,5,1,3,4], seed=10007,
         leadVoice="flute", bridgeVoice="glass", padVoice="strings", arpVoice="pluck",
         harmonyVoice="pluck", groove="broken-light", bassPattern="syncopated", arpPattern="skipping",
         arrangement="Airy flute, Lydian color, mallet-like plucks, and syncopated forest percussion"),
    dict(id="pulse-runners", title="펄스 러너", scene="battle", bpm=144, key=57, mode="dorian", bars=64,
         progression=[0,3,6,4,0,2,3,6], bridge=[3,4,0,6,2,3,4,4], seed=12289,
         leadVoice="pulse", bridgeVoice="glass", padVoice="strings", arpVoice="pluck",
         harmonyVoice="glass", groove="breakbeat", bassPattern="runner", arpPattern="skipping",
         arrangement="Dorian pulse lead, bouncing sixteenth bass, breakbeat drums, and glass answers"),
    dict(id="singularity-core", title="싱귤래리티 코어", scene="boss", bpm=164, key=61, mode="harmonic-minor", bars=64,
         progression=[0,4,1,0,5,3,1,4], bridge=[5,1,4,0,3,5,1,4], seed=15013,
         leadVoice="brass", bridgeVoice="pulse", padVoice="strings", arpVoice="pulse",
         harmonyVoice="glass", groove="half-time", bassPattern="heavy", arpPattern="descending",
         arrangement="Harmonic-minor brass, half-time heavy drums, low ostinato, and a tense pulse bridge"),
    dict(id="starlight-harbor", title="별빛 항구", scene="rest", bpm=86, key=64, mode="major", bars=48,
         progression=[0,2,5,1,3,0,1,4], bridge=[2,5,3,0,1,2,3,4], seed=18013,
         leadVoice="glass", bridgeVoice="flute", padVoice="strings", arpVoice="pluck",
         harmonyVoice="piano", groove="harbor", bassPattern="sustained", arpPattern="ascending",
         arrangement="Slow glass melody, warm strings and piano, suspended space, and a restrained harbor pulse"),
]

def lowpass(x, hz):
    return sosfilt(butter(2, hz, fs=SR, output="sos"), x).astype(np.float32)

def env(t, length, attack=.015, release=.12):
    return np.minimum(t / max(.002, attack), 1) * np.clip((length - t) / max(.01, release), 0, 1)

CACHE = {}
def voice(kind, midi, seconds):
    key = (kind, midi, round(seconds, 4))
    if key in CACHE: return CACHE[key]
    length = seconds + (.45 if kind in ("piano", "bell") else .16)
    t = np.arange(int(length*SR), dtype=np.float32) / SR
    f = 440 * 2 ** ((midi - 69)/12)
    phase = TAU*f*t
    if kind == "pad":
        x = np.zeros_like(t)
        for detune in [.9981, 1, 1.0019]:
            for h in range(1, 9):
                if f*h < 16000: x += np.sin(phase*detune*h + h*.2) / (h**1.65)
        x = lowpass(x/3, 2100) * env(t, length, .3, .55) * .53
    elif kind == "piano":
        x = np.sin(phase + 1.6*np.exp(-t*3.8)*np.sin(phase*2))
        x += .23*np.sin(phase*2.003)*np.exp(-t*2.8) + .08*np.sin(phase*3.99)*np.exp(-t*6)
        x *= (.68*np.exp(-t*1.65)+.2*np.exp(-t*.5))*env(t,length,.004,.35)
    elif kind == "bell":
        x = np.sin(phase + 1.45*np.exp(-t*5)*np.sin(phase*3))
        x += .18*np.sin(phase*2)*np.exp(-t*3)
        x *= np.exp(-t*3.3)*env(t,length,.003,.3)*.75
    elif kind == "glass":
        x = np.sin(phase + .88*np.exp(-t*2.4)*np.sin(phase*2.01))
        x += .12*np.sin(phase*4.003)*np.exp(-t*3)
        x *= (.65*np.exp(-t*1.35)+.18)*env(t,length,.012,.30)*.8
    elif kind == "pluck":
        x = sum(np.sin(phase*h*(1+h*h*.00014))*np.exp(-t*(2.8+h*.7))/(h**1.5)
                for h in range(1,9) if f*h < 15000)
        x = lowpass(x, 6400)*env(t,length,.003,.14)*.95
    elif kind == "pulse":
        # Band-limited quarter-duty pulse, rounded to avoid harsh high notes.
        x = sum(np.sin(phase*h)*np.sin(np.pi*h*.28)/(h**1.3)
                for h in range(1,13) if f*h < 13000)
        x = lowpass(x, 3900)*env(t,length,.008,.16)*(.62+.38*np.exp(-t*5))
    elif kind == "brass":
        swell = np.clip(t/.06,0,1)*np.exp(-t*.28)
        x = np.sin(phase + 1.25*swell*np.sin(phase))
        x += .18*np.sin(phase*2.002)+.09*np.sin(phase*3.001)
        x = lowpass(x, 3500)*env(t,length,.035,.18)*.72
    elif kind == "flute":
        vibrato = .035*np.sin(TAU*4.7*t)*np.clip(t*3,0,1)
        x = np.sin(phase+vibrato)+.11*np.sin(phase*2+vibrato)
        x += .018*np.sin(TAU*3121.7*t)*np.sin(TAU*4403.3*t)
        x *= env(t,length,.035,.22)*(.68+.1*np.sin(TAU*1.8*t))
    elif kind == "strings":
        x = np.zeros_like(t)
        for detune in [.9974,1.0026]:
            for h in range(1,10):
                if f*h < 14000: x += np.sin(phase*detune*h+.14*h)/(h**1.45)
        x = lowpass(x/2, 1750)*env(t,length,.22,.48)*.42
    elif kind == "bass":
        x = np.sin(phase)+.22*np.sin(phase*2)+.09*np.sin(phase*3)
        x = lowpass(x, 850)*env(t,length,.006,.12)*(.7+.3*np.exp(-t*8))
    elif kind == "guitar":
        x = sum(np.sin(phase*h)/h for h in range(1, 11) if f*h < 14000)
        x = lowpass(np.tanh(x*2.2), 3600)*env(t,length,.004,.10)*np.exp(-t*1.5)*.5
    elif kind == "lead":
        vib = .025*np.sin(TAU*5.2*t)*np.clip((t-.12)*5,0,1)
        x = sum(np.sin(phase*h + vib*h)/(h**1.7) for h in range(1,8) if f*h < 14000)
        x = lowpass(x, 4800)*env(t,length,.012,.20)*(.73+.27*np.exp(-t*5))
    else: # airy arpeggiator
        x = np.sin(phase + .65*np.exp(-t*10)*np.sin(phase*2))
        x += .15*np.sin(phase*3)
        x *= np.exp(-t*8)*env(t,length,.004,.12)*.7
    CACHE[key] = np.asarray(x,dtype=np.float32)
    return CACHE[key]

def percussion(kind, rng):
    length = {"kick":.48, "snare":.26, "hat":.09, "openhat":.30, "crash":1.8, "tom":.35}[kind]
    t = np.arange(int(length*SR),dtype=np.float32)/SR
    noise = rng.uniform(-1,1,len(t)).astype(np.float32)
    if kind == "kick":
        phase = TAU*(47*t + 95*.024*(1-np.exp(-t/.024)))
        x = np.sin(phase)*np.exp(-t*10) + noise*.07*np.exp(-t*90)
    elif kind == "snare":
        n = noise - lowpass(noise, 1600)
        x = n*np.exp(-t*19)*.62 + (np.sin(TAU*185*t)+.3*np.sin(TAU*335*t))*np.exp(-t*25)*.45
    elif kind == "tom":
        x = np.sin(TAU*(105*t+40*.04*(1-np.exp(-t/.04))))*np.exp(-t*13)
    else:
        n = noise-lowpass(noise, 6500 if kind != "crash" else 4000)
        metallic = sum(np.sin(TAU*f*t) for f in [3311,4597,6253,7811,9389])/5
        decay = {"hat":65,"openhat":13,"crash":3.4}[kind]
        x = (n*.7+metallic*.18)*np.exp(-t*decay)*env(t,length,.002,.04)
    return x.astype(np.float32)

def render(track):
    CACHE.clear()
    rng = np.random.default_rng(track["seed"])
    beat = 60/track["bpm"]
    bars = track["bars"]
    duration = bars*4*beat
    n = round(duration*SR)
    music = np.zeros((n,2),dtype=np.float32)
    drums = np.zeros_like(music)
    duck = np.ones(n,dtype=np.float32)
    note_count = 0
    scale = SCALES[track["mode"]]
    def pitch(degree, octave=0):
        return track["key"]+scale[degree%7]+12*(degree//7+octave)
    def put(bus, signal, start, gain, pan=0):
        i = round(start*SR)
        if i >= n: return
        k = min(len(signal),n-i)
        if i < 0: return
        angle = (np.clip(pan,-1,1)+1)*np.pi/4
        bus[i:i+k,0] += signal[:k]*(gain*np.cos(angle))
        bus[i:i+k,1] += signal[:k]*(gain*np.sin(angle))
    def note(kind, degree, onset, beats, gain, pan=0, octave=0):
        nonlocal note_count
        note_count += 1
        put(music,voice(kind,pitch(degree,octave),beats*beat),onset*beat,gain,pan)
    drum = {kind:percussion(kind,rng) for kind in ["kick","snare","hat","openhat","crash","tom"]}
    def hit(kind, onset, gain, pan=0):
        sec = onset*beat
        put(drums,drum[kind],sec,gain,pan)
        if kind == "kick":
            i = round(sec*SR); k = min(int(.21*SR),n-i)
            if k>0: duck[i:i+k] = np.minimum(duck[i:i+k],1-.18*np.exp(-np.arange(k)/SR*19))
    gentle = track["scene"] == "rest"
    energetic = track["scene"] in ("battle","boss")
    for bar in range(bars):
        # Eight-bar introduction, two themes, bridge, reprise, and a looping turn.
        intro = bar < 8
        bridge = 24 <= bar < 40 and bars == 64
        reprise = 40 <= bar < bars-8
        outro = bar >= bars-8
        roots = track["bridge"] if bridge else track["progression"]
        root = roots[(bar//2)%len(roots)]
        onset = bar*4
        intensity = .5 if intro else (.74 if bridge else (1 if reprise else .87))
        if outro: intensity = .66
        # Root-position seventh chords, spread over two octaves.
        chord = [root,root+2,root+4,root+6]
        for index, degree in enumerate(chord):
            note(track.get("padVoice","pad"),degree,onset,3.88,.085*intensity,[-.75,-.3,.3,.75][index],-1)
        if bar%2 == 0:
            for index, degree in enumerate([root,root+4,root+9]):
                note(track.get("harmonyVoice","piano"),degree,onset+index*.045,3.5,.13 if gentle else .10,(-.35+index*.35))
        # Bass is rhythmic in combat, sustained on the quieter maps.
        bass_pattern = [(0,.8),(1.5,.45),(2,.7),(3,.4),(3.5,.35)] if energetic else [(0,1.6),(2,1.2)]
        bass_pattern = {
            "offbeat": [(.5,.36),(1.5,.36),(2.5,.36),(3.5,.36)],
            "syncopated": [(0,1.25),(1.75,.65),(3,.7)],
            "runner": [(0,.35),(.75,.3),(1.5,.35),(2,.35),(2.75,.3),(3.5,.35)],
            "heavy": [(0,1.15),(1.5,.35),(2.5,.75),(3.5,.35)],
            "sustained": [(0,2.8),(3,.7)]
        }.get(track.get("bassPattern"),bass_pattern)
        for pos,length in bass_pattern:
            degree = root if pos != 3 else root+4
            note("bass",degree,onset+pos,length,.25*intensity,0,-2)
        # The arpeggio changes direction during the bridge and opens up in reprise.
        arp_steps = 8 if not gentle else 4
        order = [0,2,1,3,2,1,3,1] if not bridge else [3,2,1,0,1,2,3,2]
        order = {"ascending":[0,1,2,3,0,1,2,3], "skipping":[0,2,3,1,2,0,3,2],
                 "descending":[3,2,1,0,3,1,2,0]}.get(track.get("arpPattern"),order)
        for step in range(arp_steps):
            degree = chord[order[step]]+7
            note(track.get("arpVoice","arp" if energetic else "bell"),degree,onset+step*(4/arp_steps),.32,
                 (.07 if gentle else .085)*intensity,(-.55 if step%2 else .55))
        if energetic and not intro and not bridge and track.get("groove") != "half-time":
            for pos in [0,.75,1.5,2,2.75,3.5]:
                for degree in [root-7,root-3]:
                    note("guitar",degree,onset+pos,.35,.085*intensity,(-.65 if degree==root-7 else .65))
        # Rest uses a restrained brushed pulse; exploration has a light syncopation.
        if (not intro or bar>=4) and not (bridge and bar<28):
            drum_gain = .50 if gentle else (.8 if energetic else .64)
            groove = track.get("groove")
            kicks, snares, hats = {
                "four-floor": ([0,1,2,3],[1,3],[i*.5 for i in range(8)]),
                "broken-light": ([0,1.75,2.5],[1,3.25],[0,.75,1.5,2,2.75,3.5]),
                "breakbeat": ([0,.75,2,3.5],[1,3],[i*.25 for i in range(16)]),
                "half-time": ([0,.75,2.5],[2],[i*.5 for i in range(8)]),
                "harbor": ([0],[2.5],[1,3])
            }.get(groove,([0,2] if not energetic else [0,1.5,2,2.75],[1,3],[i*.5 for i in range(8)]))
            for pos in kicks: hit("kick",onset+pos,.55*drum_gain*intensity)
            for pos in snares: hit("snare",onset+pos,(.12 if gentle else .35)*drum_gain*intensity,.08)
            for step,pos in enumerate(hats):
                hat_gain = (.055 if step%2 else .11) if groove=="breakbeat" else (.09 if step%2 else .13)
                hit("hat",onset+pos,hat_gain*drum_gain*intensity,(-.3 if step%2 else .3))
            if groove=="breakbeat" and bar%2:
                hit("snare",onset+2.75,.055*intensity,-.16)
            if energetic and bar%4==3: hit("openhat",onset+3.5,.13*intensity,.3)
            if bar%8==7 and not gentle:
                for pos in [3,3.5,3.75]: hit("tom",onset+pos,.12*intensity,((pos-3)*1.6-.6))
        if bar in [8,24,40] and bar<bars-8 and not gentle: hit("crash",onset,.14,-.2)
        # A sparse counterline answers the melody rather than doubling every note.
        if reprise and bar%2:
            for step, degree in enumerate([root+4,root+2,root]):
                note("piano",degree,onset+2+step*.5,.65,.09,.4,1)
    # Write eight-bar authored themes, leaving breathing room in the intro/bridge.
    for phrase_start in range(0,bars,8):
        if phrase_start == 0:
            selected = [(2,4)] # one distant bell phrase in the introduction
        else: selected = [(i,i*2) for i in range(4)]
        for motif_index, offset in selected:
            base = phrase_start+offset
            if base >= bars: continue
            bridge = 24<=base<40 and bars==64
            melody_kind = "piano" if gentle else ("bell" if phrase_start==0 or bridge else "lead")
            melody_kind = track.get("bridgeVoice" if phrase_start==0 or bridge else "leadVoice",melody_kind)
            gain = .19 if gentle else (.15 if melody_kind in ("bell","pluck") else .20)
            octave = 1 if not gentle else 0
            for degree,pos,length in MOTIFS[track["id"]][motif_index]:
                # Bridges use a descending answer; refrain raises the final phrase.
                adjusted = degree-2 if bridge else degree
                note(melody_kind,adjusted,base*4+pos,length*.92,gain,-.08,octave)
    music *= duck[:,None]
    # Stereo early reflections plus a damped, diffuse hall. Wrap tails into the
    # start so looping does not cut off reverb or create a quiet seam.
    ir_t = np.arange(int(1.45*SR),dtype=np.float32)/SR
    ir = rng.normal(0,1,(len(ir_t),2)).astype(np.float32)
    for channel in range(2):
        ir[:,channel] = lowpass(ir[:,channel],3600)*np.exp(-ir_t*5.2)
        ir[:int(.035*SR),channel] = 0
        ir[:,channel] /= max(1,np.sqrt(np.sum(ir[:,channel]**2)))
    wet = np.zeros_like(music)
    for channel in range(2):
        tail = fftconvolve(music[:,channel],ir[:,channel],mode="full").astype(np.float32)
        wet[:,channel] = tail[:n]
        wet[:len(tail)-n,channel] += tail[n:]
    mix = music + wet*.16 + drums
    for delay_beats, amount in [(.75,.10),(1.5,.045)]:
        offset = round(delay_beats*beat*SR)
        mix += np.roll(music[:,::-1],offset,axis=0)*amount
    # Remove DC; a gentle saturating bus catches transient outliers.
    mix -= mix.mean(axis=0)
    mix = np.tanh(mix*1.18)
    mix *= .89 / max(.0001,float(np.max(np.abs(mix))))
    # Only a 12ms loop boundary taper, not a long fade on every repeat.
    fade = int(.012*SR)
    mix[:fade] *= np.linspace(0,1,fade,dtype=np.float32)[:,None]
    mix[-fade:] *= np.linspace(1,0,fade,dtype=np.float32)[:,None]
    path = OUT/(track["id"]+".ogg")
    print("Encoding " + track["id"] + " samples=" + str(mix.shape), flush=True)
    with sf.SoundFile(path, mode="w", samplerate=SR, channels=2, format="OGG", subtype="VORBIS", compression_level=.75) as output:
        for start in range(0, len(mix), SR):
            output.write(mix[start:start+SR])
    print("Encoded " + track["id"], flush=True)
    decoded, rate = sf.read(path, dtype="float32", always_2d=True)
    peak = float(np.max(np.abs(decoded)))
    rms = float(np.sqrt(np.mean(decoded.astype(np.float64)**2)))
    assert rate==SR and decoded.shape[1]==2 and np.isfinite(decoded).all()
    assert peak<1 and .045<rms<.32, (track["id"],peak,rms)
    result = {**track, "url":"/BGM/ai/"+path.name,"durationSeconds":round(len(decoded)/rate,3),
              "channels":2,"sampleRate":rate,"bytes":path.stat().st_size,
              "sha256":hashlib.sha256(path.read_bytes()).hexdigest(),"noteEvents":note_count,
              "peakDbfs":round(20*np.log10(peak),2),"rmsDbfs":round(20*np.log10(rms),2)}
    print(json.dumps(result,ensure_ascii=False),flush=True)
    return result

def write_manifest(results):
    """Keep unselected tracks during partial renders, and replace atomically."""
    ordered = [results[track["id"]] for track in TRACKS if track["id"] in results]
    manifest = {"version":1,"method":"AI-authored original composition and deterministic local DSP synthesis",
                "externalAudioInputs":[],"sampleRate":SR,"tracks":ordered}
    temporary = OUT/"manifest.json.tmp"
    temporary.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    temporary.replace(OUT/"manifest.json")

if __name__ == "__main__":
    requested = set(sys.argv[1:])
    unknown = requested - {track["id"] for track in TRACKS}
    if unknown: raise SystemExit("Unknown track ID: " + ", ".join(sorted(unknown)))
    manifest_path = OUT/"manifest.json"
    previous = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {"tracks":[]}
    results = {track["id"]:track for track in previous["tracks"]}
    # Fail before touching audio if an unselected file and its provenance disagree.
    for track_id, existing in results.items():
        path = OUT/(track_id+".ogg")
        if track_id not in requested and requested:
            assert path.exists(), "Missing retained audio: " + track_id
            assert hashlib.sha256(path.read_bytes()).hexdigest()==existing["sha256"], "Retained audio changed: " + track_id
    for track in TRACKS:
        if requested and track["id"] not in requested: continue
        results[track["id"]] = render(track)
        write_manifest(results)
    print("Manifest includes " + str(len(results)) + " tracks", flush=True)

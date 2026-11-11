"""Narration via Microsoft Edge neural TTS (free, no API key) with per-word timestamps.

usage: python scripts/tts.py <text_file> <out_mp3> <out_words_json> [voice] [rate] [pitch]
writes the mp3 and a JSON list of {text, start, end} in seconds.
"""
import asyncio
import json
import sys

import edge_tts


async def synthesize(text, voice, rate, pitch, tries=4):
    for attempt in range(1, tries + 1):
        audio, words = bytearray(), []
        try:
            comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
            async for chunk in comm.stream():
                if chunk["type"] == "audio":
                    audio += chunk["data"]
                elif chunk["type"] == "WordBoundary":
                    start = chunk["offset"] / 1e7
                    words.append({"text": chunk["text"], "start": round(start, 3), "end": round(start + chunk["duration"] / 1e7, 3)})
            return bytes(audio), words
        except Exception as e:
            if attempt == tries:
                raise
            print(f"tts: attempt {attempt} failed ({type(e).__name__}), retrying")
            await asyncio.sleep(3 * attempt)


async def main():
    text_file, out_mp3, out_json = sys.argv[1:4]
    voice = sys.argv[4] if len(sys.argv) > 4 else "en-US-AndrewMultilingualNeural"
    rate = sys.argv[5] if len(sys.argv) > 5 else "+12%"
    pitch = sys.argv[6] if len(sys.argv) > 6 else "+0Hz"
    text = open(text_file, encoding="utf8").read()
    audio, words = await synthesize(text, voice, rate, pitch)
    with open(out_mp3, "wb") as f:  # only touched once everything arrived
        f.write(audio)
    # re-attach punctuation from the script so captions read naturally
    tokens = text.split()
    ti = 0
    norm = lambda s: "".join(c for c in s.lower() if c.isalnum())
    for w in words:
        for k in range(ti, min(ti + 4, len(tokens))):
            if norm(tokens[k]) == norm(w["text"]):
                w["text"] = tokens[k]
                ti = k + 1
                break
    json.dump(words, open(out_json, "w", encoding="utf8"), indent=0)
    print(f"tts: {len(words)} words, {words[-1]['end'] if words else 0:.2f}s")


asyncio.run(main())

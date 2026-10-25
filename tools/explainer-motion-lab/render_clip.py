"""Render deterministic educational frames to silent MP4 with local Pillow + FFmpeg."""
import hashlib
import json
import math
import subprocess
import tempfile
import time
from functools import lru_cache
from pathlib import Path

import av
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

from validate_storyboard import load

ROOT = Path(__file__).parent
OUT = ROOT / "out"
BG = "#f8faf6"
INK = "#29434b"
TEAL = "#315f59"
MINT = "#dcebe3"
GOLD = "#d6a650"
MUTED = "#607579"


@lru_cache(maxsize=None)
def font(size, bold=False):
    name = "arialbd.ttf" if bold else "arial.ttf"
    path = Path("C:/Windows/Fonts") / name
    return ImageFont.truetype(str(path), size) if path.exists() else ImageFont.load_default()


def wrap(draw, text, face, width):
    words, lines, line = text.split(), [], ""
    for word in words:
        trial = f"{line} {word}".strip()
        if draw.textbbox((0, 0), trial, font=face)[2] <= width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def draw_text_block(draw, text, xy, face, fill, width, line_gap=8):
    x, y = xy
    for line in wrap(draw, text, face, width):
        draw.text((x, y), line, font=face, fill=fill)
        y += face.size + line_gap
    return y


def draw_motor(draw, width, height, t):
    cx, cy, radius = width - 150, height // 2 + 18, 78
    draw.ellipse((cx-radius, cy-radius, cx+radius, cy+radius), outline="#b9cec4", width=3)
    draw.ellipse((cx-51, cy-51, cx+51, cy+51), outline=TEAL, width=4)
    draw.ellipse((cx-28, cy-28, cx+28, cy+28), fill=MINT, outline=INK, width=3)
    for i in range(3):
        a = i * 2 * math.pi / 3
        x, y = cx + math.cos(a) * 60, cy + math.sin(a) * 60
        draw.rounded_rectangle((x-8, y-14, x+8, y+14), radius=4, fill=GOLD)
    angle = t * 2 * math.pi
    ex, ey = cx + math.cos(angle) * 46, cy + math.sin(angle) * 46
    draw.line((cx, cy, ex, ey), fill=TEAL, width=8)
    draw.polygon([(ex, ey), (ex-14*math.cos(angle-0.6), ey-14*math.sin(angle-0.6)), (ex-14*math.cos(angle+0.6), ey-14*math.sin(angle+0.6))], fill=TEAL)
    draw.text((cx-75, cy+91), "FIELD VIEW · ILLUSTRATIVE", font=font(10, True), fill=MUTED)


def make_frame(spec, frame, captions, out_path):
    w, h, fps = spec["width"], spec["height"], spec["fps"]
    t = frame / fps
    scene = next((s for s in spec["scenes"] if s["start"] <= t < s["end"]), spec["scenes"][-1])
    index = spec["scenes"].index(scene)
    image = Image.new("RGB", (w, h), BG)
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((32, 25, w-32, h-25), radius=18, fill="#ffffff", outline="#dce5dc", width=2)
    draw.text((58, 50), "KAIRO  /  ENGINEERING CONCEPT", font=font(10, True), fill=TEAL)
    draw.text((58, 84), f"{index+1:02d}  /  04", font=font(12, True), fill=GOLD)
    draw_text_block(draw, scene["headline"], (58, 116), font(28, True), INK, 380, 4)
    draw_text_block(draw, scene["detail"], (58, 190), font(17), MUTED, 370, 6)
    draw_motor(draw, w, h, (t % 2) / 2)
    draw.text((58, h-54), "Source-linked motion study · no measured shaft speed", font=font(10), fill=MUTED)
    source_labels = {source["id"]: source["shortCitation"] for source in spec["sources"]}
    citations = "; ".join(source_labels[ref] for ref in scene["sourceRefIds"])
    draw.text((58, h-41), f"Sources: {citations}", font=font(9), fill=TEAL)
    if captions:
        draw.rounded_rectangle((48, h-116, w-48, h-65), radius=8, fill=INK)
        lines = wrap(draw, scene["caption"], font(12, True), w-110)
        block_h = len(lines) * 15
        y = h-116 + (51-block_h)//2
        for line in lines:
            box = draw.textbbox((0, 0), line, font=font(12, True))
            x = (w-(box[2]-box[0]))//2
            draw.text((x, y), line, font=font(12, True), fill="#ffffff")
            y += 15
    image.save(out_path, format="PNG", optimize=False)


def sha(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def encode(spec, captions):
    OUT.mkdir(parents=True, exist_ok=True)
    label = "captioned" if captions else "silent"
    target = OUT / f"motor-field-speed-{label}.mp4"
    count = spec["durationSeconds"] * spec["fps"]
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    with tempfile.TemporaryDirectory(prefix="kairo-clip-") as temp:
        frame_dir = Path(temp)
        started = time.perf_counter()
        for i in range(count):
            make_frame(spec, i, captions, frame_dir / f"frame_{i:04d}.png")
        cmd = [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-framerate", str(spec["fps"]), "-i", str(frame_dir / "frame_%04d.png"), "-frames:v", str(count), "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(target)]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode:
            raise RuntimeError(f"FFmpeg failed ({result.returncode}): {result.stderr}")
        render_seconds = time.perf_counter() - started
    container = av.open(str(target))
    stream = next(s for s in container.streams if s.type == "video")
    decoded = sum(1 for _ in container.decode(video=stream.index))
    metadata = {"file": target.name, "bytes": target.stat().st_size, "sha256": sha(target), "label": "Burned-in text captions; no audio track" if captions else "Silent version without burned-in sentence captions", "width": stream.codec_context.width, "height": stream.codec_context.height, "fps": float(stream.average_rate), "decodedFrameCount": decoded, "expectedFrameCount": count, "durationSeconds": float(stream.duration * stream.time_base) if stream.duration is not None else decoded / float(stream.average_rate), "audioStreams": sum(1 for s in container.streams if s.type == "audio"), "renderWallSeconds": round(render_seconds, 3), "encoder": Path(ffmpeg).name, "inspection": "PyAV decode/stream metadata; ffprobe executable was not installed"}
    container.close()
    return metadata


if __name__ == "__main__":
    spec = load(ROOT / "storyboard.json")
    records = [encode(spec, False), encode(spec, True)]
    vtt = ["WEBVTT", ""]
    for scene in spec["scenes"]:
        vtt.extend([f"{int(scene['start']//3600):02d}:{int(scene['start']//60):02d}:{int(scene['start']%60):02d}.000 --> {int(scene['end']//3600):02d}:{int(scene['end']//60):02d}:{int(scene['end']%60):02d}.000", scene["caption"], ""])
    (OUT / "motor-field-speed.vtt").write_text("\n".join(vtt), encoding="utf-8")
    report = {"storyboard": "storyboard.json", "generatedAtUtc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "sourceTopicId": spec["topicId"], "claims": spec["claimBoundary"], "records": records}
    (OUT / "render-evidence.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    manifest = {"schemaVersion":1,"sourceStoryboard":"tools/explainer-motion-lab/storyboard.json","sourcePack":"studio/src/studio-teaching-host/packs/motor.json","sourcePackId":spec["topicId"],"borrowedVisualAssets":[],"renderedAssets":records + [{"file":"motor-field-speed.vtt","bytes":(OUT/"motor-field-speed.vtt").stat().st_size,"sha256":sha(OUT/"motor-field-speed.vtt"),"label":"WebVTT text caption track for the captioned MP4"}],"font":"Arial from local Windows font installation; no font file is redistributed","licenseNote":"The FFmpeg binary was supplied by the local imageio-ffmpeg installation. Its exact configure flags and H.264 distribution rights were not audited; this is a local prototype only."}
    (OUT / "asset-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))

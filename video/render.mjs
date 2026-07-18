#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const videoDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(videoDirectory, "..");
const captureDirectory = path.join(videoDirectory, "captures");
const outputDirectory = path.join(videoDirectory, "output");
const timeline = JSON.parse(await fs.readFile(path.join(videoDirectory, "timeline.json"), "utf8"));
const requestedFfmpeg = flagValue("--ffmpeg") || process.env.FFMPEG_PATH;
const ffmpeg = await findFfmpeg(requestedFfmpeg);
const ffprobe = path.join(path.dirname(ffmpeg), process.platform === "win32" ? "ffprobe.exe" : "ffprobe");

await fs.mkdir(outputDirectory, { recursive: true });
await assertCaptures(timeline, ffprobe);
const concatPath = path.join(outputDirectory, "timeline.ffconcat");
const outputPath = path.join(outputDirectory, "minipmdb-demo-silent.mp4");
const contactSheetPath = path.join(outputDirectory, "contact-sheet.jpg");
const totalSeconds = timeline.reduce((sum, scene) => sum + Number(scene.duration), 0);
await fs.writeFile(concatPath, buildConcat(timeline), "utf8");

run(ffmpeg, [
  "-y",
  "-f", "concat",
  "-safe", "0",
  "-i", concatPath,
  "-f", "lavfi",
  "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
  "-map", "0:v:0",
  "-map", "1:a:0",
  "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x090a0e,fps=30,format=yuv420p",
  "-c:v", "libx264",
  "-preset", "medium",
  "-crf", "18",
  "-c:a", "aac",
  "-b:a", "128k",
  "-t", String(totalSeconds),
  "-movflags", "+faststart",
  outputPath
]);
renderContactSheet(ffmpeg, timeline, contactSheetPath);

const probe = JSON.parse(run(ffprobe, ["-v", "error", "-show_streams", "-show_format", "-of", "json", outputPath], true));
const video = probe.streams.find((stream) => stream.codec_type === "video");
const audio = probe.streams.find((stream) => stream.codec_type === "audio");
const duration = Number(probe.format.duration);
if (!video || video.width !== 1920 || video.height !== 1080) throw new Error("Rendered video is not 1920x1080.");
if (!audio) throw new Error("Rendered video is missing its silent narration track.");
if (Math.abs(duration - totalSeconds) > 0.25) throw new Error(`Rendered duration ${duration}s differs from ${totalSeconds}s.`);
process.stdout.write(`Rendered ${outputPath}\nDuration: ${duration.toFixed(2)}s; video: ${video.codec_name}; audio: ${audio.codec_name}\n`);
process.stdout.write(`Contact sheet: ${contactSheetPath}\n`);

async function assertCaptures(scenes, probePath) {
  for (const scene of scenes) {
    const filePath = capturePath(scene.id);
    await fs.access(filePath);
    const value = JSON.parse(run(probePath, [
      "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", filePath
    ], true));
    const stream = value.streams?.[0];
    if (stream?.width !== 1920 || stream?.height !== 1080) {
      throw new Error(`${scene.id}.jpg must be 1920x1080; got ${stream?.width}x${stream?.height}.`);
    }
  }
}

function renderContactSheet(command, scenes, target) {
  const args = ["-y"];
  for (const scene of scenes) args.push("-i", capturePath(scene.id));
  const scaled = scenes.map((_, index) => `[${index}:v]scale=480:270[v${index}]`).join(";");
  const layout = scenes.map((_, index) => `${(index % 4) * 480}_${Math.floor(index / 4) * 270}`).join("|");
  const inputs = scenes.map((_, index) => `[v${index}]`).join("");
  args.push("-filter_complex", `${scaled};${inputs}xstack=inputs=${scenes.length}:layout=${layout}:fill=0x090a0e[out]`, "-map", "[out]", "-frames:v", "1", "-q:v", "2", target);
  run(command, args);
}

function buildConcat(scenes) {
  const lines = ["ffconcat version 1.0"];
  for (const scene of scenes) {
    lines.push(`file '${escapeConcat(capturePath(scene.id))}'`, `duration ${scene.duration}`);
  }
  lines.push(`file '${escapeConcat(capturePath(scenes.at(-1).id))}'`);
  return `${lines.join("\n")}\n`;
}

function capturePath(id) {
  return path.join(captureDirectory, `${id}.jpg`);
}

function escapeConcat(value) {
  return path.resolve(value).replaceAll("\\", "/").replaceAll("'", "'\\''");
}

async function findFfmpeg(explicit) {
  if (explicit) {
    await fs.access(path.resolve(explicit));
    return path.resolve(explicit);
  }
  const executable = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const local = await findNamedFile(path.join(root, ".video-tools"), executable);
  if (local) return local;
  const pathResult = spawnSync(executable, ["-version"], { encoding: "utf8" });
  if (pathResult.status === 0) return executable;
  throw new Error("FFmpeg was not found. Pass --ffmpeg <path> or set FFMPEG_PATH.");
}

async function findNamedFile(directory, name) {
  try {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isFile() && entry.name.toLowerCase() === name.toLowerCase()) return target;
      if (entry.isDirectory()) {
        const found = await findNamedFile(target, name);
        if (found) return found;
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return "";
}

function flagValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

function run(command, args, capture = false) {
  const result = spawnSync(command, args, { encoding: "utf8", stdio: capture ? "pipe" : "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${path.basename(command)} exited ${result.status}: ${result.stderr || ""}`);
  return result.stdout || "";
}

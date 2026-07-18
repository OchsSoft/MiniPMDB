# Ready-to-narrate demo video

`video/output/minipmdb-demo-silent.mp4` is the 2:42 submission cut. It is 1920×1080, 30fps H.264 with a silent AAC stereo track, so it can be dropped directly into Clipchamp, DaVinci Resolve, Premiere, CapCut, or another editor for voiceover.

The output directory is intentionally ignored by Git. The source captures, exact timeline, renderer, voiceover copy, and optional captions are versioned.

## Your remaining work

1. Open the silent MP4 in your editor.
2. Add one voice track beginning at `00:00`; read [`voiceover.md`](voiceover.md) against the matching scene timestamps.
3. Trim pauses inside each timestamp block if needed, but keep the visual cut under three minutes.
4. Optionally import [`voiceover.srt`](voiceover.srt) as captions and correct timing after the final narration take.
5. Export 1080p H.264/AAC, confirm audible narration, then upload it as a public YouTube video.

Do not show a `/feedback` Session ID in the video. Add it privately to Devpost and replace the pending value in `HACKATHON.md` before submission.

For the final narration, upload, public-link check, and Devpost handoff, follow the [submission runbook](../docs/submission-runbook.md). The silent master and timestamped voiceover remain the stable morning review inputs; judge-demo changes do not require a new visual render unless the walkthrough reveals a visible defect.

## Re-render the silent master

The committed JPEGs are the source frames. With FFmpeg available on `PATH`:

```console
npm run video:render
```

Or provide an explicit executable:

```console
node video/render.mjs --ffmpeg C:\path\to\ffmpeg.exe
```

The renderer verifies every source frame is 1920×1080 and verifies the final duration, video dimensions, video codec, and silent audio stream.

## Capture provenance

- `audit-fail.jpg` and `governed-fix.jpg` reproduce real CLI results from the synthetic Paper Crane fixture.
- `dashboard-fail.jpg`, `context-gate.jpg`, and `dashboard-pass.jpg` are captured from the live loopback dashboard using a temporary ignored store.
- The remaining frames are local HTML/CSS title, integration, and evidence scenes served by `video/serve.mjs` with no external assets.
- No usernames, machine paths, credentials, private project names, notifications, or unrelated browser tabs appear in the frames.

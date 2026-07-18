# Ready-to-narrate demo video

`video/output/minipmdb-demo-silent.mp4` is the 2:50 silent master: 1920×1080, 30 fps H.264 with an AAC silent track. The output directory is ignored by Git; the source frames, exact timeline, renderer, timestamped voiceover, and SRT captions are versioned.

## Add your voice

1. Import the silent MP4 into Clipchamp, DaVinci Resolve, Premiere, CapCut, or another editor.
2. Record one narration track from [voiceover.md](voiceover.md), starting at `00:00`.
3. Import [voiceover.srt](voiceover.srt), then retime captions only if your natural delivery differs.
4. Export 1080p H.264/AAC under three minutes and watch the complete result once.
5. Upload publicly to YouTube using the copy in [submission-copy.md](../docs/submission-copy.md), then verify it while signed out.

Do not put the `/feedback` Session ID in the video. Add it to the Devpost form and `HACKATHON.md` immediately before submission.

## Re-render

With FFmpeg on `PATH`:

```console
npm run video:render
```

Or pass an executable: `node video/render.mjs --ffmpeg C:\path\to\ffmpeg.exe`.

The renderer verifies all eleven 1920×1080 source frames, the exact 170-second output, the silent audio stream, and the final codec. `dashboard-fail.jpg`, `context-gate.jpg`, and `dashboard-pass.jpg` are real Mongo-backed loopback dashboard captures. The other frames are local HTML/CSS scenes containing real CLI and configuration results. All content is synthetic and public-safe.

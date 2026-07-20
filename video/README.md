# Narrated live demo video

The final narrated master is `minipmdb-demo-narrated-2m50s.mp4`, delivered outside Git because generated media is intentionally ignored. It is a 2:50 recording of the real loopback application using its managed MongoDB and synthetic release-auth fixture, with locally generated Kokoro `am_echo` narration. It is 1920x1080 at 30 fps with 48 kHz AAC audio. No storyboard or static HTML scene appears in the final video.

The silent `minipmdb-demo-live-2m50s.mp4` and `video/output/minipmdb-demo-silent.mp4` remain replaceable-narration fallbacks. [voiceover.md](voiceover.md) and [voiceover.srt](voiceover.srt) match the narrated master, including the entrant-led architecture and Codex/GPT-5.6 implementation disclosure.

## Optional replacement voice

1. Import the live silent MP4 into Clipchamp, DaVinci Resolve, Premiere, CapCut, or another editor.
2. Record one narration track from [voiceover.md](voiceover.md), starting at `00:00`.
3. Import [voiceover.srt](voiceover.srt), then retime captions only if your natural delivery differs.
4. Export 1080p H.264/AAC under three minutes and watch the complete result once.
5. Upload publicly to YouTube using the copy in [submission-copy.md](../docs/submission-copy.md), then verify it while signed out.

Do not put the `/feedback` Session ID in the video or repository. Enter it directly in the required Devpost form field.

## Live recording timeline

The nine entries in [timeline.json](timeline.json) correspond to real screen-recorded clips:

1. blocked managed-Mongo overview;
2. context pack and broken touchpoint;
3. human review and canonical lifecycle;
4. governed-fix interaction;
5. passing audit with superseded history;
6. project switch;
7. reciprocal cross-project context;
8. managed/external runtime settings;
9. passing close.

Record the application at 1280x720 or 1920x1080 and export each source clip as 1920x1080 H.264 at the duration declared in `timeline.json`. Put the generated clips in `video/live-captures/` using the timeline IDs as filenames.

With FFmpeg on `PATH`, rebuild and verify the master with:

```console
npm run video:render
```

Or pass an executable: `node video/render.mjs --ffmpeg C:\path\to\ffmpeg.exe`.

The renderer validates every live clip, produces the exact 170-second H.264/AAC master, writes the compatibility copy, and generates a contact sheet from the finished video.

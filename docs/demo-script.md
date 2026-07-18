# Build Week video walkthrough

The final visual timeline, exact narration windows, and captions live in [`video/`](../video/README.md). The target silent master is 2:50 at 1080p/30 fps.

## Recording order

1. Introduce MiniPMDB as CI for cross-project agent memory.
2. Show the synthetic Paper Crane and Release Relay claims colliding over release authentication.
3. Show the snapshot v2 strict audit with one error and three strict-mode warnings.
4. Show the live managed-Mongo dashboard: runtime status, blocked audit, broken touchpoint, and unreviewed queue.
5. Show Paper Crane receiving Release Relay's labeled memory only through the shared touchpoint.
6. Apply the human-controlled governed fix.
7. Show the passing audit, repaired touchpoint, and preserved superseded history.
8. Show project-draft MCP configuration and explain the working-directory project boundary.
9. Show the snapshot GitHub Action and five-collection Mongo model.
10. State how Codex and GPT-5.6 were used during Build Week.
11. Close on the public repository URL.

Only the three dashboard scenes are live captures; the other frames are local HTML/CSS compositions of actual CLI, configuration, and validation results. Use only synthetic data and do not show local usernames, unrelated tabs, notifications, credentials, or a `/feedback` Session ID.

After narration, import [`video/voiceover.srt`](../video/voiceover.srt), export H.264/AAC under three minutes, and use the YouTube/Devpost copy in [`submission-copy.md`](submission-copy.md).

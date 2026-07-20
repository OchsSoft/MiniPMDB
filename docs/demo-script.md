# Build Week live video walkthrough

The final visual timeline, narration windows, and captions live in [`video/`](../video/README.md). The narrated master and its replaceable-narration silent source are exactly 2:50 at 1920x1080 and 30 fps.

Every visual is captured from the real MiniPMDB dashboard running on the loopback API with managed MongoDB and synthetic data. The video contains no static HTML storyboard scenes.

## Recording order

1. Show managed MongoDB, the selected Paper Crane project, and the blocked strict audit.
2. Scroll through the governed context pack and broken cross-project touchpoint.
3. Show the unreviewed candidate, human approve/reject controls, and canonical lifecycle table.
4. Click **Apply governed fix** and capture the live blocked-to-passing transition.
5. Show the repaired touchpoint, zero findings, and preserved superseded history.
6. Switch the dashboard to Release Relay.
7. Show the same governed relationship from the reciprocal project view.
8. Expand the real managed/external MongoDB runtime settings.
9. Return to the passing Paper Crane overview.

Use only synthetic data. Do not show local usernames, unrelated tabs, notifications, credentials, private repositories, or a `/feedback` Session ID.

The delivered narration and [`video/voiceover.srt`](../video/voiceover.srt) are synchronized. If replacing the voice, import the captions, export H.264/AAC under three minutes, and use the YouTube/Devpost copy in [`submission-copy.md`](submission-copy.md).

# Compliance model

MMON Studio is intentionally designed as a **compliance-first replay broadcaster**, not as a platform-evasion tool.

## Non-goals

The project does not implement:

- detection evasion by mirroring, cropping, speed changes, filters, or watermark removal;
- fake viewer/chat/engagement automation;
- bypassing platform livestream restrictions, strikes, or account-level enforcement;
- restreaming third-party films, TV, music, creator livestreams, or other media without the necessary rights.

## Guardrails in MVP 0.1

1. Every replay output gets a visible `REPLAY - PRE-RECORDED` overlay burned into the FFmpeg video output.
2. The broadcaster must confirm ownership/licensing for video, audio, and music.
3. Platform profiles are enforced again in the Electron main process, so a blocked profile cannot be started by bypassing the renderer UI.
4. Stream keys are held in memory only by the running app and are redacted from the on-screen FFmpeg logs.
5. Custom RTMP requires an explicit confirmation that the destination platform permits pre-recorded/replay broadcasts.

## Platform notes checked 2026-08-25

### TikTok Shop Vietnam

Replay mode is blocked in MMON Studio. TikTok Shop Vietnam guidance states that livestreams must be real-time and identifies pre-recorded livestream/video playback as reproduced or unoriginal content. It also flags a lack of sustained real-time verbal interaction as non-interactive content.

References:
- TikTok Shop Academy: `Non-Interactive Content - How to Avoid Violations` (published 2026-07-29, Vietnam)
- TikTok Shop Academy: `Unoriginal Content` (published 2026-08-24, Vietnam)

### YouTube Live

Replay mode is available only behind rights and disclosure confirmations. YouTube requires livestream content to comply with its Community Guidelines and terms, requires necessary rights for live content, scans live streams for copyrighted third-party material, and may restrict repetitive/inauthentic content for monetization.

References:
- YouTube Help: `Get started with live streaming`
- YouTube Help: `Copyright issues with live streams`
- YouTube Help: `YouTube channel monetization policies`

## Maintenance

Platform policy changes are operationally important. Before adding or enabling a platform profile, re-check the destination platform's current official rules and update `compliance/policies.json` with a dated reference.

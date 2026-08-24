# MMON Studio

Desktop studio for replaying a local video source to an RTMP/RTMPS destination with FFmpeg.

> MMON Studio is a generic broadcaster. It does not implement moderation-evasion, fake engagement, copyright bypasses, watermark hiding, or platform-detection bypass features.

## MVP 0.2

- Electron + React/Vite desktop UI
- Local video source: MP4, MOV, MKV, WEBM, M4V
- RTMP / RTMPS output using local FFmpeg
- TikTok / RTMP, YouTube / RTMP and Custom RTMP profiles
- 720p and 1080p presets
- Continuous replay with FFmpeg `-stream_loop`
- Optional `REPLAY - PRE-RECORDED` overlay
- Stream-key redaction in the in-app console
- No platform-specific replay hard blocks

## Requirements

- Node.js 22+
- npm
- FFmpeg available in `PATH`

macOS with Homebrew:

```bash
brew install ffmpeg
```

## Run locally

```bash
npm install
npm run dev
```

Select a local video, choose an output profile, enter the RTMP server and stream key, then start the replay.

## Production build

```bash
npm run check
npm run build
npm start
```

`npm run build` creates the renderer in `dist/`. Desktop packaging/signing can be added in the next milestone.

## Architecture

```text
React renderer
    │ secure IPC
    ▼
Electron main process
    │ validates local source + RTMP config
    ▼
FFmpeg child process
    │ RTMP / RTMPS
    ▼
Destination
```

## Scope

MMON Studio sends the configured media stream to the destination you provide. Destination-platform rules and enforcement are outside the application; users are responsible for how they use the broadcaster.

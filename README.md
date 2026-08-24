# MMON Studio

A compliance-first desktop studio for replaying **content you own or are licensed to use** to destinations that permit pre-recorded RTMP broadcasts.

> MMON Studio does not provide detection evasion, fake interaction, watermark hiding, copyright bypasses, or platform-restriction circumvention.

## MVP 0.1

- Electron + React/Vite desktop UI
- Local video source: MP4, MOV, MKV, WEBM, M4V
- RTMP / RTMPS output using local FFmpeg
- 720p and 1080p presets
- Continuous replay with FFmpeg `-stream_loop`
- Visible `REPLAY - PRE-RECORDED` disclosure burned into the outgoing video
- Content-rights confirmation before streaming
- Stream-key redaction in the in-app console
- Platform compliance profiles enforced in both UI and Electron backend
- TikTok Shop Vietnam replay profile blocked because current official guidance requires livestreams to be real-time
- Custom RTMP requires explicit confirmation that the destination permits replay broadcasting

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

The app checks FFmpeg automatically. Select a local video, select a platform profile, enter the RTMP server and stream key, complete the compliance confirmations, then start the replay.

## Production build

```bash
npm run check
npm run build
npm start
```

`npm run build` creates the renderer in `dist/`. Packaging/signing installers is intentionally left for the next milestone.

## Safety and compliance

Read [`docs/COMPLIANCE.md`](docs/COMPLIANCE.md). Platform rules change, so profiles must be re-checked against current official policy before enabling a new destination.

## Architecture

```text
React renderer
    │ secure IPC
    ▼
Electron main process
    │ validates policy + rights confirmations
    ▼
FFmpeg child process
    │ RTMP / RTMPS
    ▼
Allowed destination
```

# Usage and scope

MMON Studio is a generic local-video-to-RTMP broadcaster.

## What it does

- reads a local video file;
- replays it continuously with FFmpeg;
- encodes to a selected 720p/1080p preset;
- sends the output to an RTMP/RTMPS server;
- optionally burns a `REPLAY - PRE-RECORDED` label into the output;
- keeps the stream key out of the visible FFmpeg console output.

## What it does not do

The project does not implement:

- platform moderation or detection evasion;
- mirroring/cropping/speed/filter tricks intended to bypass content detection;
- fake viewers, chat or engagement;
- account restriction or strike bypasses;
- copyright or ownership bypasses.

## Platform profiles

Profiles in `compliance/policies.json` are output labels only. They no longer enable or disable replay based on platform policy.

The Electron main process only validates technical requirements: a real local source, a valid RTMP/RTMPS URL, a stream key, FFmpeg availability, and that no other broadcast process is already running.

Destination-platform rules and enforcement remain outside MMON Studio.

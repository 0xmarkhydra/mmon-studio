import React, { useEffect, useMemo, useState } from 'react';

const api = window.studio;

function basename(filePath = '') {
  return filePath.split(/[\\/]/).pop() || '';
}

export default function App() {
  const [profiles, setProfiles] = useState({});
  const [platform, setPlatform] = useState('tiktok');
  const [videoPath, setVideoPath] = useState('');
  const [rtmpUrl, setRtmpUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [quality, setQuality] = useState('720p');
  const [showReplayLabel, setShowReplayLabel] = useState(false);
  const [ffmpeg, setFfmpeg] = useState({ ok: false, checking: true });
  const [status, setStatus] = useState({ state: 'idle' });
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPolicies().then(setProfiles);
    api.checkFfmpeg().then((result) => setFfmpeg({ ...result, checking: false }));
    const offStatus = api.onStatus((next) => setStatus(next));
    const offLog = api.onLog((line) => setLogs((items) => [...items.slice(-80), line]));
    return () => {
      offStatus?.();
      offLog?.();
    };
  }, []);

  const profile = profiles[platform];
  const isLive = status.state === 'live' || status.state === 'starting';

  const canStart = useMemo(() => {
    return Boolean(ffmpeg.ok && !isLive && videoPath && rtmpUrl && streamKey);
  }, [ffmpeg.ok, isLive, videoPath, rtmpUrl, streamKey]);

  async function chooseVideo() {
    const selected = await api.selectVideo();
    if (selected) {
      setVideoPath(selected);
      setError('');
    }
  }

  async function start() {
    setError('');
    setLogs([]);
    try {
      await api.startStream({
        platform,
        videoPath,
        rtmpUrl,
        streamKey,
        quality,
        showReplayLabel
      });
    } catch (err) {
      setError(err?.message || String(err));
    }
  }

  async function stop() {
    setError('');
    try {
      await api.stopStream();
    } catch (err) {
      setError(err?.message || String(err));
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand-row"><span className="brand-dot" /> MMON Studio <span className="version">MVP 0.2</span></div>
          <p>Local video → RTMP/RTMPS replay studio</p>
        </div>
        <div className={`status-pill ${isLive ? 'live' : ''}`}>
          <span className="status-dot" /> {status.state === 'starting' ? 'CONNECTING' : status.state.toUpperCase()}
        </div>
      </header>

      <main className="workspace">
        <section className="panel source-panel">
          <div className="panel-title"><span>01</span> Source</div>
          <button className="source-drop" onClick={chooseVideo} type="button">
            <div className="source-icon">▶</div>
            <strong>{videoPath ? basename(videoPath) : 'Chọn video phát lại'}</strong>
            <small>{videoPath || 'MP4 · MOV · MKV · WEBM · M4V'}</small>
          </button>

          <div className="field-row">
            <label>
              Output profile
              <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                {Object.entries(profiles).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
              </select>
            </label>
            <label>
              Quality
              <select value={quality} onChange={(e) => setQuality(e.target.value)}>
                <option value="720p">720p · 2.5 Mbps</option>
                <option value="1080p">1080p · 4.5 Mbps</option>
              </select>
            </label>
          </div>

          <div className="preview-card">
            {showReplayLabel && <div className="preview-badge">REPLAY · PRE-RECORDED</div>}
            <div className="preview-center">
              <div className="preview-play">▶</div>
              <strong>{videoPath ? 'Source ready' : 'No source selected'}</strong>
              <span>Video được FFmpeg đọc theo thời gian thực và loop liên tục.</span>
            </div>
          </div>
        </section>

        <section className="panel output-panel">
          <div className="panel-title"><span>02</span> RTMP Output</div>
          <label>
            RTMP Server URL
            <input value={rtmpUrl} onChange={(e) => setRtmpUrl(e.target.value)} placeholder="rtmps://server.example/live" spellCheck="false" />
          </label>
          <label>
            Stream Key
            <input type="password" value={streamKey} onChange={(e) => setStreamKey(e.target.value)} placeholder="••••••••••••••••" autoComplete="off" />
          </label>

          <div className="policy-card allowed">
            <div className="policy-head">
              <strong>RTMP profile</strong>
              <span>{profile?.label || 'Loading…'}</span>
            </div>
            <p>{profile?.note || 'Generic RTMP output.'}</p>
            <small>MMON Studio does not implement platform-detection bypass or moderation evasion.</small>
          </div>

          <div className="checklist">
            <label className="check-row">
              <input type="checkbox" checked={showReplayLabel} onChange={(e) => setShowReplayLabel(e.target.checked)} />
              <span><strong>Burn nhãn REPLAY / PRE-RECORDED</strong><small>Tùy chọn. Khi bật, FFmpeg sẽ chèn nhãn trực tiếp vào hình.</small></span>
            </label>
          </div>

          <div className="runtime-row">
            <span>FFmpeg</span>
            <strong className={ffmpeg.ok ? 'ok' : 'bad'}>{ffmpeg.checking ? 'Checking…' : ffmpeg.ok ? 'Ready' : 'Missing'}</strong>
          </div>
          {!ffmpeg.ok && !ffmpeg.checking && <p className="helper">Cài FFmpeg và bảo đảm lệnh <code>ffmpeg</code> có trong PATH.</p>}
          {error && <div className="error-box">{error}</div>}

          <div className="action-row">
            <button className="secondary" onClick={stop} disabled={!isLive}>Stop</button>
            <button className="primary" onClick={start} disabled={!canStart}>{isLive ? 'Streaming…' : 'Start replay'}</button>
          </div>
        </section>
      </main>

      <section className="console-panel">
        <div className="console-head"><strong>Stream console</strong><span>Stream key is redacted from logs</span></div>
        <pre>{logs.length ? logs.join('') : 'Ready. No stream process started.'}</pre>
      </section>
    </div>
  );
}

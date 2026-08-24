import React, { useEffect, useMemo, useState } from 'react';

const api = window.studio;

function basename(filePath = '') {
  return filePath.split(/[\\/]/).pop() || '';
}

export default function App() {
  const [policies, setPolicies] = useState({});
  const [platform, setPlatform] = useState('tiktok-shop-vn');
  const [videoPath, setVideoPath] = useState('');
  const [rtmpUrl, setRtmpUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [quality, setQuality] = useState('720p');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [disclosureConfirmed, setDisclosureConfirmed] = useState(true);
  const [destinationAllowsReplay, setDestinationAllowsReplay] = useState(false);
  const [ffmpeg, setFfmpeg] = useState({ ok: false, checking: true });
  const [status, setStatus] = useState({ state: 'idle' });
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPolicies().then(setPolicies);
    api.checkFfmpeg().then((result) => setFfmpeg({ ...result, checking: false }));
    const offStatus = api.onStatus((next) => setStatus(next));
    const offLog = api.onLog((line) => setLogs((items) => [...items.slice(-80), line]));
    return () => {
      offStatus?.();
      offLog?.();
    };
  }, []);

  const policy = policies[platform];
  const blocked = policy?.replayAllowed === false;
  const needsCustomConfirm = policy?.replayAllowed === 'confirm';
  const isLive = status.state === 'live' || status.state === 'starting';

  const canStart = useMemo(() => {
    if (!policy || blocked || isLive || !videoPath || !rtmpUrl || !streamKey || !rightsConfirmed || !disclosureConfirmed) return false;
    if (needsCustomConfirm && !destinationAllowsReplay) return false;
    return ffmpeg.ok;
  }, [policy, blocked, isLive, videoPath, rtmpUrl, streamKey, rightsConfirmed, disclosureConfirmed, needsCustomConfirm, destinationAllowsReplay, ffmpeg.ok]);

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
        rightsConfirmed,
        disclosureConfirmed,
        destinationAllowsReplay
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
          <div className="brand-row"><span className="brand-dot" /> MMON Studio <span className="version">MVP 0.1</span></div>
          <p>Compliance-first replay broadcaster</p>
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
              Platform profile
              <select value={platform} onChange={(e) => {
                setPlatform(e.target.value);
                setDestinationAllowsReplay(false);
              }}>
                {Object.entries(policies).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
              </select>
            </label>
            <label>
              Output
              <select value={quality} onChange={(e) => setQuality(e.target.value)}>
                <option value="720p">720p · 2.5 Mbps</option>
                <option value="1080p">1080p · 4.5 Mbps</option>
              </select>
            </label>
          </div>

          <div className="preview-card">
            <div className="preview-badge">REPLAY · PRE-RECORDED</div>
            <div className="preview-center">
              <div className="preview-play">▶</div>
              <strong>{videoPath ? 'Source ready' : 'No source selected'}</strong>
              <span>Watermark disclosure được burn trực tiếp vào output bằng FFmpeg.</span>
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

          <div className={`policy-card ${blocked ? 'blocked' : 'allowed'}`}>
            <div className="policy-head">
              <strong>{blocked ? 'Replay blocked' : 'Compliance profile'}</strong>
              <span>{policy?.label || 'Loading…'}</span>
            </div>
            <p>{policy?.reason}</p>
            <small>{policy?.reference}</small>
          </div>

          <div className="checklist">
            <label className="check-row">
              <input type="checkbox" checked={rightsConfirmed} onChange={(e) => setRightsConfirmed(e.target.checked)} />
              <span><strong>Tôi có quyền sử dụng toàn bộ video/âm thanh/nhạc</strong><small>Không stream nội dung copy, phim, TV, nhạc hoặc livestream của người khác nếu chưa có quyền.</small></span>
            </label>
            <label className="check-row locked">
              <input type="checkbox" checked={disclosureConfirmed} onChange={(e) => setDisclosureConfirmed(e.target.checked)} />
              <span><strong>Hiển thị nhãn REPLAY / PRE-RECORDED</strong><small>MMON Studio burn nhãn này vào output để tránh gây hiểu nhầm đây là hình ảnh thời gian thực.</small></span>
            </label>
            {needsCustomConfirm && (
              <label className="check-row">
                <input type="checkbox" checked={destinationAllowsReplay} onChange={(e) => setDestinationAllowsReplay(e.target.checked)} />
                <span><strong>Nền tảng đích cho phép phát nội dung quay sẵn</strong><small>Tôi đã tự kiểm tra chính sách hiện hành của nền tảng RTMP đích.</small></span>
              </label>
            )}
          </div>

          <div className="runtime-row">
            <span>FFmpeg</span>
            <strong className={ffmpeg.ok ? 'ok' : 'bad'}>{ffmpeg.checking ? 'Checking…' : ffmpeg.ok ? 'Ready' : 'Missing'}</strong>
          </div>
          {!ffmpeg.ok && !ffmpeg.checking && <p className="helper">Cài FFmpeg và bảo đảm lệnh <code>ffmpeg</code> có trong PATH.</p>}
          {error && <div className="error-box">{error}</div>}

          <div className="action-row">
            <button className="secondary" onClick={stop} disabled={!isLive}>Stop</button>
            <button className="primary" onClick={start} disabled={!canStart}>{blocked ? 'Replay disabled' : isLive ? 'Streaming…' : 'Start replay'}</button>
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

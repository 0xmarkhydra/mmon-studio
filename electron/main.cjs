const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const policies = require('../compliance/policies.json');
let mainWindow;
let ffmpegProcess = null;
let activeSecret = '';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: '#090b10',
    title: 'MMON Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) mainWindow.loadURL(devUrl);
  else mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
}

function emit(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload);
}

function redact(value) {
  const text = String(value ?? '');
  return activeSecret ? text.split(activeSecret).join('••••••••') : text;
}

function ffmpegAvailable() {
  const probe = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  return {
    ok: probe.status === 0,
    version: probe.status === 0 ? (probe.stdout.split('\n')[0] || 'ffmpeg') : '',
    error: probe.status === 0 ? '' : 'FFmpeg was not found in PATH.'
  };
}

function validateStart(config) {
  if (!config || typeof config !== 'object') throw new Error('Invalid stream configuration.');
  if (!config.videoPath || !fs.existsSync(config.videoPath)) throw new Error('Select a valid local video file.');
  if (!/^rtmps?:\/\//i.test(config.rtmpUrl || '')) throw new Error('RTMP server URL must start with rtmp:// or rtmps://');
  if (!config.streamKey || String(config.streamKey).trim().length < 3) throw new Error('Stream key is required.');
  if (ffmpegProcess) throw new Error('A broadcast is already running.');

  const ffmpeg = ffmpegAvailable();
  if (!ffmpeg.ok) throw new Error(ffmpeg.error);

  return policies[config.platform] || policies['custom-rtmp'];
}

function buildArgs(config) {
  const quality = config.quality === '1080p'
    ? { height: 1080, rate: '4500k', buffer: '9000k' }
    : { height: 720, rate: '2500k', buffer: '5000k' };

  const filters = [`scale=-2:${quality.height}`];
  if (config.showReplayLabel === true) {
    filters.unshift("drawtext=text='REPLAY - PRE-RECORDED':fontcolor=white:fontsize=28:box=1:boxcolor=black@0.65:boxborderw=12:x=24:y=24");
  }

  const output = `${String(config.rtmpUrl).replace(/\/$/, '')}/${String(config.streamKey).trim()}`;

  return [
    '-hide_banner', '-nostdin', '-loglevel', 'info',
    '-re', '-stream_loop', '-1', '-i', config.videoPath,
    '-vf', filters.join(','),
    '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
    '-maxrate', quality.rate, '-bufsize', quality.buffer, '-g', '60',
    '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
    '-f', 'flv', output
  ];
}

ipcMain.handle('studio:select-video', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select replay source',
    properties: ['openFile'],
    filters: [{ name: 'Video', extensions: ['mp4', 'mov', 'mkv', 'webm', 'm4v'] }]
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('studio:get-policies', () => policies);
ipcMain.handle('studio:check-ffmpeg', () => ffmpegAvailable());

ipcMain.handle('studio:start-stream', (_event, config) => {
  const profile = validateStart(config);
  activeSecret = String(config.streamKey).trim();
  const args = buildArgs(config);
  ffmpegProcess = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });

  emit('studio:status', { state: 'starting', platform: profile.label });
  ffmpegProcess.stderr.on('data', (chunk) => emit('studio:log', redact(chunk.toString())));
  ffmpegProcess.once('spawn', () => emit('studio:status', { state: 'live', platform: profile.label }));
  ffmpegProcess.once('error', (error) => emit('studio:status', { state: 'error', message: redact(error.message) }));
  ffmpegProcess.once('close', (code, signal) => {
    ffmpegProcess = null;
    activeSecret = '';
    emit('studio:status', { state: 'stopped', code, signal });
  });

  return { ok: true, state: 'starting' };
});

ipcMain.handle('studio:stop-stream', () => {
  if (!ffmpegProcess) return { ok: true, alreadyStopped: true };
  const processToStop = ffmpegProcess;
  processToStop.kill('SIGTERM');
  setTimeout(() => {
    if (ffmpegProcess === processToStop) processToStop.kill('SIGKILL');
  }, 3000).unref();
  return { ok: true };
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  if (ffmpegProcess) ffmpegProcess.kill('SIGTERM');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

import { useEffect, useRef, useState } from 'react';
import { Camera, Link as LinkIcon, Mic, Play, Square, Trash2, Upload, Video } from 'lucide-react';

type Props = {
  kind: 'audio' | 'video';
  value: string;
  onChange: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  privacyMode?: boolean;
};

const maxAudioSeconds = 300;

export default function MediaRecorderField({ kind, value, onChange, onUploadingChange, privacyMode = false }: Props) {
  const [mode, setMode] = useState<'record' | 'link'>(kind === 'audio' || privacyMode ? 'record' : 'link');
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [levels, setLevels] = useState<number[]>(Array.from({ length: 28 }, () => 10));
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sourceVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => () => cleanup(), []);

  function cleanup() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    sourceStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioContextRef.current?.close().catch(() => undefined);
  }

  async function startRecording() {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Ton navigateur ne permet pas l enregistrement media sur cette page.');
      return;
    }
    const constraints = kind === 'audio' ? { audio: true } : { audio: true, video: true };
    const sourceStream = await navigator.mediaDevices.getUserMedia(constraints);
    sourceStreamRef.current = sourceStream;
    const stream = privacyMode ? createProtectedStream(sourceStream) : sourceStream;
    streamRef.current = stream;
    if (videoRef.current) videoRef.current.srcObject = stream;

    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      setPreviewUrl(URL.createObjectURL(blob));
      void upload(blob, recordedFilename(kind, recorder.mimeType));
    };

    recorder.start();
    setRecording(true);
    setSeconds(0);
    timerRef.current = window.setInterval(() => {
      setSeconds((current) => {
        const next = current + 1;
        setLevels((items) => [...items.slice(1), 12 + Math.round(Math.random() * 44)]);
        if (kind === 'audio' && next >= maxAudioSeconds) stopRecording();
        return next;
      });
    }, 1000);
  }

  function stopRecording() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    sourceStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioContextRef.current?.close().catch(() => undefined);
    setRecording(false);
  }

  function createProtectedStream(sourceStream: MediaStream) {
    const audioStream = createProtectedAudioStream(sourceStream);
    if (kind === 'audio') return audioStream;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;
    canvas.width = 960;
    canvas.height = 540;
    const context = canvas.getContext('2d');
    const sourceVideo = sourceVideoRef.current || document.createElement('video');
    sourceVideoRef.current = sourceVideo;
    sourceVideo.srcObject = sourceStream;
    sourceVideo.muted = true;
    sourceVideo.playsInline = true;
    void sourceVideo.play();

    const draw = () => {
      if (context) {
        context.fillStyle = '#1c1917';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.filter = 'blur(18px)';
        context.drawImage(sourceVideo, -24, -24, canvas.width + 48, canvas.height + 48);
        context.filter = 'none';
        context.fillStyle = 'rgba(28, 25, 23, 0.22)';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      animationRef.current = window.requestAnimationFrame(draw);
    };
    draw();

    const protectedStream = canvas.captureStream(24);
    audioStream.getAudioTracks().forEach((track) => protectedStream.addTrack(track));
    return protectedStream;
  }

  function createProtectedAudioStream(sourceStream: MediaStream) {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContextCtor();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(sourceStream);
    const highpass = audioContext.createBiquadFilter();
    const lowpass = audioContext.createBiquadFilter();
    const distortion = audioContext.createWaveShaper();
    const mainGain = audioContext.createGain();
    const noiseGain = audioContext.createGain();
    const destination = audioContext.createMediaStreamDestination();

    highpass.type = 'highpass';
    highpass.frequency.value = 180;
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 2300;
    distortion.curve = makeDistortionCurve(95);
    distortion.oversample = '4x';
    mainGain.gain.value = 0.92;
    noiseGain.gain.value = 0.018;

    const noise = audioContext.createBufferSource();
    const bufferSize = audioContext.sampleRate * 2;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) output[i] = Math.random() * 2 - 1;
    noise.buffer = noiseBuffer;
    noise.loop = true;

    source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(distortion);
    distortion.connect(mainGain);
    mainGain.connect(destination);
    noise.connect(noiseGain);
    noiseGain.connect(destination);
    noise.start();

    return destination.stream;
  }

  async function upload(blob: Blob, filename: string) {
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const data = new FormData();
      data.append('file', blob, filename);
      data.append('kind', kind);
      const response = await fetch('/api/media', { method: 'POST', body: data, credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) setError(payload.error || 'Upload impossible');
      else onChange(payload.data.url);
    } catch {
      setError('Upload impossible pour le moment');
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  }

  function reset() {
    onChange('');
    setPreviewUrl('');
    setSeconds(0);
    setError('');
  }

  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  const isAudio = kind === 'audio';

  return (
    <div className="bg-white border border-stone-200/60 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isAudio ? 'bg-violet-50 text-violet-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {isAudio ? <Mic className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800">{isAudio ? 'Message vocal' : 'Video'}</p>
            <p className="text-xs text-stone-400">{privacyMode ? 'Enregistrement protege uniquement' : isAudio ? 'Maximum 5 minutes' : 'Lien ou camera directe'}</p>
          </div>
        </div>
        {!isAudio && !privacyMode && (
          <div className="flex rounded-xl bg-stone-100 p-1">
            <button type="button" onClick={() => setMode('link')} className={`p-2 rounded-lg ${mode === 'link' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`} title="Lien video">
              <LinkIcon className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setMode('record')} className={`p-2 rounded-lg ${mode === 'record' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`} title="Camera">
              <Camera className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {mode === 'link' ? (
        <input type="url" value={value} onChange={(event) => onChange(event.target.value)} placeholder="https://youtube.com/watch?v=... ou lien direct .mp4" className="input" />
      ) : (
        <div className="space-y-4">
          {!isAudio && <video ref={videoRef} autoPlay muted playsInline className={`w-full rounded-xl bg-stone-900 aspect-video object-cover ${privacyMode ? 'blur-sm' : ''}`} />}

          <div className="flex items-center gap-3 rounded-2xl bg-stone-50 border border-stone-200/70 px-4 py-3">
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              className={`w-11 h-11 rounded-full flex items-center justify-center text-white transition-all ${recording ? 'bg-red-600' : 'bg-stone-900'}`}
              title={recording ? 'Arreter' : 'Enregistrer'}
            >
              {recording ? <Square className="w-4 h-4 fill-current" /> : isAudio ? <Mic className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            </button>
            <div className="flex-1 h-11 flex items-center gap-1 overflow-hidden">
              {levels.map((level, index) => (
                <span key={index} className={`w-1.5 rounded-full ${recording ? 'bg-stone-900' : 'bg-stone-300'}`} style={{ height: `${level}%` }} />
              ))}
            </div>
            <span className="text-sm tabular-nums font-medium text-stone-600">{minutes}:{secs}</span>
          </div>

          {previewUrl && (
            <div className="flex items-center gap-3">
              {isAudio ? <audio controls src={previewUrl} className="w-full" /> : <video controls src={previewUrl} className="w-full rounded-xl" />}
              <button type="button" onClick={reset} className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl" title="Supprimer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {uploading && <p className="text-xs text-stone-400 flex items-center gap-1"><Upload className="w-3 h-3" /> Envoi du media...</p>}
      {privacyMode && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">Mode confession: la voix est bruitée et la video est floutee avant l'envoi.</p>}
      {value && !uploading && <p className="text-xs text-emerald-600 flex items-center gap-1"><Play className="w-3 h-3" /> Media pret</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

function makeDistortionCurve(amount: number) {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

function recordedFilename(kind: 'audio' | 'video', mimeType: string) {
  const cleanType = mimeType.split(';')[0].toLowerCase();
  if (cleanType.includes('mp4')) return kind === 'audio' ? 'message-audio.mp4' : 'video-camera.mp4';
  if (cleanType.includes('ogg')) return kind === 'audio' ? 'message-audio.ogg' : 'video-camera.ogg';
  if (cleanType.includes('wav')) return 'message-audio.wav';
  return kind === 'audio' ? 'message-audio.webm' : 'video-camera.webm';
}

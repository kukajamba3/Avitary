'use client';

import { useEffect, useRef, useState } from 'react';
import type Hls from 'hls.js';

export function HlsPlayer({ src, title }: { src: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    let hls: Hls | null = null;
    let disposed = false;
    setError('');

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else {
      void import('hls.js').then(({ default: HlsLibrary }) => {
        if (disposed) return;
        if (HlsLibrary.isSupported()) {
          hls = new HlsLibrary({ enableWorker: true, lowLatencyMode: true, maxBufferLength: 30 });
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(HlsLibrary.Events.ERROR, (_event, data) => {
            if (data.fatal) setError('Не получилось загрузить поток. Попробуйте выбрать серию ещё раз.');
          });
        } else {
          setError('Этот браузер не поддерживает воспроизведение HLS.');
        }
      });
    }
    return () => {
      disposed = true;
      hls?.destroy();
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [src]);

  return (
    <div>
      <div className="video-frame"><video ref={videoRef} controls playsInline preload="none" aria-label={title} /></div>
      {error ? <p role="alert" className="mt-2 text-xs text-rose">{error}</p> : <p className="mt-2 text-[10px] text-[var(--muted)]">Нажмите воспроизведение, когда будете готовы. Видео не запускается автоматически.</p>}
    </div>
  );
}

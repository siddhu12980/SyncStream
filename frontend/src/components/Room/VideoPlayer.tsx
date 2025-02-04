import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  videoUrl: string;
}

export function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    console.log('Initializing HLS player with URL:', videoUrl);

    if (Hls.isSupported()) {

      const hls = new Hls({
        debug: true, 
        enableWorker: true,
      });

      hlsRef.current = hls;

      // Bind HLS to video element
      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest loaded, starting playback');
        video.play().catch(error => {
          console.log('Playback failed:', error);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Network error, attempting to recover');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, attempting to recover');
              hls.recoverMediaError();
              break;
            default:
              console.error('Fatal error, stopping playback');
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari, which has native HLS support
      video.src = videoUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(error => {
          console.log('Playback failed:', error);
        });
      });
    }

    // Cleanup
    return () => {
      if (hlsRef.current) {
        console.log('Destroying HLS instance');
        hlsRef.current.destroy();
      }
    };
  }, [videoUrl]);

  // Keyboard controls
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case ' ':  // Spacebar
        case 'k':  // YouTube-style play/pause
          e.preventDefault();
          video.paused ? video.play() : video.pause();
          break;
        
        case 'arrowleft':  // Rewind 10 seconds
          e.preventDefault();
          video.currentTime = Math.max(video.currentTime - 10, 0);
          break;
        
        case 'arrowright':  // Forward 10 seconds
          e.preventDefault();
          video.currentTime = Math.min(video.currentTime + 10, video.duration);
          break;
        
        case 'j':  // Rewind 5 seconds
          video.currentTime = Math.max(video.currentTime - 5, 0);
          break;
        
        case 'l':  // Forward 5 seconds
          video.currentTime = Math.min(video.currentTime + 5, video.duration);
          break;
        
        case 'f':  // Toggle fullscreen
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            video.requestFullscreen();
          }
          break;
        
        case 'm':  // Toggle mute
          video.muted = !video.muted;
          break;
        
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          // Jump to percentage of video (0-9 for 0%-90%)
          video.currentTime = (video.duration * parseInt(e.key)) / 10;
          break;
          
        case 'arrowup':  // Volume up
          e.preventDefault();
          video.volume = Math.min(video.volume + 0.1, 1);
          break;
          
        case 'arrowdown':  // Volume down
          e.preventDefault();
          video.volume = Math.max(video.volume - 0.1, 0);
          break;
      }
    };

    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyPress);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  return (
    <div className="aspect-video bg-black relative group">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
      />
      
      {/* Optional: Show keyboard shortcuts hint on hover */}
      <div className="absolute bottom-0 right-0 p-4 bg-black/60 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="space-y-1">
          <p>Space/K: Play/Pause</p>
          <p>←/→: 10s skip</p>
          <p>J/L: 5s skip</p>
          <p>F: Fullscreen</p>
          <p>M: Mute</p>
          <p>↑/↓: Volume</p>
          <p>0-9: Jump to %</p>
        </div>
      </div>
    </div>
  );
} 

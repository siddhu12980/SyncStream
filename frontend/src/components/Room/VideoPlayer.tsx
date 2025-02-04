import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  videoUrl: string;
  
  onVideoEvent: (event: {
    type: 'play' | 'pause' | 'forward_10' | 'back_10' | 'video_time';
    video_time: number;
  }) => void;

  remoteVideoEvent?: {
    event_type: 'play' | 'pause' | 'forward_10' | 'back_10' | 'video_time';
    video_time: number;
  };
}

export function VideoPlayer({ videoUrl, onVideoEvent, remoteVideoEvent }: VideoPlayerProps) {
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

  // Add video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      onVideoEvent({ type: 'play', video_time: video.currentTime });
    };

    const handlePause = () => {
      onVideoEvent({ type: 'pause', video_time: video.currentTime });
    };

    const handleSeek = () => {
      onVideoEvent({ type: 'video_time', video_time: video.currentTime });
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeek);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeek);
    };
  }, [onVideoEvent]);

  // Modify keyboard controls to emit events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          if (video.paused) {
            video.play();
            onVideoEvent({ type: 'play', video_time: video.currentTime });
          } else {
            video.pause();
            onVideoEvent({ type: 'pause', video_time: video.currentTime });
          }
          break;
        
        case 'arrowleft':
          e.preventDefault();
          video.currentTime = Math.max(video.currentTime - 10, 0);
          onVideoEvent({ type: 'back_10', video_time: video.currentTime });
          break;
        
        case 'arrowright':
          e.preventDefault();
          video.currentTime = Math.min(video.currentTime + 10, video.duration);
          onVideoEvent({ type: 'forward_10', video_time: video.currentTime });
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

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onVideoEvent]);

  // Handle incoming remote video events
  useEffect(() => {
    if (!remoteVideoEvent || !videoRef.current) return;
    console.log('Remote video event:', remoteVideoEvent);
    
    const video = videoRef.current;
    
    switch (remoteVideoEvent.event_type) {
      case 'play':
        video.currentTime = remoteVideoEvent.video_time;
        video.play();
        break;
      case 'pause':
        video.currentTime = remoteVideoEvent.video_time;
        video.pause();
        break;
      case 'video_time':
      case 'forward_10':
      case 'back_10':
        video.currentTime = remoteVideoEvent.video_time;
        break;
    }
  }, [remoteVideoEvent]);

  return (
    <div className="aspect-video bg-black relative group">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
        autoPlay={false}
        muted={true}

      />
    </div>
  );
} 

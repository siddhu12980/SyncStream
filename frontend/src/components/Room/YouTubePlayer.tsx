import { useEffect, useRef, useState } from "react";
import ReactPlayer from 'react-player';

interface YouTubePlayerProps {
  videoUrl: string;
  isAdmin?: boolean;
  onVideoEvent?: (event: {
    type: "play" | "pause" | "forward_10" | "back_10" | "video_time" | "progress";
    video_time: number;
  }) => void;
  remoteVideoEvent?: {
    event_type: "play" | "pause" | "forward_10" | "back_10" | "video_time" | "progress";
    video_time: number;
  } | null;
}

export const YouTubePlayer = ({
  videoUrl,
  isAdmin = false,
  onVideoEvent,
  remoteVideoEvent,
}: YouTubePlayerProps) => {
  const playerRef = useRef<ReactPlayer>(null);
  const lastEventRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const handlePlay = () => {
    if (isAdmin && onVideoEvent && playerRef.current) {
      lastEventRef.current = 'play';
      onVideoEvent({
        type: "play",
        video_time: playerRef.current.getCurrentTime()
      });
    }
  };

  const handlePause = () => {
    if (isAdmin && onVideoEvent && playerRef.current) {
      lastEventRef.current = 'pause';
      onVideoEvent({
        type: "pause",
        video_time: playerRef.current.getCurrentTime()
      });
    }
  };

  // Handle remote events for non-admin users
  useEffect(() => {
    if (!remoteVideoEvent || isAdmin || !playerRef.current || !isReady) {
      console.log("Skipping remote event:", { 
        remoteVideoEvent, 
        isAdmin, 
        hasPlayer: !!playerRef.current,
        isReady 
      });
      return;
    }

    console.log("Processing remote event:", remoteVideoEvent);

    const player = playerRef.current;
    const currentTime = player.getCurrentTime();
    const timeDiff = Math.abs(currentTime - remoteVideoEvent.video_time);

    console.log("Current state:", { currentTime, timeDiff });

    switch (remoteVideoEvent.event_type) {
      case "play":
        console.log("Handling play event");
        player.seekTo(remoteVideoEvent.video_time, 'seconds');
        player.getInternalPlayer()?.playVideo();
        break;

      case "pause":
        console.log("Handling pause event");
        player.seekTo(remoteVideoEvent.video_time, 'seconds');
        player.getInternalPlayer()?.pauseVideo();
        break;

      case "video_time":
        console.log("Handling video_time event");
        if (timeDiff > 1) {
          player.seekTo(remoteVideoEvent.video_time, 'seconds');
          player.getInternalPlayer()?.playVideo();
        }
        break;

      case "forward_10":
        player.seekTo(currentTime + 10);
        player.getInternalPlayer()?.playVideo();
        break;

      case "back_10":
        player.seekTo(currentTime - 10);
        player.getInternalPlayer()?.playVideo();
        break;
    }
  }, [remoteVideoEvent, isAdmin, isReady]);

  useEffect(() => {
    setTimeout(() => {
      playerRef.current?.getInternalPlayer()?.unMute();
    }, 1000);
  }, []);

  return (
    <div className="aspect-video bg-black relative group">
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        width="100%"
        height="100%"
        controls={true}
        playing={false}
        muted={true}
        onReady={() => setIsReady(true)}
        onPlay={handlePlay}
        onPause={handlePause}
        onProgress={({ playedSeconds }) => {
          if (isAdmin && onVideoEvent && playerRef.current) {
            onVideoEvent({
              type: "progress",
              video_time: playedSeconds
            });
          }
        }}
        config={{
          youtube: {
            playerVars: {
              modestbranding: 1,
              controls: 1,
              rel: 0,
              fs: 1,
              autoplay: 1,
              mute: 1,
              enablejsapi: 1,
              origin: window.location.origin,
              widget_referrer: window.location.origin,
              iv_load_policy: 3,
              showinfo: 0,
            }
          }
        }}
      />
    </div>
  );
}; 
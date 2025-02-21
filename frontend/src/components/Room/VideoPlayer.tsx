import { useEffect, useRef, forwardRef } from "react";
import Hls from "hls.js";

interface VideoPlayerProps {
  videoUrl: string;
  isAdmin?: boolean;
  onVideoEvent?: (event: {
    type: "play" | "pause" | "forward_10" | "back_10" | "video_time";
    video_time: number;
  }) => void;

  remoteVideoEvent?: {
    event_type: "play" | "pause" | "forward_10" | "back_10" | "video_time";
    video_time: number;
  } | null;
} 

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(({
  videoUrl,
  isAdmin = false,
  onVideoEvent,
  remoteVideoEvent,
}, forwardedRef) => {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const videoRef = (forwardedRef || localRef) as React.MutableRefObject<HTMLVideoElement | null>;
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    console.log("Initializing HLS player with URL:", videoUrl);

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
        console.log("HLS manifest loaded, starting playback");
        video.play().catch((error) => {
          console.log("Playback failed:", error);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS error:", data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log("Network error, attempting to recover");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("Media error, attempting to recover");
              hls.recoverMediaError();
              break;
            default:
              console.error("Fatal error, stopping playback");
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // For Safari, which has native HLS support
      video.src = videoUrl;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch((error) => {
          console.log("Playback failed:", error);
        });
      });
    }

    // Cleanup
    return () => {
      if (hlsRef.current) {
        console.log("Destroying HLS instance");
        hlsRef.current.destroy();
      }
    };
  }, [videoUrl]);

  // Add video event listeners only for admin
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isAdmin || !onVideoEvent) return;

    const handlePlay = () => {
      onVideoEvent({ type: "play", video_time: video.currentTime });
    };

    const handlePause = () => {
      onVideoEvent({ type: "pause", video_time: video.currentTime });
    };

    const handleSeek = () => {
      onVideoEvent({ type: "video_time", video_time: video.currentTime });
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("seeked", handleSeek);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("seeked", handleSeek);
    };
  }, [onVideoEvent, isAdmin]);

  // Handle incoming remote video events
  useEffect(() => {
    if (!remoteVideoEvent || !videoRef.current) return;
    if (isAdmin) return;

    //if user is not admin then handle the remote video event THIS IS ONLY FOR NON ADMIN USER
    console.log("Remote video event:", remoteVideoEvent);

    const video = videoRef.current;

    switch (remoteVideoEvent.event_type) {
      case "play":
        const diff1 = Math.abs(video.currentTime - remoteVideoEvent.video_time);

        if (diff1 > 1) {
          video.currentTime = remoteVideoEvent.video_time;
        }
        video.play();
        break;

      case "pause":
        const diff2 = Math.abs(video.currentTime - remoteVideoEvent.video_time);

        if (diff2 > 1) {
          video.currentTime = remoteVideoEvent.video_time;
        }
        video.pause();

        break;

      case "video_time":
        const diff3 = Math.abs(video.currentTime - remoteVideoEvent.video_time);

        if (diff3 > 1) {
          video.currentTime = remoteVideoEvent.video_time;
        }

        video.play();

        break;

      case "forward_10":
        const diff4 = Math.abs(video.currentTime - remoteVideoEvent.video_time);

        if (diff4 > 1) {
          video.currentTime = remoteVideoEvent.video_time;
        }

        video.currentTime += 10;

        video.play();

        break;

      case "back_10":
        const diff5 = Math.abs(video.currentTime - remoteVideoEvent.video_time);

        if (diff5 > 1) {
          video.currentTime = remoteVideoEvent.video_time;
        }

        video.currentTime -= 10;

        video.play();

        break;

      default:
        console.log("Unknown event type:", remoteVideoEvent);
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
});

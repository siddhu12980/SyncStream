import { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player'


const url = "https://youtu.be/Eo9GZ93sbkg?si=cgxt7ukPz4afoQvo"

export default function TestRoom() {

    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<ReactPlayer>(null);
    
    
    useEffect(() => {
        const player = videoRef.current?.getInternalPlayer()
        console.log("player", player)
    }, [])

    return (
        <div className='w-full h-full flex flex-col justify-center items-center'>
            <div className='w-full h-full flex justify-center items-center'>
                <ReactPlayer ref={videoRef} url={url}  muted={true} playing={true} controls={true} />
            </div>

            <button onClick={() => {
                console.log("clicked")
                videoRef.current?.seekTo(10)
            }} className='bg-blue-500 text-white p-2 rounded-md'>
                seek to 10
            </button>

            <button onClick={() => {
                console.log("clicked")
                const player = videoRef.current?.getInternalPlayer()

                console.log("player", player)
                console.log("isPlaying", player?.getMediaReferenceTime())
                console.log("isPlaying", player?.getDuration())
                console.log("isPlaying", player?.getPlaybackRate())
                console.log("isPlaying", player?.getVolume())
                

                if (isPlaying) {
                    player?.pauseVideo()
                } else {
                    player?.playVideo()
                }

                videoRef.current?.setState({
                    playing: !isPlaying
                })


                setIsPlaying(!isPlaying)

            }} className='bg-blue-500 text-white p-2 rounded-md'>
                play
            </button>

        </div>
    )
}


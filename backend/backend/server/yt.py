import requests
from urllib.parse import urlparse, parse_qs

# YouTube Data API Key (replace with your own API key)
YOUTUBE_API_KEY = "AIzaSyBOujqJbyGYrOahP72-u931AgQeBNoeNzU"


def extract_video_id(url):
   
    parsed_url = urlparse(url)
    
    if parsed_url.hostname == 'youtu.be':  
        return parsed_url.path[1:]
    
    if parsed_url.hostname in ('www.youtube.com', 'youtube.com'):
        if parsed_url.path == '/watch':
            return parse_qs(parsed_url.query).get('v', [None])[0]
        
        if parsed_url.path.startswith('/embed/'):  
            return parsed_url.path.split('/')[2]
    return None

def get_youtube_video_details(video_id):
   
    api_url = f"https://www.googleapis.com/youtube/v3/videos"
    params = {
        "part": "snippet,contentDetails,statistics",
        "id": video_id,
        "key": YOUTUBE_API_KEY
    }
    response = requests.get(api_url, params=params)
    if response.status_code != 200:
        raise Exception(f"Error fetching video details: {response.text}")
    
    data = response.json()
    if not data.get("items"):
        raise Exception("Video not found or invalid video ID.")
    
    item = data["items"][0]["snippet"]
    statistics = data["items"][0].get("statistics", {})
    
    return {
        "title": item.get("title"),
        "url": f"//www.youtube.com/watch?v={video_id}",
        "thumb": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
        "creator": item.get("channelTitle"),
        "creatorurl": f"https://www.youtube.com/channel/{data['items'][0]['snippet']['channelId']}",
        "views": int(statistics.get("viewCount", 0)),
    }

def handle_request(url):
 
    
    video_id = extract_video_id(url)
    
    if not video_id:
        return {"error": "Invalid YouTube URL"}, 400
    
    try:
        video_details = get_youtube_video_details(video_id)
        return video_details, 200
    
    except Exception as e:
        return None


if __name__ == "__main__":
    url = "//www.youtube.com/watch?v=PVbmMzsaOQA"
    result, status_code = handle_request(url)
    print(result)

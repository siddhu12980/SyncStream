import asyncio
import websockets
import json
from datetime import datetime
import random

async def simulate_user(user_id: str, room_id: str, server_url: str):
    uri = f"{server_url}/ws/{room_id}?user_id={user_id}"


    async with websockets.connect(uri) as websocket:
        print(f"User {user_id} connected to room {room_id}")
        
        # Simulate different actions
        actions = [
            # Chat message
            {
                "type": "chat",
                "message": f"Hello from {user_id}!",
                "video_time": 0.0
            },
            # Play video
            {
                "type": "play",
                "video_time": 10.5
            },
            # Pause video
            {
                "type": "pause",
                "video_time": 15.2
            },
            # Forward 10 seconds
            {
                "type": "forward_10",
                "video_time": 25.2
            },
            # Seek to specific time
            {
                "type": "video_time",
                "video_time": 50.0
            }
        ]
        
        

        # Start listener task
        async def message_listener():
            while True:
                try:
                    response = await websocket.recv()
                    print(f"User {user_id} received: {response}")
                except websockets.ConnectionClosed:
                    break

        listener_task = asyncio.create_task(message_listener())
        
        # Send actions
        for action in actions:
            # Add random delay between actions
            await asyncio.sleep(random.uniform(0.5, 2.0))
            await websocket.send(json.dumps(action))
            print(f"User {user_id} sent: {action}")
        
        # Keep connection alive for a while to receive messages
        await asyncio.sleep(5)
        listener_task.cancel()

async def main():
    server_url = "ws://localhost:8000"  # Update with your server URL
    room_id = "test_room"
    
    # Simulate multiple users
    users = ["user1", "user2", "user3"]
    
    # Create tasks for each user
    tasks = [simulate_user(user_id, room_id, server_url) for user_id in users]
    
    # Run all users concurrently
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    print("Starting WebSocket test...")
    asyncio.run(main()) 


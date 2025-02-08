from backend.server.room.ws_manager import ConnectionManager
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
from datetime import datetime
import json

manager = ConnectionManager()

async def handle_websocket(websocket: WebSocket, room_id: str, user_id: str, name: str):
    try:
        # First connect the websocket
        await manager.connect(websocket, room_id, user_id, name)
        print(f"User {user_id} connected to room {room_id}")
        print(f"Room {room_id} has {len(manager.active_rooms[room_id])} users")
        
        # Main message handling loop
        while True:
            try:
                data = await websocket.receive_json()
                print(f"Received data from {user_id} in room {room_id}: {data}")
                
                # Validate the event type
                if "type" not in data:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Missing event type",
                        "timestamp": datetime.now().isoformat()
                    })
                    continue

                # Add timestamp to all events
                current_time = datetime.now().isoformat()
                
                # Handle different event types
                event_type = data["type"]
                message = {
                    "type": event_type,
                    "user_id": user_id,
                    "user_name": name,
                    "timestamp": current_time,
                    **data
                }

                if event_type == "chat":
                    if "message" not in data:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Missing chat message",
                            "timestamp": current_time
                        })
                        continue
                    await manager.broadcast_to_room(room_id, message)
                
                elif event_type in ["video_event"]:
                    if "video_time" not in data:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Missing video timestamp",
                            "timestamp": current_time
                        })
                        continue
                    
                    await manager.broadcast_to_room(room_id, message, exclude_user=user_id)
                

                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Unknown event type: {event_type}",
                        "timestamp": current_time
                    })

            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format",
                    "timestamp": datetime.now().isoformat()
                })
                continue

    except WebSocketDisconnect:
        # Handle normal disconnection
        print(f"User {user_id} disconnected from room {room_id}")
        await manager.disconnect(room_id, user_id)
    
    except Exception as e:
        # Handle unexpected errors
        print(f"Error in websocket handler: {str(e)}")
        if room_id in manager.active_rooms and user_id in manager.active_rooms[room_id]:
            await manager.disconnect(room_id, user_id)
    
    finally:
        # Ensure cleanup happens
        if room_id in manager.active_rooms and user_id in manager.active_rooms[room_id]:
            await manager.disconnect(room_id, user_id)
        print(f"WebSocket connection closed for user {user_id} in room {room_id}")

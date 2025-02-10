from backend.server.room.ws_manager import ConnectionManager
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
from sqlalchemy.orm import Session
from backend.server.model.model import Room
from backend.server.db.db import engine

manager = ConnectionManager()


async def handle_websocket(websocket: WebSocket, room_id: str, user_id: str, name: str):
    try:
        print(f"Attempting to connect user {user_id} to room {room_id} with name {name}")
        
        connection_result = await manager.connect(websocket, room_id, user_id, name)
        if not connection_result:
            print(f"Connection failed - manager.connect returned {connection_result}")
            print(f"Current active connections: {manager.active_rooms}")
            print(f"Current rooms: {manager.room_owners}")
            return
            
        print(f"Successfully connected user {user_id} to room {room_id}")
        
        try:
            while True:
                data = await websocket.receive_json()
                print(f"Received data from {user_id}: {data}")
                
                if "type" not in data:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Missing event type"
                    })
                    continue

                event_type = data["type"]
                current_time = datetime.now().isoformat()
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
                            "message": "Missing chat message"
                        })
                        continue
                    await manager.broadcast_to_room(room_id, message)
                
                elif event_type == "video_event":
                    if not manager.is_room_owner(room_id, user_id):
                        print(f"Non-owner {user_id} tried to control video")
                        await websocket.send_json({
                            "type": "error",
                            "message": "Only room owner can control video"
                        })
                        continue
                        
                    if "video_time" not in data:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Missing video time"
                        })
                        continue
                        
                    await manager.broadcast_to_room(room_id, message, exclude_user=user_id)
                
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Unknown event type: {event_type}"
                    })

        except WebSocketDisconnect:
            await manager.disconnect(room_id, user_id)
            
    except Exception as e:
        print(f"Error in websocket handler: {str(e)}")
        await manager.disconnect(room_id, user_id)
        raise


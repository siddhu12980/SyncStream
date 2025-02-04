from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        # room_id -> set of WebSocket connections
        self.active_rooms: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str, name: str):
        await websocket.accept()
        if room_id not in self.active_rooms:
            self.active_rooms[room_id] = {}
        self.active_rooms[room_id][user_id] = websocket
        
        # Notify others that a new user joined
        await self.broadcast_to_room(
            room_id,
            {
                "type": "join",
                "user_name": name,
                "user_id": user_id,
                "message": f"User {user_id} joined the room",
                "timestamp": datetime.now().isoformat()
            },
            exclude_user=None  # Include everyone for join notifications
        )

    async def disconnect(self, room_id: str, user_id: str):
        if room_id in self.active_rooms:
            # Remove user from room
            self.active_rooms[room_id].pop(user_id, None)
            
            # Check if room is empty
            if not self.active_rooms[room_id]:
                # Room is empty, remove it
                del self.active_rooms[room_id]
                print(f"Room {room_id} closed - no users remaining")
            else:
                # Room still has users, notify them about the leave
                await self.broadcast_to_room(
                    room_id,
                    {
                        "type": "leave",
                        "user_id": user_id,
                        "message": f"User {user_id} left the room",
                        "timestamp": datetime.now().isoformat()
                    },
                    exclude_user=user_id
                )
                print(f"User {user_id} left room {room_id}. {len(self.active_rooms[room_id])} users remaining")

    async def broadcast_to_room(self, room_id: str, message: dict, exclude_user: str = None):

        if room_id in self.active_rooms:
            disconnected_users = []
            for user_id, connection in self.active_rooms[room_id].items():
                if exclude_user != user_id:  # Don't send to excluded user
                    try:
                        print(f'sending message to ${user_id}')
                        await connection.send_json(message)
                    except WebSocketDisconnect:
                        disconnected_users.append(user_id)
                    except Exception as e:
                        print(f"Error sending message to user {user_id}: {str(e)}")
                        disconnected_users.append(user_id)
            
            # Clean up disconnected users
            for user_id in disconnected_users:
                await self.disconnect(room_id, user_id)


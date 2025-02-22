from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
from datetime import datetime
from backend.server.db.db import engine
from sqlmodel import Session
from backend.server.model.model import Room



    
async def get_room(room_id: str):
    with Session(bind=engine) as session:
        room = session.get(Room, room_id)
        return room

class ConnectionManager:
    def __init__(self):
        self.active_rooms: Dict[str, Dict[str, WebSocket]] = {}
        self.room_owners: Dict[str, str] = {}
        self.video_states: Dict[str, str] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str, name: str):
        try:
            # Accept the connection first
            await websocket.accept()
            print(f"WebSocket accepted for user {user_id}")

            # Then check room status
            with Session(bind=engine) as session:
                room = session.get(Room, room_id)
                if not room:
                    print(f"Room {room_id} not found")
                    await websocket.close(code=4000, reason="Room not found")
                    return False

                # Initialize room in active_rooms if it doesn't exist
                if room_id not in self.active_rooms:
                    self.active_rooms[room_id] = {}

                # If user is the room owner
                if room.created_by == user_id:
                    print(f"Owner {user_id} connecting to room {room_id}")
                    self.active_rooms[room_id][user_id] = websocket
                    self.room_owners[room_id] = user_id
                    
                    # Initialize video state if not exists
                    if room_id not in self.video_states:
                        self.video_states[room_id] = "0"  # Default video time
                    
                    # Activate room
                    await activate_room(room_id)
                    print(f"Room {room_id} activated by owner")
                else:
                    # Non-owner trying to join
                    print(f"Non-owner {user_id} trying to join room {room_id}")
                    if room.status != "active":
                        print(f"Room {room_id} is not active")
                        await websocket.close(code=4000, reason="Room is inactive. Wait for owner to join.")
                        return False
                    if room_id not in self.active_rooms:
                        print(f"Room {room_id} has no active connections")
                        await websocket.close(code=4000, reason="Room is not active. Wait for owner to join.")
                        return False
                    
                    self.active_rooms[room_id][user_id] = websocket

                # Send current video state to new user if it exists
           
      
           
                try:
                    print('\n')
                    print("-------------------------------- " )
                    print("Room ID: ", room_id)
                    print("Sending video state to user: ", user_id, "Video state: ", self.video_states[room_id])
                    print("--------------------------------")
                    print('\n')
                    if room_id in self.video_states:
                        await websocket.send_json({
                            "type": "video_event",
                            "user_id": user_id,
                            "user_name": name,
                            "timestamp": datetime.now().isoformat(),
                            "event_type": "play",
                            "video_time": self.video_states[room_id]
                        })
                except Exception as e:
                    print(f"Error sending video state: {str(e)}")
                    # Continue even if video state send fails

                # Notify about new user
                try:
                    await self.broadcast_to_room(
                        room_id,
                        {
                            "type": "join",
                            "user_name": name,
                            "user_id": user_id,
                            "is_owner": room.created_by == user_id,
                            "timestamp": datetime.now().isoformat()
                        }
                    )
                except Exception as e:
                    print(f"Error broadcasting join message: {str(e)}")
                    # Continue even if broadcast fails

                return True

        except Exception as e:
            print(f"Error in connect for room {room_id}: {str(e)}")
            try:
                await websocket.close(code=4000, reason="Connection error")
            except:
                pass
            # Clean up any partial connection state
            if room_id in self.active_rooms and user_id in self.active_rooms[room_id]:
                del self.active_rooms[room_id][user_id]
            return False

    async def disconnect(self, room_id: str, user_id: str):
        print(f"\n=== Disconnect Request ===")
        print(f"Room ID: {room_id}")
        print(f"User ID: {user_id}")
        
        try:
            if room_id in self.active_rooms:
                is_owner = self.room_owners.get(room_id) == user_id
                print(f"Is Owner: {is_owner}")
                
                # Check if user is still in room
                if user_id in self.active_rooms[room_id]:
                    self.active_rooms[room_id].pop(user_id, None)
                    print(f"User removed from active room")
                    print(f"Remaining users: {list(self.active_rooms[room_id].keys())}")
                    
                    if is_owner:
                        print("Owner disconnected - closing room")
                        await self.close_room(room_id)
                        
                    else:
                        print("Regular user disconnected - notifying others")
                        await self.broadcast_to_room(
                            room_id,
                            {
                                "type": "leave",
                                "user_id": user_id,
                                "message": f"User left the room",
                                "timestamp": datetime.now().isoformat()
                            }
                        )
        except Exception as e:
            print(f"Error in disconnect: {str(e)}")

    async def close_room(self, room_id: str):
        if room_id in self.active_rooms:
            try:
                with Session(bind=engine) as session:
                    room = session.get(Room, room_id)
                    room.status = "inactive"
                    session.add(room)
                    session.commit()
                    
                await self.broadcast_to_room(
                    room_id,
                    {
                        "type": "room_closed",
                        "message": "Room owner left, closing room",
                        "timestamp": datetime.now().isoformat()
                    }
                )
                
                # Clean up video state
                if room_id in self.video_states:
                    del self.video_states[room_id]
                
                await self.close_all_connections(room_id)
            except Exception as e:
                print(f"Error closing room {room_id}: {str(e)}")
                
    async def close_all_connections(self, room_id: str):
    
        if room_id in self.active_rooms:
           
            for user_id ,ws in self.active_rooms[room_id].items():
                await ws.close(
                    code=1000,
                    reason="Room closed by owner"
                )
            self.active_rooms.pop(room_id, None)
            self.room_owners.pop(room_id, None)
            
            if room_id in self.room_owners:
                self.room_owners.pop(room_id, None)
    
    async def broadcast_to_room(self, room_id: str, message: dict, exclude_user: str = None):
        if room_id in self.active_rooms:
            disconnected_users = []
            for user_id, connection in self.active_rooms[room_id].items():
                if exclude_user != user_id:
                    try:
                        print("--------------------------------")
                        print("Sending Message to user: ", user_id, "Message: ", message)
                        print("--------------------------------")
                        await connection.send_json(message)
                    except Exception as e:
                        disconnected_users.append(user_id)
            
            # Clean up disconnected users
            for user_id in disconnected_users:
                await self.disconnect(room_id, user_id)
    
    
    def is_room_owner(self, room_id: str, user_id: str) -> bool:
        """Check if user is the room owner"""
        return self.room_owners.get(room_id) == user_id

    async def update_video_state(self, room_id: str, state: dict):
        """Update video state for a room"""
        self.video_states[room_id] = state


async def activate_room(room_id: str):
    with Session(bind=engine) as session:
        room = session.get(Room, room_id)
        if room is None:
            return False
        
        try:
            room.status = "active"
            session.add(room)
            session.commit()
            return True
        except Exception as e:
            print(f"Error activating room: {str(e)}")
            session.rollback()
            return False

async def get_room_owner(room_id: str):
    with Session(bind=engine) as session:
        room = session.get(Room, room_id)
        if room is None:
            return None
        
        try:
            session.refresh(room)
            return room.owner_id
        except Exception as e:
            print(f"Error refreshing room: {str(e)}")
            # If refresh fails, try to get owner_id directly
            return room.owner_id if room else None


from typing import List, Optional
from sqlmodel import Session, select
from datetime import datetime

from ..model.model import (
  Room,
  CreateRoom,
  RoomResponse,
  AddVideoToRoom,
)

class RoomService:
    def __init__(self, session: Session):
        self.session = session

    async def create_room(self, room_data: CreateRoom, user_id: str) -> Room:
        """Create a new room."""
        room = Room(
            name=room_data.name,
            description=room_data.description,
            created_by=user_id,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat()
        )
        self.session.add(room)
        self.session.commit()
        self.session.refresh(room)
        return room

    async def get_room(self, room_id: str) -> Optional[any]:
        result =  self.session.get(Room, room_id)
        return result

    async def get_all_rooms(self, user_id: str) -> List[Room]:
        """Get all rooms for a user."""
        statement = select(Room).where(Room.created_by == user_id)
        result = self.session.exec(statement)
        
        return result.all()

    async def update_room(self, room_id: str, room_data: CreateRoom, user_id: str) -> Optional[Room]:
        """Update a room's details."""
        room = await self.get_room(room_id)
        if not room or room.created_by != user_id:
            return None

        room.name = room_data.name
        room.description = room_data.description
        room.updated_at = datetime.now().isoformat()

        self.session.commit()
        self.session.refresh(room)
        return room

    async def delete_room(self, room_id: str, user_id: str) -> bool:
        """Delete a room."""
        room = await self.get_room(room_id)
        if not room or room.created_by != user_id:
            return False

        self.session.delete(room)
        self.session.commit()
        return True

    async def add_video_to_room(self, room_id: str, data: AddVideoToRoom, user_id: str) -> Optional[Room]:
        """Add a video to a room."""
        room = await self.get_room(room_id  )
        if not room or room.created_by != user_id:
            return None
        
        room.video_key = data.video_key
                
        print("--------------------------------")
        print(room.video_key)
        print("--------------------------------")

        room.updated_at = datetime.now().isoformat()
        
        self.session.add(room)
        self.session.commit()
        self.session.refresh(room)
        return room

    async def remove_video_from_room(self, room_id: str, user_id: str) -> Optional[Room]:
        """Remove a video from a room."""
        room = await self.get_room(room_id)
        if not room or room.created_by != user_id:
            return None
        # Remove video key from room
        if room.video_key is not None:
            room.video_key = None
        room.updated_at = datetime.now().isoformat()
        
        self.session.add(room)
        self.session.commit()
        self.session.refresh(room)
        return room

    def _to_response(self, room: Room) -> RoomResponse:
        """Convert Room model to RoomResponse."""
        return RoomResponse(
            id=room.id,
            name=room.name,
            status=room.status,
            description=room.description,
            created_by=room.created_by,
            created_at=room.created_at,
            updated_at=room.updated_at,
            video_key=room.video_key  # Changed from video_keys to video_key
        )

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session
from typing import List

from backend.server.db.db import get_session
from backend.server.model.model import (
    CreateRoom,
    RoomResponse,
    AddVideoToRoom,
    RemoveVideoFromRoom,
)
from backend.server.room.room_service import RoomService

router = APIRouter(

    tags=["rooms"]
)

def get_room_service(session: Session = Depends(get_session)) -> RoomService:
    return RoomService(session)

@router.post("", response_model=RoomResponse)
async def create_room(
    request: Request,
    room_data: CreateRoom,
    room_service: RoomService = Depends(get_room_service)
):
    """Create a new room."""
    try:
        user = request.state.user
        room = await room_service.create_room(room_data, user.id)
        return room_service._to_response(room)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("", response_model=List[RoomResponse])
async def get_all_rooms(
    request: Request,
    room_service: RoomService = Depends(get_room_service)
):
    """Get all rooms for the current user."""
    user = request.state.user
    rooms = await room_service.get_all_rooms(user.id)
    return [room_service._to_response(room) for room in rooms]

@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(
    request: Request,
    room_id: str,
    room_service: RoomService = Depends(get_room_service)
):
    """Get a specific room by ID."""
    user = request.state.user
    room = await room_service.get_room(room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    if room.created_by != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this room"
        )
    return room_service._to_response(room)

@router.put("/{room_id}", response_model=RoomResponse)
async def update_room(
    request: Request,
    room_id: str,
    room_data: CreateRoom,
    room_service: RoomService = Depends(get_room_service)
):
    user = request.state.user
    updated_room = await room_service.update_room(room_id, room_data, user.id)
    if not updated_room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found or not authorized"
        )
    return room_service._to_response(updated_room)

@router.delete("/{room_id}")
async def delete_room(
    request: Request,
    room_id: str,
    room_service: RoomService = Depends(get_room_service)
):
    """Delete a room."""
    user = request.state.user
    success = await room_service.delete_room(room_id, user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found or not authorized"
        )
    return {"message": "Room deleted successfully"}

@router.post("/add-video/{room_id}", response_model=RoomResponse)
async def add_video_to_room(
    request: Request,
    room_id: str,
    data: AddVideoToRoom,
    room_service: RoomService = Depends(get_room_service)
):
    """Add a video to a room."""
    
    print("--------------------------------")
    print(data)
    print("--------------------------------")
    
    user = request.state.user
    updated_room = await room_service.add_video_to_room(room_id, data, user.id)
    
    print("--------------------------------")
    print(updated_room)
    print("--------------------------------")
    
    if not updated_room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room or video not found or not authorized"
        )
    return room_service._to_response(updated_room)

@router.delete("/remove-video/{room_id}", response_model=RoomResponse)
async def remove_video_from_room(
    request: Request,
    room_id: str,
    room_service: RoomService = Depends(get_room_service)
):
    """Remove a video from a room."""
    user = request.state.user
    updated_room = await room_service.remove_video_from_room(room_id, user.id)
    if not updated_room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found or not authorized"
        )
    return room_service._to_response(updated_room)

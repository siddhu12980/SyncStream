from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
from backend.server.model.model import Room,RoomResponse
from sqlmodel import Session
from backend.server.db.db import get_session

router = APIRouter()
public_router = APIRouter()  # New router for public endpoints

# Public routes (no auth required)
@public_router.get("/room/{room_id}", response_model=RoomResponse)
async def get_public_rooms( room_id: str, session: Session = Depends(get_session)):
    try:
        room = session.get(Room, room_id)
       
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        print(room)
        return room
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching public rooms: {str(e)}")


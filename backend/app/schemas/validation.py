from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List
from enum import Enum

class StrictBaseModel(BaseModel):
    model_config = ConfigDict(
        strict=True,
        extra='forbid',
        validate_assignment=True
    )

class MediaEnum(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"

class MediaUploadSchema(StrictBaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    file_type: MediaEnum
    size: int = Field(..., gt=0, le=524288000)  # 500MB max

    @field_validator('filename')
    @classmethod
    def prevent_malformed_path(cls, v: str) -> str:
        if ".." in v or "/" in v or "\\" in v:
            raise ValueError("Malformed filename detected")
        return v

class NotificationCreateSchema(StrictBaseModel):
    user_id: int
    type: str = Field(..., pattern="^[A-Z_]+$")
    payload: dict
    priority: int = Field(default=1, ge=1, le=5)

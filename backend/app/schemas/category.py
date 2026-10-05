"""
Schema Pydantic untuk ReportCategory dan CategoryField.
"""

from pydantic import BaseModel, ConfigDict
from app.models.enums import ReportPriority


class CategoryFieldResponse(BaseModel):
    id: int
    category_id: int
    field_name: str
    field_type: str
    is_required: bool

    model_config = ConfigDict(from_attributes=True)


class ReportCategoryResponse(BaseModel):
    id: int
    nama_kategori: str
    default_priority: ReportPriority
    is_active: bool
    fields: list[CategoryFieldResponse] = []

    model_config = ConfigDict(from_attributes=True)

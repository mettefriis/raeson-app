"""
Project routes — CRUD for architecture projects.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from api.models.database import get_db, Project
from api.services.auth import get_optional_user

router = APIRouter(prefix="/api/projects", tags=["projects"])


class ProjectCreate(BaseModel):
    name: str
    project_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    building_type: Optional[str] = None
    building_class: Optional[str] = None
    climate_zone: Optional[str] = None
    jurisdiction: Optional[str] = "NL"
    architect_name: Optional[str] = None


class ProjectOut(BaseModel):
    id: int
    name: str
    project_number: Optional[str]
    address: Optional[str]
    city: Optional[str]
    building_type: Optional[str]
    building_class: Optional[str]
    climate_zone: Optional[str]
    jurisdiction: Optional[str]
    architect_name: Optional[str]
    created_at: Optional[datetime]
    assessment_count: int = 0

    class Config:
        from_attributes = True


@router.get("", response_model=list[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(get_optional_user),
):
    """List all projects. In future, scoped to firm."""
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    result = []
    for p in projects:
        out = ProjectOut(
            id=p.id,
            name=p.name,
            project_number=p.project_number,
            address=p.address,
            city=p.city,
            building_type=p.building_type,
            building_class=p.building_class,
            climate_zone=p.climate_zone,
            jurisdiction=p.jurisdiction,
            architect_name=p.architect_name,
            created_at=p.created_at,
            assessment_count=len(p.assessments),
        )
        result.append(out)
    return result


@router.post("", response_model=ProjectOut)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(get_optional_user),
):
    """Create a new project."""
    project = Project(
        name=payload.name,
        project_number=payload.project_number,
        address=payload.address,
        city=payload.city,
        building_type=payload.building_type,
        building_class=payload.building_class,
        climate_zone=payload.climate_zone,
        jurisdiction=payload.jurisdiction,
        architect_name=payload.architect_name,
        created_at=datetime.now(timezone.utc),
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return ProjectOut(
        id=project.id,
        name=project.name,
        project_number=project.project_number,
        address=project.address,
        city=project.city,
        building_type=project.building_type,
        building_class=project.building_class,
        climate_zone=project.climate_zone,
        jurisdiction=project.jurisdiction,
        architect_name=project.architect_name,
        created_at=project.created_at,
        assessment_count=0,
    )


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(get_optional_user),
):
    """Get a single project by ID."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectOut(
        id=project.id,
        name=project.name,
        project_number=project.project_number,
        address=project.address,
        city=project.city,
        building_type=project.building_type,
        building_class=project.building_class,
        climate_zone=project.climate_zone,
        jurisdiction=project.jurisdiction,
        architect_name=project.architect_name,
        created_at=project.created_at,
        assessment_count=len(project.assessments),
    )


@router.delete("/{project_id}")
def archive_project(
    project_id: int,
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(get_optional_user),
):
    """Delete a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"ok": True}

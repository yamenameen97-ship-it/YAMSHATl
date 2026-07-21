"""add editable identity fields to user profiles

Revision ID: 20260721_0017
Revises: 20260712_0016
"""
import sqlalchemy as sa
from alembic import op

revision = "20260721_0017"
down_revision = "20260712_0016"
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    columns = {c["name"] for c in sa.inspect(bind).get_columns("user_profiles")}
    additions = [
        ("first_name", sa.String(length=80)),
        ("father_name", sa.String(length=80)),
        ("last_name", sa.String(length=80)),
        ("date_of_birth", sa.DateTime()),
    ]
    for name, column_type in additions:
        if name not in columns:
            op.add_column("user_profiles", sa.Column(name, column_type, nullable=True))

def downgrade():
    bind = op.get_bind()
    columns = {c["name"] for c in sa.inspect(bind).get_columns("user_profiles")}
    for name in ("date_of_birth", "last_name", "father_name", "first_name"):
        if name in columns:
            op.drop_column("user_profiles", name)

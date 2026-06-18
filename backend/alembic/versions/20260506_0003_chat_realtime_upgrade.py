"""chat realtime upgrade

Revision ID: 20260506_0003
Revises: 20260505_0002
Create Date: 2026-05-06 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = '20260506_0003'
down_revision = '20260505_0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('messages', sa.Column('client_id', sa.String(length=80), nullable=True))
    op.add_column('messages', sa.Column('delivered_at', sa.DateTime(), nullable=True))
    op.add_column('messages', sa.Column('seen_at', sa.DateTime(), nullable=True))
    op.create_index('ix_messages_sender_client_id', 'messages', ['sender_id', 'client_id'], unique=False)
    op.create_unique_constraint('uq_messages_sender_client_id', 'messages', ['sender_id', 'client_id'])


def downgrade() -> None:
    op.drop_constraint('uq_messages_sender_client_id', 'messages', type_='unique')
    op.drop_index('ix_messages_sender_client_id', table_name='messages')
    op.drop_column('messages', 'seen_at')
    op.drop_column('messages', 'delivered_at')
    op.drop_column('messages', 'client_id')

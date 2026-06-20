"""create reports & report_events tables

Revision ID: 20260614_0010
Revises: 20260611_0009
Create Date: 2026-06-14

نظام البلاغات الموحّد لكل المحتوى:
- المنشورات، الريلز، الستوري، التعليقات
- رسائل الشات والمجموعات
- المستخدمين والمجموعات والغرف الصوتية

ينشئ جدولين:
  reports        — السجل الرئيسي للبلاغات
  report_events  — سجل الأحداث/المراسلات على كل بلاغ
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '20260614_0010'
down_revision = '20260611_0009'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ====================================================
    # reports
    # ====================================================
    op.create_table(
        'reports',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('reporter_user_id', sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='SET NULL'),
                  nullable=True, index=True),
        sa.Column('target_type', sa.String(length=40), nullable=False, index=True),
        sa.Column('target_id', sa.String(length=64), nullable=False, index=True),
        sa.Column('target_owner_user_id', sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='SET NULL'),
                  nullable=True, index=True),
        sa.Column('reason', sa.String(length=40), nullable=False, index=True),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('priority', sa.String(length=10), nullable=False,
                  server_default='normal', index=True),
        sa.Column('status', sa.String(length=20), nullable=False,
                  server_default='pending', index=True),
        sa.Column('snapshot', sa.JSON(), nullable=False,
                  server_default=sa.text("'{}'")),
        sa.Column('context', sa.JSON(), nullable=False,
                  server_default=sa.text("'{}'")),
        sa.Column('handled_by_user_id', sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='SET NULL'),
                  nullable=True, index=True),
        sa.Column('handled_at', sa.DateTime(), nullable=True),
        sa.Column('moderator_notes', sa.Text(), nullable=True),
        sa.Column('action_taken', sa.String(length=60), nullable=True),
        sa.Column('duplicate_count', sa.Integer(), nullable=False,
                  server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False,
                  server_default=sa.func.now(), index=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False,
                  server_default=sa.func.now()),
    )

    op.create_index('ix_reports_target', 'reports',
                    ['target_type', 'target_id'])
    op.create_index('ix_reports_status_priority', 'reports',
                    ['status', 'priority'])

    # ====================================================
    # report_events
    # ====================================================
    op.create_table(
        'report_events',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('report_id', sa.Integer(),
                  sa.ForeignKey('reports.id', ondelete='CASCADE'),
                  nullable=False, index=True),
        sa.Column('actor_user_id', sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='SET NULL'),
                  nullable=True, index=True),
        sa.Column('event_type', sa.String(length=40), nullable=False, index=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('meta', sa.JSON(), nullable=False,
                  server_default=sa.text("'{}'")),
        sa.Column('created_at', sa.DateTime(), nullable=False,
                  server_default=sa.func.now(), index=True),
    )


def downgrade() -> None:
    op.drop_table('report_events')
    op.drop_index('ix_reports_status_priority', table_name='reports')
    op.drop_index('ix_reports_target', table_name='reports')
    op.drop_table('reports')

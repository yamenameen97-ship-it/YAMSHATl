"""إضافة جداول المجموعات - Add Groups Schema

Revision ID: 20260507_0004
Revises: 20260506_0003
Create Date: 2026-05-07 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260507_0004'
down_revision = '20260506_0003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # جدول المجموعات الرئيسي
    op.create_table(
        'groups',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('cover_image_url', sa.String(length=500), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('owner_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('members_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('posts_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_groups_id', 'groups', ['id'], unique=False)
    op.create_index('ix_groups_owner_id', 'groups', ['owner_id'], unique=False)
    op.create_index('ix_groups_is_public', 'groups', ['is_public'], unique=False)
    op.create_index('ix_groups_category', 'groups', ['category'], unique=False)
    op.create_index('ix_groups_created_at', 'groups', ['created_at'], unique=False)

    # جدول أعضاء المجموعات
    op.create_table(
        'group_members',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('group_id', sa.String(length=36), sa.ForeignKey('groups.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='member'),  # owner, admin, moderator, member
        sa.Column('is_muted', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('is_banned', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('joined_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_group_members_id', 'group_members', ['id'], unique=False)
    op.create_index('ix_group_members_group_id', 'group_members', ['group_id'], unique=False)
    op.create_index('ix_group_members_user_id', 'group_members', ['user_id'], unique=False)
    op.create_index('ix_group_members_group_user', 'group_members', ['group_id', 'user_id'], unique=True)

    # جدول دعوات المجموعات
    op.create_table(
        'group_invitations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('group_id', sa.String(length=36), sa.ForeignKey('groups.id', ondelete='CASCADE'), nullable=False),
        sa.Column('inviter_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('invitee_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('is_accepted', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_group_invitations_id', 'group_invitations', ['id'], unique=False)
    op.create_index('ix_group_invitations_group_id', 'group_invitations', ['group_id'], unique=False)
    op.create_index('ix_group_invitations_inviter_id', 'group_invitations', ['inviter_id'], unique=False)
    op.create_index('ix_group_invitations_invitee_id', 'group_invitations', ['invitee_id'], unique=False)

    # جدول طلبات الانضمام للمجموعات
    op.create_table(
        'group_join_requests',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('group_id', sa.String(length=36), sa.ForeignKey('groups.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),  # pending, approved, rejected
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_group_join_requests_id', 'group_join_requests', ['id'], unique=False)
    op.create_index('ix_group_join_requests_group_id', 'group_join_requests', ['group_id'], unique=False)
    op.create_index('ix_group_join_requests_user_id', 'group_join_requests', ['user_id'], unique=False)
    op.create_index('ix_group_join_requests_status', 'group_join_requests', ['status'], unique=False)

    # جدول منشورات المجموعات
    op.create_table(
        'group_posts',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('group_id', sa.String(length=36), sa.ForeignKey('groups.id', ondelete='CASCADE'), nullable=False),
        sa.Column('author_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('media_urls', sa.JSON(), nullable=True),
        sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('likes_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('comments_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('shares_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_group_posts_id', 'group_posts', ['id'], unique=False)
    op.create_index('ix_group_posts_group_id', 'group_posts', ['group_id'], unique=False)
    op.create_index('ix_group_posts_author_id', 'group_posts', ['author_id'], unique=False)
    op.create_index('ix_group_posts_created_at', 'group_posts', ['created_at'], unique=False)

    # جدول قواعد المجموعات
    op.create_table(
        'group_rules',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('group_id', sa.String(length=36), sa.ForeignKey('groups.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_group_rules_id', 'group_rules', ['id'], unique=False)
    op.create_index('ix_group_rules_group_id', 'group_rules', ['group_id'], unique=False)

    # جدول الأحداث في المجموعات
    op.create_table(
        'group_events',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('group_id', sa.String(length=36), sa.ForeignKey('groups.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=True),
        sa.Column('location', sa.String(length=300), nullable=True),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('attendees_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_group_events_id', 'group_events', ['id'], unique=False)
    op.create_index('ix_group_events_group_id', 'group_events', ['group_id'], unique=False)

    # جدول الاستطلاعات في المجموعات
    op.create_table(
        'group_polls',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('group_id', sa.String(length=36), sa.ForeignKey('groups.id', ondelete='CASCADE'), nullable=False),
        sa.Column('creator_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('question', sa.String(length=500), nullable=False),
        sa.Column('options', sa.JSON(), nullable=False),
        sa.Column('votes', sa.JSON(), nullable=True),
        sa.Column('end_time', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_group_polls_id', 'group_polls', ['id'], unique=False)
    op.create_index('ix_group_polls_group_id', 'group_polls', ['group_id'], unique=False)

    # جدول الإعلانات في المجموعات
    op.create_table(
        'group_announcements',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('group_id', sa.String(length=36), sa.ForeignKey('groups.id', ondelete='CASCADE'), nullable=False),
        sa.Column('creator_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_group_announcements_id', 'group_announcements', ['id'], unique=False)
    op.create_index('ix_group_announcements_group_id', 'group_announcements', ['group_id'], unique=False)

    # جدول إعدادات المجموعات
    op.create_table(
        'group_settings',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('group_id', sa.String(length=36), sa.ForeignKey('groups.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('allow_member_invites', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('require_approval', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('allow_external_links', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('allow_live_streaming', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('allow_file_uploads', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('slow_mode_seconds', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_group_settings_id', 'group_settings', ['id'], unique=False)
    op.create_index('ix_group_settings_group_id', 'group_settings', ['group_id'], unique=True)


def downgrade() -> None:
    # حذف الجداول بالترتيب العكسي
    op.drop_table('group_settings')
    op.drop_table('group_announcements')
    op.drop_table('group_polls')
    op.drop_table('group_events')
    op.drop_table('group_rules')
    op.drop_table('group_posts')
    op.drop_table('group_join_requests')
    op.drop_table('group_invitations')
    op.drop_table('group_members')
    op.drop_table('groups')

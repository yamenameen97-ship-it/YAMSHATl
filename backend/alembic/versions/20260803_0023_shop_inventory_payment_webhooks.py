"""shop inventory + payment webhooks (v89.29)

Revision ID: 20260803_0023
Revises: 20260729_0022
Create Date: 2026-08-03

يُضيف حقول جرد المخزون اللحظي لجدول shop_ads،
حقول تتبّع الدفع لجدول shop_ad_orders،
وجدولاً جديداً shop_payment_events لتخزين webhooks الدفع بشكل idempotent.

المشكلة التي يحلّها:
  - لم يكن هناك ربط آمن مع خطافات بوابات الدفع (Payment Webhooks).
  - لم يكن هناك نظام جرد مخزون لحظي — طلب نفس المنتج من عدة مستخدمين
    في نفس اللحظة كان يسبّب تعارضاً وبيع كميات غير موجودة.
"""
from alembic import op
import sqlalchemy as sa


revision = '20260803_0023'
down_revision = '20260729_0022'
branch_labels = None
depends_on = None


def _has_column(bind, table: str, column: str) -> bool:
    inspector = sa.inspect(bind)
    if table not in inspector.get_table_names():
        return False
    cols = [c['name'] for c in inspector.get_columns(table)]
    return column in cols


def _has_table(bind, table: str) -> bool:
    inspector = sa.inspect(bind)
    return table in inspector.get_table_names()


def upgrade() -> None:
    bind = op.get_bind()

    # 1) shop_ads: حقول المخزون + الدفع
    with op.batch_alter_table('shop_ads') as batch:
        if not _has_column(bind, 'shop_ads', 'stock'):
            batch.add_column(sa.Column('stock', sa.Integer(), nullable=False, server_default='0'))
        if not _has_column(bind, 'shop_ads', 'reserved'):
            batch.add_column(sa.Column('reserved', sa.Integer(), nullable=False, server_default='0'))
        if not _has_column(bind, 'shop_ads', 'sold'):
            batch.add_column(sa.Column('sold', sa.Integer(), nullable=False, server_default='0'))
        if not _has_column(bind, 'shop_ads', 'low_stock_threshold'):
            batch.add_column(sa.Column('low_stock_threshold', sa.Integer(), nullable=False, server_default='0'))
        if not _has_column(bind, 'shop_ads', 'track_inventory'):
            batch.add_column(sa.Column('track_inventory', sa.Boolean(), nullable=False, server_default=sa.false()))
        if not _has_column(bind, 'shop_ads', 'payment_provider'):
            batch.add_column(sa.Column('payment_provider', sa.Text(), nullable=True, server_default='none'))
        if not _has_column(bind, 'shop_ads', 'external_ref'):
            batch.add_column(sa.Column('external_ref', sa.Text(), nullable=True))

    # 2) shop_ad_orders: حقول الدفع
    with op.batch_alter_table('shop_ad_orders') as batch:
        if not _has_column(bind, 'shop_ad_orders', 'payment_status'):
            batch.add_column(sa.Column('payment_status', sa.Text(), nullable=False, server_default='unpaid'))
        if not _has_column(bind, 'shop_ad_orders', 'payment_provider'):
            batch.add_column(sa.Column('payment_provider', sa.Text(), nullable=True))
        if not _has_column(bind, 'shop_ad_orders', 'payment_ref'):
            batch.add_column(sa.Column('payment_ref', sa.Text(), nullable=True))
        if not _has_column(bind, 'shop_ad_orders', 'amount_total'):
            batch.add_column(sa.Column('amount_total', sa.Float(), nullable=False, server_default='0'))
        if not _has_column(bind, 'shop_ad_orders', 'currency'):
            batch.add_column(sa.Column('currency', sa.Text(), nullable=False, server_default='USD'))
        if not _has_column(bind, 'shop_ad_orders', 'idempotency_key'):
            batch.add_column(sa.Column('idempotency_key', sa.Text(), nullable=True))
        if not _has_column(bind, 'shop_ad_orders', 'paid_at'):
            batch.add_column(sa.Column('paid_at', sa.DateTime(), nullable=True))
        if not _has_column(bind, 'shop_ad_orders', 'refunded_at'):
            batch.add_column(sa.Column('refunded_at', sa.DateTime(), nullable=True))
        if not _has_column(bind, 'shop_ad_orders', 'expires_at'):
            batch.add_column(sa.Column('expires_at', sa.DateTime(), nullable=True))

    # فهارس مفيدة
    try:
        op.create_index('ix_shop_ad_orders_payment_status', 'shop_ad_orders', ['payment_status'])
    except Exception:
        pass
    try:
        op.create_index('ix_shop_ad_orders_payment_ref', 'shop_ad_orders', ['payment_ref'])
    except Exception:
        pass
    try:
        op.create_unique_constraint('uq_shop_ad_orders_idempotency', 'shop_ad_orders', ['idempotency_key'])
    except Exception:
        pass

    # 3) جدول shop_payment_events لتخزين webhooks
    if not _has_table(bind, 'shop_payment_events'):
        op.create_table(
            'shop_payment_events',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('provider', sa.Text(), nullable=False),
            sa.Column('event_id', sa.Text(), nullable=False),
            sa.Column('event_type', sa.Text(), nullable=False),
            sa.Column('order_id', sa.Integer(), sa.ForeignKey('shop_ad_orders.id', ondelete='SET NULL'), nullable=True),
            sa.Column('payment_ref', sa.Text(), nullable=True),
            sa.Column('signature_ok', sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column('processed', sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column('payload_json', sa.Text(), nullable=False, server_default='{}'),
            sa.Column('error', sa.Text(), nullable=True),
            sa.Column('received_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('processed_at', sa.DateTime(), nullable=True),
            sa.UniqueConstraint('provider', 'event_id', name='uq_shop_payment_events_provider_event'),
        )
        op.create_index('ix_shop_payment_events_provider', 'shop_payment_events', ['provider'])
        op.create_index('ix_shop_payment_events_provider_type', 'shop_payment_events', ['provider', 'event_type'])
        op.create_index('ix_shop_payment_events_order_id', 'shop_payment_events', ['order_id'])
        op.create_index('ix_shop_payment_events_payment_ref', 'shop_payment_events', ['payment_ref'])
        op.create_index('ix_shop_payment_events_processed', 'shop_payment_events', ['processed'])
        op.create_index('ix_shop_payment_events_received_at', 'shop_payment_events', ['received_at'])


def downgrade() -> None:
    # نُبقي البيانات — downgrade يزيل الجدول الجديد فقط
    try:
        op.drop_table('shop_payment_events')
    except Exception:
        pass
    for col in ('expires_at', 'refunded_at', 'paid_at', 'idempotency_key', 'currency',
                'amount_total', 'payment_ref', 'payment_provider', 'payment_status'):
        try:
            with op.batch_alter_table('shop_ad_orders') as batch:
                batch.drop_column(col)
        except Exception:
            pass
    for col in ('external_ref', 'payment_provider', 'track_inventory',
                'low_stock_threshold', 'sold', 'reserved', 'stock'):
        try:
            with op.batch_alter_table('shop_ads') as batch:
                batch.drop_column(col)
        except Exception:
            pass

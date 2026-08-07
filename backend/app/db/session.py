"""
Database session/engine wiring — v89.50

v89.50 fix — Smart URL Resolver with Internal→External DNS Fallback
─────────────────────────────────────────────────────────────────────
قبل هذا الإصلاح كان الملف يعتمد على DATABASE_URL كما هو من البيئة/settings،
وعندما يكون الرابط الداخلي لـ Render (dpg-xxx-a بدون domain) وفشل DNS
في حلّه (مناطق مختلفة/cold start/شبكة داخلية غير جاهزة) نحصل على:

    psycopg2.OperationalError:
      could not translate host name "dpg-xxx-a" to address:
      Name or service not known

الحل: نستخدم resolve_database_url() من url_resolver.py الذي يجرّب:
    Internal → External (مشتق تلقائياً) → sqlite (كملاذ أخير)
ويختار أول مرشّح ينجح في DNS + TCP handshake.
"""

import logging

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.url_resolver import resolve_database_url, get_last_resolved_url_masked

logger = logging.getLogger(__name__)

engine_kwargs = {
    'pool_pre_ping': True,
    # v85.2 fix: pool_recycle مهم لـ Render Postgres — الخادم يقطع
    # الاتصالات الخاملة بعد فترة قصيرة، وبدون recycle نحصل على
    # "server closed the connection unexpectedly".
    'pool_recycle': 280,
}
connect_args = {}


# v89.50: نستخدم المحلّل الذكي بدلاً من قراءة DATABASE_URL مباشرة.
# هذا يضمن أن أي فشل DNS في الرابط الداخلي يُعالَج تلقائياً بالوقوع
# على الرابط الخارجي مع sslmode=require.
DATABASE_URL = resolve_database_url()
logger.info('Database engine will connect to: %s', get_last_resolved_url_masked() or DATABASE_URL)

if DATABASE_URL.startswith('sqlite'):
    connect_args['check_same_thread'] = False
elif DATABASE_URL.startswith('postgresql'):
    # v85.2 fix: connect_timeout يتجنب تعليق الخدمة لدقائق إذا كانت قاعدة
    # البيانات نائمة (Render Free tier) — يسمح بمحاولة أسرع مع pool_pre_ping.
    connect_args['connect_timeout'] = 10

if connect_args:
    engine_kwargs['connect_args'] = connect_args

engine = create_engine(DATABASE_URL, **engine_kwargs)

if DATABASE_URL.startswith(('postgresql://', 'postgres://')):
    @event.listens_for(engine, 'connect')
    def _set_statement_timeout(dbapi_connection, _connection_record):
        cursor = dbapi_connection.cursor()
        try:
            timeout_ms = max(int(getattr(settings, 'DB_STATEMENT_TIMEOUT_MS', 8000)), 1000)
            cursor.execute(f'SET statement_timeout = {timeout_ms}')
        except Exception as exc:
            logger.warning('Could not set statement_timeout: %s', exc)
        finally:
            cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

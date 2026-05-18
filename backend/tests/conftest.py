from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

import app.main as main_module
import app.models  # noqa: F401
from app.core.dependencies import get_current_user, get_db
from app.db.base import Base
from app.main import fastapi_app
from app.models.user import User


@pytest.fixture()
def db_session(tmp_path) -> Generator[Session, None, None]:
    db_file = tmp_path / 'test.db'
    engine = create_engine(f'sqlite:///{db_file}', connect_args={'check_same_thread': False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def current_user(db_session: Session) -> User:
    user = User(
        username='tester',
        email='tester@example.com',
        hashed_password='pbkdf2:sha256:260000$test$hash',
        email_verified=True,
        is_active=True,
        role='admin',
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def client(db_session: Session, current_user: User) -> Generator[TestClient, None, None]:
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_get_current_user():
        return current_user

    fastapi_app.dependency_overrides[get_db] = override_get_db
    fastapi_app.dependency_overrides[get_current_user] = override_get_current_user
    original_initialize_database = main_module.initialize_database
    main_module.initialize_database = lambda _engine: None
    with TestClient(fastapi_app) as test_client:
        test_client.headers.update({'X-Requested-With': 'XMLHttpRequest'})
        yield test_client
    main_module.initialize_database = original_initialize_database
    fastapi_app.dependency_overrides.clear()

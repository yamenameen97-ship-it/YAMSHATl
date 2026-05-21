import importlib.util
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
sys.path.insert(0, str(ROOT / 'gateway'))

os.environ.setdefault('DATABASE_URL', 'postgresql://postgres:1234@localhost:5432/yamshat')
os.environ.setdefault('SECRET_KEY', 'test-secret')
os.environ.setdefault('ENABLE_TRACING', 'false')
os.environ.setdefault('REDIS_URL', 'redis://localhost:6379/0')


def load_module(module_name: str, relative_path: str):
    spec = importlib.util.spec_from_file_location(module_name, ROOT / relative_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def test_user_service_imports():
    module = load_module('user_service_main', 'user-service/main.py')
    assert module.app.title == 'YAMSHAT User Service'


def test_chat_service_imports():
    module = load_module('chat_service_main', 'chat-service/main.py')
    assert module.app.title == 'YAMSHAT Chat Service'


def test_notification_service_imports():
    module = load_module('notification_service_main', 'notification-service/main.py')
    assert module.app.title == 'YAMSHAT Notification Service'


def test_gateway_imports():
    module = load_module('gateway_main', 'gateway/main.py')
    assert module.app.title == 'YAMSHAT Gateway'

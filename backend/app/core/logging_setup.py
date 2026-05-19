import logging

from app.core.config import settings


def configure_logging() -> None:
    level_name = 'DEBUG' if settings.DEBUG else 'INFO'
    level = getattr(logging, level_name, logging.INFO)
    root_logger = logging.getLogger()
    if not root_logger.handlers:
        logging.basicConfig(
            level=level,
            format='%(asctime)s %(levelname)s [%(name)s] %(message)s',
        )
    else:
        root_logger.setLevel(level)

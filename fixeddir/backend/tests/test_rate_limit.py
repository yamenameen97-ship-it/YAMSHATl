import unittest

from app.core.rate_limit import SlidingWindowLimiter


class SlidingWindowLimiterTests(unittest.TestCase):
    def test_blocks_when_limit_reached(self):
        limiter = SlidingWindowLimiter()
        self.assertTrue(limiter.allow('chat:user:1', 2, 60))
        self.assertTrue(limiter.allow('chat:user:1', 2, 60))
        self.assertFalse(limiter.allow('chat:user:1', 2, 60))


if __name__ == '__main__':
    unittest.main()

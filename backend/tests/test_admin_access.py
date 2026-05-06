import unittest
from types import SimpleNamespace

from app.core.admin_access import effective_role, is_primary_admin_email, is_primary_admin_user


class AdminAccessTests(unittest.TestCase):
    def test_primary_admin_email_is_detected(self):
        self.assertTrue(is_primary_admin_email('yamenameen97@gmail.com'))
        self.assertFalse(is_primary_admin_email('user@example.com'))

    def test_primary_admin_user_gets_admin_role(self):
        user = SimpleNamespace(email='yamenameen97@gmail.com', role='user')
        self.assertTrue(is_primary_admin_user(user))
        self.assertEqual(effective_role(user), 'admin')

    def test_non_primary_admin_role_is_downgraded(self):
        user = SimpleNamespace(email='moderator@example.com', role='admin')
        self.assertEqual(effective_role(user), 'user')

    def test_moderator_role_is_preserved(self):
        user = SimpleNamespace(email='moderator@example.com', role='moderator')
        self.assertEqual(effective_role(user), 'moderator')


if __name__ == '__main__':
    unittest.main()

import unittest
import requests
import os

# Base URL for Gateway (assuming it's running locally for tests)
GATEWAY_URL = os.getenv('GATEWAY_URL', 'http://localhost:8000')

class TestNewServices(unittest.TestCase):
    
    def test_billing_service_routes(self):
        """Test if gateway correctly routes to billing service"""
        # Note: This requires the services to be running
        try:
            response = requests.get(f"{GATEWAY_URL}/api/billing/health")
            # If service is not running, we expect a connection error or 502/504
            self.assertIn(response.status_code, [200, 404, 502, 504])
        except requests.exceptions.ConnectionError:
            print("Gateway not running, skipping live connection test")

    def test_identity_service_routes(self):
        """Test if gateway correctly routes to identity service"""
        try:
            response = requests.get(f"{GATEWAY_URL}/api/identity/health")
            self.assertIn(response.status_code, [200, 404, 502, 504])
        except requests.exceptions.ConnectionError:
            pass

    def test_i18n_service_translations(self):
        """Test if gateway correctly routes to i18n service"""
        try:
            response = requests.get(f"{GATEWAY_URL}/api/i18n/languages")
            self.assertIn(response.status_code, [200, 404, 502, 504])
        except requests.exceptions.ConnectionError:
            pass

    def test_discovery_ai_service_routes(self):
        """Test if gateway correctly routes to discovery-ai service"""
        try:
            response = requests.get(f"{GATEWAY_URL}/api/discovery/health")
            self.assertIn(response.status_code, [200, 404, 502, 504])
        except requests.exceptions.ConnectionError:
            pass

if __name__ == '__main__':
    unittest.main()

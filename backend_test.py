import requests
import sys
import json
from datetime import datetime

class ServiceHubAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = "dummy-token"  # Using dummy token as per backend implementation
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict):
                        # Print key information from response
                        if 'stores' in response_data:
                            print(f"   Found {len(response_data['stores'])} stores")
                        elif 'products' in response_data:
                            print(f"   Found {len(response_data['products'])} products")
                        elif 'services' in response_data:
                            print(f"   Found {len(response_data['services'])} services")
                        elif 'total_users' in response_data:
                            print(f"   Dashboard data: {response_data}")
                except:
                    pass
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")

            return success, response.json() if response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        return self.run_test("Health Check", "GET", "api/health", 200)

    def test_stores_endpoint(self):
        """Test stores endpoint"""
        success, response = self.run_test("Get All Stores", "GET", "api/stores", 200)
        if success and 'stores' in response:
            stores = response['stores']
            print(f"   Store details:")
            for store in stores:
                print(f"     - {store.get('name', 'Unknown')} ({store.get('category', 'Unknown')})")
        return success

    def test_products_endpoint(self):
        """Test products endpoint"""
        success, response = self.run_test("Get All Products", "GET", "api/products", 200)
        if success and 'products' in response:
            products = response['products']
            print(f"   Product details:")
            for product in products:
                print(f"     - {product.get('name', 'Unknown')} - ₹{product.get('price', 0)}")
        return success

    def test_cab_services_endpoint(self):
        """Test cab services endpoint"""
        success, response = self.run_test("Get Cab Services", "GET", "api/cab-services", 200)
        if success and 'services' in response:
            services = response['services']
            print(f"   Cab service details:")
            for service in services:
                print(f"     - {service.get('service_type', 'Unknown')} - Base: ₹{service.get('base_fare', 0)}, Per km: ₹{service.get('price_per_km', 0)}")
        return success

    def test_handyman_services_endpoint(self):
        """Test handyman services endpoint"""
        success, response = self.run_test("Get Handyman Services", "GET", "api/handyman-services", 200)
        if success and 'services' in response:
            services = response['services']
            print(f"   Handyman service details:")
            for service in services:
                print(f"     - {service.get('name', 'Unknown')} ({service.get('category', 'Unknown')}) - {service.get('price_range', 'N/A')}")
        return success

    def test_dashboard_analytics(self):
        """Test dashboard analytics endpoint"""
        return self.run_test("Dashboard Analytics", "GET", "api/analytics/dashboard", 200)

    def test_create_user(self):
        """Test user creation"""
        user_data = {
            "email": f"test_user_{datetime.now().strftime('%H%M%S')}@example.com",
            "name": "Test User",
            "phone": "+91-9876543210",
            "role": "customer",
            "location": {"city": "Kadapa", "state": "Andhra Pradesh"}
        }
        return self.run_test("Create User", "POST", "api/users", 200, data=user_data)

    def test_create_store(self):
        """Test store creation"""
        store_data = {
            "name": "Test Store",
            "description": "A test store for API testing",
            "category": "grocery",
            "vendor_id": "test-vendor-1",
            "location": {"city": "Kadapa", "state": "Andhra Pradesh", "pincode": "516001"}
        }
        return self.run_test("Create Store", "POST", "api/stores", 200, data=store_data)

    def test_create_product(self):
        """Test product creation"""
        product_data = {
            "name": "Test Product",
            "description": "A test product for API testing",
            "price": 99.99,
            "category": "test",
            "store_id": "store-1",
            "stock": 10
        }
        return self.run_test("Create Product", "POST", "api/products", 200, data=product_data)

def main():
    print("🚀 Starting ServiceHub API Testing...")
    print("=" * 60)
    
    # Initialize tester
    tester = ServiceHubAPITester()
    
    # Run all tests
    print("\n📋 BASIC ENDPOINT TESTS")
    print("-" * 30)
    tester.test_health_check()
    tester.test_stores_endpoint()
    tester.test_products_endpoint()
    tester.test_cab_services_endpoint()
    tester.test_handyman_services_endpoint()
    tester.test_dashboard_analytics()
    
    print("\n📋 CREATE OPERATION TESTS")
    print("-" * 30)
    tester.test_create_user()
    tester.test_create_store()
    tester.test_create_product()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend is working correctly.")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
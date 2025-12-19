"""
Test script for Excel upload API
Usage: python test_upload.py
"""
import requests
import os

# Configuration
API_URL = "http://localhost:5000"
TEST_FILE_PATH = "path/to/your/excel/file.xlsx"  # Update this path

def test_health_check():
    """Test health check endpoint"""
    print("Testing health check...")
    response = requests.get(f"{API_URL}/api/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")

def test_get_groups():
    """Test get groups endpoint"""
    print("Testing get groups...")
    response = requests.get(f"{API_URL}/api/groups")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")

def test_get_sessions():
    """Test get sessions endpoint"""
    print("Testing get sessions...")
    response = requests.get(f"{API_URL}/api/sessions")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")

def test_upload_general_exam():
    """Test uploading a general exam Excel file"""
    print("Testing general exam upload...")
    
    if not os.path.exists(TEST_FILE_PATH):
        print(f"Test file not found: {TEST_FILE_PATH}")
        print("Please update TEST_FILE_PATH in the script\n")
        return
    
    with open(TEST_FILE_PATH, 'rb') as f:
        files = {'file': f}
        data = {
            'session_number': '1',
            'quiz_mark': '50',
            'finish_time': '2025-01-15 10:00:00',
            'group': 'cam1',
            'is_general_exam': 'true'
        }
        
        response = requests.post(f"{API_URL}/api/upload-excel", files=files, data=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}\n")

def test_upload_normal_lecture():
    """Test uploading a normal lecture Excel file"""
    print("Testing normal lecture upload...")
    
    if not os.path.exists(TEST_FILE_PATH):
        print(f"Test file not found: {TEST_FILE_PATH}")
        print("Please update TEST_FILE_PATH in the script\n")
        return
    
    with open(TEST_FILE_PATH, 'rb') as f:
        files = {'file': f}
        data = {
            'session_number': '1',
            'quiz_mark': '',  # Optional for normal lecture
            'finish_time': '2025-01-15 10:00:00',
            'group': 'cam1',
            'is_general_exam': 'false'
        }
        
        response = requests.post(f"{API_URL}/api/upload-excel", files=files, data=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}\n")

if __name__ == "__main__":
    print("=" * 50)
    print("Flask Backend API Test Script")
    print("=" * 50)
    print()
    
    # Run tests
    test_health_check()
    test_get_groups()
    test_get_sessions()
    
    # Uncomment to test file uploads (requires actual Excel files)
    # test_upload_general_exam()
    # test_upload_normal_lecture()
    
    print("=" * 50)
    print("Tests completed!")
    print("=" * 50)


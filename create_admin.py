import requests

url = 'http://localhost:8000/auth/create-admin'
payload = {
    'email': 'admin@example.com',
    'password': 'AdminPass123!',
    'full_name': 'Admin User'
}
resp = requests.post(url, json=payload)
print('Status:', resp.status_code)
print('Response:', resp.text)

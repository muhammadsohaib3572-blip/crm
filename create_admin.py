import requests

url = 'https://crm-production-e6ff.up.railway.app/auth/create-admin'
payload = {
    'email': 'admin@example.com',
    'password': 'AdminPass123!',
    'full_name': 'Admin User'
}
resp = requests.post(url, json=payload)
print('Status:', resp.status_code)
print('Response:', resp.text)

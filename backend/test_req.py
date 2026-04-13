import urllib.request
import json

data = json.dumps({"name": "Test Tenant", "phone": "12345678"}).encode('utf-8')
req = urllib.request.Request("http://127.0.0.1:8000/api/tenants/", data=data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as f:
        print(f.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.read().decode('utf-8'))

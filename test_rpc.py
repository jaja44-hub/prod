import xmlrpc.client

url = "https://jafiface-addis-crown-erp.hf.space"
db = "POSTGRES_DATABASE=neondb"
username = "admin"
password = "6c034bd45544684399d58e003b41f70c95a04fe5"

common = xmlrpc.client.ServerProxy('{}/xmlrpc/2/common'.format(url))
print("Attempting to authenticate...")
try:
    uid = common.authenticate(db, username, password, {})
    if uid:
        print(f"SUCCESS! Authenticated with UID: {uid}")
        
        models = xmlrpc.client.ServerProxy('{}/xmlrpc/2/object'.format(url))
        print("Attempting to execute method...")
        result = models.execute_kw(db, uid, password, 'res.currency', 'search_read', [[]], {'limit': 5})
        print("SUCCESS! Data retrieved:")
        print(result)
    else:
        print("FAILED: Authentication returned False (Invalid DB, User, or API Key)")
except Exception as e:
    print(f"ERROR: {e}")

import xmlrpc.client

url = "https://jafiface-addis-crown-erp.hf.space"
try:
    db_proxy = xmlrpc.client.ServerProxy('{}/xmlrpc/2/db'.format(url))
    databases = db_proxy.list()
    print("Available databases:", databases)
except Exception as e:
    print(f"ERROR: {e}")

# ============================================================
# pgAdmin 4 — Local "Addis Crown" server registration
# ============================================================
#
# Two ways to connect pgAdmin to your LOCAL Postgres:
#
#   OPTION A (recommended, guaranteed): Register via the GUI
#   ----------------------------------
#   1. Open pgAdmin 4 desktop app.
#   2. In the left tree, right-click  "Servers"
#      ->  "Register"  ->  "Server..."
#   3. On the "General" tab set:
#        Name:  Local Addis Crown
#        (Group can stay as "Servers")
#   4. On the "Connection" tab set:
#        Host name/address:  127.0.0.1
#        Port:               5432
#        Maintenance DB:     addiscrown_local
#        Username:           ja
#        Password:           localdev
#        (tick "Save password?")
#   5. Click "Save". Expand  Servers -> Local Addis Crown
#      -> Databases -> addiscrown_local -> Schemas -> public
#      You'll see the 10 ERP tables ready to browse/query.
#
#   OPTION B (auto-provision via config_local.py)
#   ----------------------------------
#   pgAdmin desktop (snap) loads `config_local` as a plain
#   Python import. To use this file you must place it where
#   pgAdmin's Python can import it (e.g. copy this file to
#   the pgAdmin web dir or set PYTHONPATH before launch),
#   then fully restart pgAdmin. The GUI (Option A) is more
#   reliable for the desktop app, so use it unless you know
#   what you're doing.
#
# ============================================================

SERVERS = [
    {
        "name": "Local Addis Crown",
        "group": "Servers",
        "host": "127.0.0.1",
        "port": 5432,
        "maintenance_db": "addiscrown_local",
        "username": "ja",
        "password": "localdev",
        "save_password": True,
        "ssl_mode": "prefer",
        "comment": "Local Postgres 17 dev DB for Addis Crown ERP (avoids Neon free-tier limits)",
        "shared": False,
        "db_res": [],
    }
]

# If pgAdmin is launched from the project folder it may pick up
# a config_local.py placed at the repo root. Do NOT leave this in
# the repo root long-term — keep it in scripts/ (this file).

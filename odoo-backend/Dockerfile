FROM python:3.10-slim

# Install system dependencies required by Odoo
RUN apt-get update && apt-get install -y \
    python3-dev libpq-dev libldap2-dev libsasl2-dev libssl-dev build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy the Odoo backend files into the container
COPY . /app

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the mandatory Hugging Face port
EXPOSE 7860

# Start Odoo using environment variables and bind to port 7860
CMD ["sh", "-c", "./odoo-bin --db_host=$DB_HOST --db_port=5432 --db_user=$DB_USER --db_password=$DB_PASSWORD --database=$DB_NAME --xmlrpc-port=7860 --workers=0 --max-cron-threads=1 --without-demo=all"]

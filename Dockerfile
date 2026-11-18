FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends libmagic1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd -m app && mkdir -p /app/media_private && chown -R app /app/media_private
USER app
CMD ["sh", "-c", "python manage.py migrate && gunicorn config.wsgi:application -b 0.0.0.0:8000 --workers 3"]

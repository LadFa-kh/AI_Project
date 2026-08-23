# FastAPI resume-processing service (main.py). Reads COMET_API_KEY from the
# environment (see docker-compose.yml) instead of the hardcoded value that
# used to be in main.py — see the updated main.py delivered alongside this
# file for that change.
FROM python:3.12-slim
WORKDIR /app

# System deps some pdfplumber backends (pdfminer/Pillow) need for PDF/image
# handling — kept minimal, no compilers since these packages ship wheels.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg62-turbo \
    zlib1g \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

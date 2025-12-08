FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    OCR_UPLOAD_DIR=/app/uploads/ocr

WORKDIR /app

# 시스템 라이브러리 설치
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libgl1 \
        libglib2.0-0 \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# --------------------------------
# 파이썬 패키지 설치
# --------------------------------
COPY requirements.txt ./

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir paddlepaddle -i https://pypi.org/simple && \
    pip install --no-cache-dir paddleocr -i https://pypi.org/simple

# --------------------------------
# 앱 코드 복사
# --------------------------------
COPY app.py database.py ./
COPY api ./api
COPY core ./core

RUN mkdir -p /app/uploads/ocr

EXPOSE 8003

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8003"]

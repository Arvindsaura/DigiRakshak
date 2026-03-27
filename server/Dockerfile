FROM python:3.11-slim

WORKDIR /app

COPY server/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY server/ /app/server/
COPY ml/ /app/ml/

# Train model at container build time
RUN python ml/train_model.py

WORKDIR /app/server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

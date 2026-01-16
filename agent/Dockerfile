FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/
COPY pyproject.toml .

# Install the package
RUN pip install -e .

# Expose port
EXPOSE 8000

# Run the server
CMD ["uvicorn", "src.agent:app", "--host", "0.0.0.0", "--port", "8000"]

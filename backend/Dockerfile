# Backend Dockerfile (FastAPI)
# Use the official Python image from the DockerHub
FROM python:3.13

# Set the working directory inside the container
WORKDIR /backend

# Copy requirements.txt and install dependencies

COPY ./requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

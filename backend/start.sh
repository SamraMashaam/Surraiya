#!/bin/bash

cd /app/python-service
uvicorn main:app --host 0.0.0.0 --port 8000 &

cd /app
node index.js

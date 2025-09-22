#!/bin/bash

# Install Python dependencies
pip install -r server/requirements.txt

# Install Node.js dependencies
cd client
npm install
npm run build
cd ..

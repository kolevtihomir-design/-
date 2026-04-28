#!/bin/bash

# AI Trio Hub - Deployment & Sync Script
# Created for Tihomir Kolev

echo "🚀 Starting AI Trio Hub Sync..."

# 1. Clean and Update dependencies
echo "📦 Updating dependencies..."
npm install

# 2. Build the application
echo "🏗️ Building frontend artifacts..."
npm run build

# 3. Check for Git
if [ ! -d ".git" ]; then
  echo "🔧 Initializing Git repository..."
  git init
  git branch -M main
fi

# 4. Preparing for GitHub
echo "📝 Committing changes..."
git add .
git commit -m "Personal AI Assistant - Production Ready"

echo "✅ Everything is fixed and ready!"
echo "--------------------------------------------------"
echo "👉 To upload to your GitHub, run these commands:"
echo "git remote add origin https://github.com/kolevtihomir-design/personal-ai-assistant.git"
echo "git push -u origin main"
echo "--------------------------------------------------"

# Optional: Start local server for testing
# npm start

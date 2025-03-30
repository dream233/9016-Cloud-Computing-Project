#!/bin/bash

# Set variables
PROJECT_ID=$(gcloud config get-value project)
REGION=us-central1
REPO=social-app-repo
IMAGE=$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/social-app

echo "📦 Building Docker image..."
docker build -t $IMAGE .

echo "🚀 Pushing image to Artifact Registry..."
docker push $IMAGE

echo "🔐 Creating Kubernetes secrets..."
kubectl delete secret social-secrets --ignore-not-found
kubectl create secret generic social-secrets \
  --from-literal=MONGO_URI="your-atlas-uri" \
  --from-literal=SESSION_SECRET="your-production-secret"

echo "📁 Applying Kubernetes configs..."
kubectl apply -f k8s/prod/

echo "✅ Done! Check services with: kubectl get services"

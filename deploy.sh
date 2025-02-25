#!/bin/bash

# Construir as imagens
docker-compose build

# Fazer login no ECR (substitua ACCOUNT_ID e REGION)
aws ecr get-login-password --region REGION | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com

# Tag e push das imagens (substitua ACCOUNT_ID e REGION)
docker tag leva-backend:latest ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/leva-backend:latest
docker tag leva-frontend:latest ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/leva-frontend:latest

docker push ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/leva-backend:latest
docker push ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/leva-frontend:latest 
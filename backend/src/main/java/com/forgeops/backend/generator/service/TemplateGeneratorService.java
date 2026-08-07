package com.forgeops.backend.generator.service;

import com.forgeops.backend.assistant.service.GeminiAiService;
import com.forgeops.backend.common.exception.ResourceNotFoundException;
import com.forgeops.backend.generator.dto.GenerateTemplateRequest;
import com.forgeops.backend.generator.dto.TemplateResponse;
import com.forgeops.backend.generator.entity.GeneratedTemplate;
import com.forgeops.backend.generator.repository.TemplateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class TemplateGeneratorService {

    private static final Logger log = LoggerFactory.getLogger(TemplateGeneratorService.class);

    private final TemplateRepository templateRepository;
    private final GeminiAiService geminiAiService;

    public TemplateGeneratorService(TemplateRepository templateRepository, GeminiAiService geminiAiService) {
        this.templateRepository = templateRepository;
        this.geminiAiService = geminiAiService;
    }

    @Transactional
    public TemplateResponse generateTemplate(Long userId, GenerateTemplateRequest request) {
        String type = request.getTemplateType().toUpperCase(Locale.ROOT);
        String provider = request.getTargetProvider().toUpperCase(Locale.ROOT);
        String serviceName = request.getServiceName() != null ? request.getServiceName() : "forgeops-app";
        String env = request.getEnvironment() != null ? request.getEnvironment() : "production";

        String title = String.format("%s %s Configuration (%s)", provider, type, serviceName);
        String description = String.format("Production-grade %s template configured for %s environment.", type, env);
        String code;

        // Check if custom AI prompt is requested and Gemini is available
        if (request.getCustomPrompt() != null && !request.getCustomPrompt().isBlank() && geminiAiService.isConfigured()) {
            try {
                String aiPrompt = String.format(
                    "You are a Senior Principal DevOps Architect. Generate a production-ready, security-hardened %s configuration for:\n" +
                    "- Service Name: %s\n- Target Provider: %s\n- Environment: %s\n- Runtime: %s\n" +
                    "- Specific Requirements: %s\n\n" +
                    "Return ONLY the code configuration without introductory or conversational filler.",
                    type, serviceName, provider, env, request.getRuntime(), request.getCustomPrompt()
                );
                String aiCode = geminiAiService.generateDevOpsResponse(aiPrompt);
                if (aiCode != null && !aiCode.isBlank()) {
                    code = aiCode;
                } else {
                    code = buildStandardTemplate(type, provider, serviceName, env, request);
                }
            } catch (Exception e) {
                log.warn("[TemplateGenerator] AI generation fallback to built-in template: {}", e.getMessage());
                code = buildStandardTemplate(type, provider, serviceName, env, request);
            }
        } else {
            code = buildStandardTemplate(type, provider, serviceName, env, request);
        }

        GeneratedTemplate entity = new GeneratedTemplate(userId, type, provider, title, description, code);
        GeneratedTemplate saved = templateRepository.save(entity);
        return TemplateResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<TemplateResponse> getUserHistory(Long userId) {
        List<GeneratedTemplate> records = (userId != null)
                ? templateRepository.findByUserIdOrderByCreatedAtDesc(userId)
                : templateRepository.findAll();
        return records.stream().map(TemplateResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public TemplateResponse getTemplateById(UUID id) {
        return templateRepository.findById(id)
                .map(TemplateResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("GeneratedTemplate", "id", id));
    }

    private String buildStandardTemplate(String type, String provider, String serviceName, String env, GenerateTemplateRequest req) {
        return switch (type) {
            case "TERRAFORM" -> buildTerraformEksTemplate(serviceName, env);
            case "KUBERNETES" -> buildKubernetesManifest(serviceName, env, req);
            case "GITLAB_CI" -> buildGitLabCiPipeline(serviceName, req);
            case "GITHUB_ACTIONS" -> buildGitHubActionsPipeline(serviceName, req);
            case "DOCKERFILE" -> buildMultiStageDockerfile(req.getRuntime());
            case "HELM" -> buildHelmValuesYaml(serviceName, env);
            default -> buildTerraformEksTemplate(serviceName, env);
        };
    }

    private String buildTerraformEksTemplate(String serviceName, String env) {
        return String.format("""
# ==============================================================================
# ForgeOps AI — Production Terraform: AWS VPC & EKS Cluster
# Target: AWS / us-east-1 | Environment: %s
# ==============================================================================

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40.0"
    }
  }
  backend "s3" {
    bucket         = "forgeops-terraform-state-%s"
    key            = "eks/%s/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "forgeops-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Environment = "%s"
      ManagedBy   = "Terraform"
      Project     = "%s"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

# --- VPC & Subnets ---
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.5.1"

  name = "%s-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }
}

# --- EKS Cluster ---
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.2.0"

  cluster_name    = "%s-cluster"
  cluster_version = "1.29"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access = true

  eks_managed_node_groups = {
    system_nodes = {
      min_size     = 2
      max_size     = 5
      desired_size = 3

      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
    }
  }
}
""", env, env, serviceName, env, serviceName, serviceName, serviceName);
    }

    private String buildKubernetesManifest(String serviceName, String env, GenerateTemplateRequest req) {
        return String.format("""
# ==============================================================================
# ForgeOps AI — Production Kubernetes Deployment, Service, HPA & Ingress
# Service: %s | Environment: %s
# ==============================================================================
apiVersion: apps/v1
kind: Deployment
metadata:
  name: %s
  namespace: %s
  labels:
    app: %s
spec:
  replicas: 3
  selector:
    matchLabels:
      app: %s
  template:
    metadata:
      labels:
        app: %s
    spec:
      containers:
      - name: app
        image: registry.forgeops.ai/%s:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8080
          name: http
        resources:
          limits:
            cpu: "1000m"
            memory: "1024Mi"
          requests:
            cpu: "250m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 5
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "%s"
---
apiVersion: v1
kind: Service
metadata:
  name: %s-svc
  namespace: %s
spec:
  type: ClusterIP
  selector:
    app: %s
  ports:
  - port: 80
    targetPort: 8080
    name: http
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: %s-hpa
  namespace: %s
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: %s
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 75
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: %s-ingress
  namespace: %s
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - %s.forgeops.ai
    secretName: %s-tls-cert
  rules:
  - host: %s.forgeops.ai
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: %s-svc
            port:
              number: 80
""", serviceName, env, serviceName, env, serviceName, serviceName, serviceName,
     serviceName, env, serviceName, env, serviceName, serviceName, env,
     serviceName, serviceName, env, serviceName, serviceName, serviceName, serviceName);
    }

    private String buildGitLabCiPipeline(String serviceName, GenerateTemplateRequest req) {
        return String.format("""
# ==============================================================================
# ForgeOps AI — Production GitLab CI/CD Pipeline
# Service: %s
# ==============================================================================

stages:
  - test
  - build
  - security
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: ""
  IMAGE_TAG: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
  LATEST_TAG: $CI_REGISTRY_IMAGE:latest

# --- STAGE 1: Unit & Integration Tests ---
unit-tests:
  stage: test
  image: maven:3.9.6-eclipse-temurin-21-alpine
  cache:
    key: maven-$CI_COMMIT_REF_SLUG
    paths:
      - .m2/repository
  script:
    - mvn clean test -Dmaven.repo.local=.m2/repository
  artifacts:
    reports:
      junit: target/surefire-reports/*.xml

# --- STAGE 2: Container Image Build & Push ---
docker-build:
  stage: build
  image: docker:25.0-cli
  services:
    - docker:25.0-dind
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin $CI_REGISTRY
  script:
    - docker build --pull --cache-from $LATEST_TAG -t $IMAGE_TAG -t $LATEST_TAG .
    - docker push $IMAGE_TAG
    - docker push $LATEST_TAG
  only:
    - main
    - develop

# --- STAGE 3: Container Vulnerability Scan ---
container-security-scan:
  stage: security
  image:
    name: aquasec/trivy:latest
    entrypoint: [""]
  script:
    - trivy image --severity HIGH,CRITICAL --exit-code 0 $IMAGE_TAG
  allow_failure: true

# --- STAGE 4: Kubernetes Rollout Deployment ---
deploy-production:
  stage: deploy
  image: dtzar/helm-kubectl:latest
  environment:
    name: production
    url: https://%s.forgeops.ai
  script:
    - kubectl config set-cluster k8s --server="$KUBE_URL" --insecure-skip-tls-verify=true
    - kubectl config set-credentials admin --token="$KUBE_TOKEN"
    - kubectl config set-context default --cluster=k8s --user=admin
    - kubectl config use-context default
    - kubectl set image deployment/%s app=$IMAGE_TAG -n production
    - kubectl rollout status deployment/%s -n production --timeout=120s
  only:
    - main
""", serviceName, serviceName, serviceName, serviceName);
    }

    private String buildGitHubActionsPipeline(String serviceName, GenerateTemplateRequest req) {
        return String.format("""
# ==============================================================================
# ForgeOps AI — GitHub Actions CI/CD Workflow
# ==============================================================================
name: Production CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}/%s

jobs:
  test:
    name: Test & Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven
      - name: Run Unit Tests
        run: mvn -B clean test

  build-and-push:
    name: Build & Push Image
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - name: Set up Docker Buildx
        uses: actions/setup-buildx-action@v3
      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}, ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: Deploy to Kubernetes
    needs: build-and-push
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set Kubernetes Context
        uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBECONFIG }}
      - name: Rollout Deployment
        run: |
          kubectl set image deployment/%s app=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} -n production
          kubectl rollout status deployment/%s -n production --timeout=120s
""", serviceName, serviceName, serviceName);
    }

    private String buildMultiStageDockerfile(String runtime) {
        if ("node".equalsIgnoreCase(runtime) || "react".equalsIgnoreCase(runtime)) {
            return """
# ==============================================================================
# Production Multi-Stage Dockerfile (Node.js / React)
# ==============================================================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
""";
        }

        // Default Java 21 Temurin
        return """
# ==============================================================================
# Production Multi-Stage Dockerfile (Spring Boot / Java 21)
# ==============================================================================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring
COPY --from=builder --chown=spring:spring /app/target/*.jar app.jar
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-XX:InitialRAMPercentage=40.0", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
""";
    }

    private String buildHelmValuesYaml(String serviceName, String env) {
        return String.format("""
# ==============================================================================
# ForgeOps AI — Helm Chart values.yaml
# ==============================================================================
replicaCount: 3

image:
  repository: registry.forgeops.ai/%s
  pullPolicy: IfNotPresent
  tag: "latest"

service:
  type: ClusterIP
  port: 80
  targetPort: 8080

ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: %s.forgeops.ai
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: %s-tls
      hosts:
        - %s.forgeops.ai

resources:
  limits:
    cpu: 1000m
    memory: 1024Mi
  requests:
    cpu: 250m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 75
""", serviceName, serviceName, serviceName, serviceName);
    }
}

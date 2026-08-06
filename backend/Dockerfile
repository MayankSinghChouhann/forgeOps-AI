# ==========================================
# STAGE 1: Build Stage (Maven + JDK 21)
# ==========================================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Step 1: Copy only pom.xml to download & cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Step 2: Copy source code and build executable JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==========================================
# STAGE 2: Runtime Stage (Lightweight JRE 21)
# ==========================================
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

# Security Best Practice: Create non-root user & group
RUN addgroup -S spring && adduser -S spring -G spring

# Copy compiled jar from builder stage
COPY --from=builder --chown=spring:spring /app/target/*.jar app.jar

# Switch to non-root user
USER spring:spring

# Expose Spring Boot port
EXPOSE 8080

# Environment variables with sensible defaults
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Health Check against Actuator endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Execute Spring Boot Application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

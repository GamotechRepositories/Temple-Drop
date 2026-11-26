# Stage 1: Build React Frontend
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build Spring Boot Backend JAR
FROM maven:3.9.9-eclipse-temurin-17-alpine AS java-build
WORKDIR /app/backend-java
COPY backend-java/pom.xml ./
RUN mvn dependency:go-offline -B
COPY backend-java/src ./src
RUN mvn package -DskipTests -B

# Stage 3: Production Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app/backend-java
COPY --from=java-build /app/backend-java/target/temple-drop-backend-1.0.0.jar ./app.jar
COPY --from=client-build /app/client/dist /app/client/dist

ENV NODE_ENV=production
ENV SERVE_CLIENT_DIST=true
EXPOSE 5000

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]

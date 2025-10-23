# https://docs.deno.com/runtime/reference/docker/

FROM denoland/deno:latest

# Create working directory
WORKDIR /app

# Copy source
COPY . .

# Compile the main app
RUN deno cache ./src/main.ts

# Run the app
CMD ["deno", "task", "main"]

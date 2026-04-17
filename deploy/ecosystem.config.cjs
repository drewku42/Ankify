module.exports = {
  apps: [
    {
      name: "ankify-backend",
      cwd: "/home/ubuntu/Ankify/backend",
      script: "dist/index.js",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
    },
    {
      name: "ankify-ai",
      cwd: "/home/ubuntu/Ankify/ai-server",
      script: "start-ai.sh",
      interpreter: "bash",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "1G",
    },
  ],
};

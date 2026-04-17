// Set ANKIFY_ROOT on the server if the repo lives somewhere other than ~/Ankify.
const root = process.env.ANKIFY_ROOT || "/home/ubuntu/Ankify";

module.exports = {
  apps: [
    {
      name: "ankify-backend",
      cwd: `${root}/backend`,
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
      cwd: `${root}/ai-server`,
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

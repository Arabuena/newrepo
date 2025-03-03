module.exports = {
  apps: [{
    name: "barak-backend",
    script: "server.js",
    env_production: {
      NODE_ENV: "production",
      PORT: 5000,
      MONGODB_URI: "mongodb+srv://ara100limite:ERxkG9nXZjbwvpMk@cluster0.yzf2r.mongodb.net/bora?retryWrites=true&w=majority",
      JWT_SECRET: "bora_uber_clone_secret_2024",
      CORS_ORIGIN: "https://newrepo-woad-nine.vercel.app"
    },
    error_file: "logs/err.log",
    out_file: "logs/out.log",
    time: true,
    max_memory_restart: "300M",
    instances: 1,
    exec_mode: "fork",
    watch: false,
    max_restarts: 10,
    restart_delay: 4000,
    autorestart: true,
    merge_logs: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss Z"
  }]
} 
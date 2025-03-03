module.exports = {
  apps: [{
    name: "leva-backend",
    script: "server.js",
    env_production: {
      NODE_ENV: "production",
      PORT: 5000,
      MONGODB_URI: "mongodb+srv://ara100limite:ERxkG9nXZjbwvpMk@cluster0.yzf2r.mongodb.net/bora?retryWrites=true&w=majority",
      JWT_SECRET: "bora_uber_clone_secret_2024",
      CORS_ORIGIN: "https://newrepo-woad-nine.vercel.app"
    }
  }]
} 
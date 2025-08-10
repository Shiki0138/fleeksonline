module.exports = {
  apps: [{
    name: 'content-scheduler',
    script: 'scripts/content-scheduler.js',
    args: 'schedule',
    env: {
      NODE_ENV: 'production'
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 4000,
    // .env.localから環境変数を読み込む
    env_file: '.env.local'
  }]
}
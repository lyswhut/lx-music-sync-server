module.exports = {
  apps: [
    {
      name: 'lx-music-sync-server',
      script: './index.js',
      // node_args: '-r ts-node/register -r tsconfig-paths/register',
      // script: './bin/www',
      max_memory_restart: '1024M',
      stop_exit_codes: [0],
      exp_backoff_restart_delay: 100,
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'data'],
      env: {
        // PORT: 3100,
        NODE_ENV: 'development',
      },
      env_production: {
        // PORT: 3100, // 配置绑定的端口号，默认为 9527
        // BIND_IP: '0.0.0.0', // 配置绑定 IP 为`0.0.0.0` 将接受所有 IP 访问
        // CONFIG_PATH: '',
        // LOG_PATH: '',
        // DATA_PATH: '',
        NODE_ENV: 'production',
      },
    },
  ],
}

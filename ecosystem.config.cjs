module.exports = {
  apps: [
    {
      name: 'if26-bot',
      script: 'apps/bot/dist/index.js',
      cwd: '/var/www/IF26-TaskPanel',
      env: {
        NODE_ENV: 'production',
        DISCORD_BOT_TOKEN: 'MTUzMDM5NjMwODIzMzI0Mzc3W.GTFhcN.styfanR6FG0LFueATqm6GqqSZ9lWMynW0pS3Ik',
        DISCORD_CLIENT_ID: '1530396308232343713',
      },
    },
  ],
};

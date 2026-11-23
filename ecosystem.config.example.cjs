/**
 * Template konfigurasi PM2 untuk bot Discord di VPS.
 * Salin file ini menjadi `ecosystem.config.cjs` (diabaikan oleh .gitignore)
 * lalu isi variabel rahasia di file `.env` (chmod 600), bukan di-hardcode di Git.
 */
module.exports = {
  apps: [
    {
      name: "if26-bot",
      script: "apps/bot/dist/index.js",
      cwd: "/var/www/IF26-TaskPanel",
      env: {
        NODE_ENV: "production",
        // Seluruh token & DATABASE_URL otomatis dimuat oleh apps/bot/src/index.ts dari .env
      },
    },
  ],
};

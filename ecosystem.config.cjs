module.exports = {
  apps: [
    {
      name: "if26-bot",
      script: "apps/bot/dist/index.js",
      cwd: "/var/www/IF26-TaskPanel",
      env: {
        NODE_ENV: "production",
        DISCORD_BOT_TOKEN: "MTUzMDM5NjMwODIzMzI0Mzc3W.GTFhcN.styfanR6FG0LFueATqm6GqqSZ9lWMynW0pS3Ik",
        DISCORD_CLIENT_ID: "1530396308232343713",
        DISCORD_GUILD_ID: "1547427568599302287",
        DISCORD_ROLE_ADMIN: "1547427569031319565",
        DISCORD_ROLE_KETUA_ANGKATAN: "1547427569031319563",
        DISCORD_ROLE_PJ_KELAS: "1547427569031319562",
        DISCORD_ROLE_PJ_MATKUL: "1547427569018601622",
        DISCORD_ROLE_INFORMATIKA: "1547427569018601617",
        DISCORD_ROLE_SAINS_DATA: "1547427569018601615",
        DISCORD_ROLE_INFORMATIKA_PSDKU_KEBUMEN: "1547427569018601616",
        DISCORD_ROLE_KELAS_A: "1547427569018601613",
        DISCORD_ROLE_KELAS_B: "1547427569014415409",
        DISCORD_ROLE_KELAS_C: "1547427569014415408",
        DISCORD_ROLE_KELAS_D: "1547427569014415407",
        DATABASE_URL: "postgresql://postgres.ummznagnzlejdknwnasy:bismillahinformatika@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
        DIRECT_URL: "postgresql://postgres.ummznagnzlejdknwnasy:bismillahinformatika@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres",
      },
    },
  ],
};

// eslint-disable-next-line no-undef
module.exports = {
  apps: [
    {
      name: 'ecom-api',
      script: './dist/src/main.js',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
}

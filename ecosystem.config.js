module.exports = {
  apps: [
    {
      name: "finsafe-backend",
      cwd: "./backend",
      script: "npm",
      args: "run dev",
      env: {
        PORT: 3001,
      },
    },
    {
      name: "finsafe-frontend",
      cwd: "./frontend",
      script: "npm",
      args: "run dev",
      env: {
        PORT: 5173,
      },
    },
  ],
};


/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // lib/rules/load.ts reads /rules/*.yaml via readdirSync(process.cwd()) — a
  // dynamic directory read that output file tracing cannot follow. Without
  // this, the YAML files are missing from the serverless bundle on Vercel.
  outputFileTracingIncludes: {
    "/check/risultato": ["./rules/**/*"],
    "/api/leads": ["./rules/**/*"],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The ffmpeg-static binary (used by /api/referencias/transcribe to pull
  // audio out of uploaded reference videos) isn't detected by Next's
  // dependency tracing since it's invoked via a resolved path string, not
  // a static import — without this it's silently dropped from the
  // deployed function bundle and the binary is missing at runtime.
  outputFileTracingIncludes: {
    "/api/referencias/transcribe": ["./node_modules/ffmpeg-static/**/*"],
  },
};

export default nextConfig;

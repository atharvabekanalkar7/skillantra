import type { NextConfig } from "next";

// Intercept and suppress Node.js SourceMapWarnings from third-party packages
// (e.g., @supabase/auth-js ships invalid source maps that spam the dev console)
if (process.env.NODE_ENV === 'development') {
  const originalEmitWarning = process.emitWarning;
  process.emitWarning = function (warning: any, type?: any, code?: any, ctor?: any) {
    // Suppress specifically "SourceMapWarning" or anything about "Invalid source map"
    if (
      type === 'SourceMapWarning' ||
      (typeof warning === 'string' && warning.includes('SourceMap')) ||
      (warning && warning.name === 'SourceMapWarning') ||
      (warning && typeof warning.message === 'string' && warning.message.includes('Invalid source map'))
    ) {
      return;
    }
    return originalEmitWarning(warning, type, code, ctor);
  };
}

const nextConfig: NextConfig = {
  // Reduces noise for specific known packages in server environments
  serverExternalPackages: ['@supabase/auth-js', '@supabase/supabase-js'],

  // Explicitly tell Next 16 Turbopack we know about the Webpack fallback config
  turbopack: {},

  webpack: (config) => {
    // Suppress Webpack-level source map warnings just in case
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      /Failed to parse source map/,
      /Invalid source map/,
      /sourceMapURL could not be parsed/,
      { module: /node_modules\/@supabase\/auth-js/ }
    ];
    return config;
  },
};

export default nextConfig;

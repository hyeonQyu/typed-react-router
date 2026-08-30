import type { Config } from '@react-router/dev/config';

export default {
  // Pre-rendered rather than server-rendered: this example exists to show how the route
  // *tree* meets framework mode's build-time route config, and a server runtime would
  // add moving parts that say nothing about that.
  ssr: false,
} satisfies Config;

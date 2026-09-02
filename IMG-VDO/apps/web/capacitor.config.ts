import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.storybook.studio",
  appName: "Storybook Studio",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
};

export default config;



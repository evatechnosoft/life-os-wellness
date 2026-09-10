import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.evaitec.wellness',
  appName: 'Wellness',
  webDir: 'dist',
  android: {
    // Debug builds only; the app is sideloaded, never published to Play.
    allowMixedContent: true,
  },
}

export default config

export default {
  expo: {
    name: 'CASA',
    slug: 'CASA',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/iconApp.png',
    scheme: 'casa',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    extra: {
      eas: {
        projectId: "91097651-2960-4c08-a471-f8bce6cced99"
      }
    },
    android: {
      package: "com.duong2k4.casa",
      softwareKeyboardLayoutMode: "pan",
      adaptiveIcon: {
        backgroundColor: '#0F0A1F',
        foregroundImage: './assets/iconApp.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },

    web: {
      output: 'static',
      favicon: './assets/iconApp.png',
    },

    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-video',
      [
        'expo-notifications',
        {
          icon: './assets/iconApp.png',
          color: '#0F0A1F',
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
    ],

    experiments: {
      typedRoutes: true
    }
  },
};

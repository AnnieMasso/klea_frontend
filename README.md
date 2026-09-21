# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```


   Laravel must be reachable from the phone. On Windows, do not keep the backend bound only to `localhost`.

   Start Laravel like this from `Klea_Backend`:

   ```bash
   php artisan serve --host=0.0.0.0 --port=8000
   ```

   Then:

   - Put the phone and the PC on the same Wi-Fi.
   - Put your PC LAN IP in `EXPO_PUBLIC_API_URL`, for example `http://192.168.1.25:8000/api`.
   - Allow PHP/Laravel through Windows Firewall if prompted.
   - Restart Expo with cache reset: `npx expo start -c`.

   If login or register spins forever, the usual cause is one of these:

   - `EXPO_PUBLIC_API_URL` still points to `127.0.0.1` or `localhost`
   - Laravel is not started with `--host=0.0.0.0`
   - phone and PC are not on the same network
   - firewall blocks port `8000`

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# Welcome to PROJECT_NAME

## Getting started

1. Install dependencies

   ```bash
   npm install
   ```

3. In order to run Llama locally we had to add some native dependencies, so a development build will be needed in order to run the app.
Create an expo account, and an XCode account (we mostly focused on the iOS experience).

4. Make a native build and follow the followup instructions

   ```bash
    eas build --profile development --platform ios
   ```

5. Download the build to your phone

6. Start the app

   ```bash
    npx expo start
   ```


In the output, you'll find options to open the app in the following ways.

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)

For the best user experience, we recommend running it on a physical iPhone

We will aim to provide a TestFlight build to make it easier to access the app without going through the setup procedure if possible.
<img src="https://img.shields.io/badge/version-1.5.0b-blue" alt="Version 1.5.0b"/>

> Tornado in the US? Beep beep!

## Android Closed Testing Available!

We're currently running a closed test for our Android app. If you'd like to gain early access, please reach out to me on [Twitter](https://twitter.com/RubyNouille) for an invitation to the testing program.

**You can find the app online on [nadobeep.app](https://nadobeep.app) or soon in the Android Play Store (but please come join the test program, it's more open than you'd think).**

## What is this?

NadoBeep is a weather application that monitors and notifies users about severe weather events in the United States by checking the National Weather Service (NWS) API.
I originally built this app for personal use, but I decided to share it with the world. It is NOT a safety app.

**⚠️ SAFETY FIRST:** This is a hobby app, not your primary safety system! Always rely on official emergency channels during severe weather.

## Core Features

- 🔄 **Real-time Monitoring**: Checks NWS API every 30 seconds
- 🔔 **Notifications**: Alerts you when there severe weather events
- 🔊 **Tornado Alarm**: Distinctive sound when tornados are detected
- 🗺️ **Visual Tracking**: Map view of alert areas + radar

## Development

Clone this repository and run the following commands:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for web
npm run build

# Run linting
npm run lint

# Run on Android device/emulator
npm run android
```

This project is built with Expo (v52) and uses expo-router for navigation. It supports multiple platforms including web, iOS, and Android.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

I don't have any Apple devices, so I can't test iOS builds. If you can help with that, it would be greatly appreciated!

## Roadmap

- [X] Ability to toggle individual weather event notifications
- [X] Ability to toggle individual alarms
- [X] New logo
- [X] Radar map (reflectivity)
- [ ] Better handling of previous alerts on web
- [ ] Better sound handling on web
- [ ] iOS support
- [ ] Tablet support

## Platform Support

- 📱 Android via Expo
- 🌐 Web browsers

## License

MIT

## Legal Notice

NadoBeep is independently developed and not affiliated with or endorsed by any government agency.

## Socials

- [Twitter](https://twitter.com/RubyNouille)

---

<p align="center">
  Made with ♥ by some weather nerd
</p>

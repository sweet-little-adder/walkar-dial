# Walkar Dial

A [Stream Deck](https://www.elgato.com/stream-deck) plugin that reminds you to walk and stretch every 30 minutes. Drop it on a **Stream Deck + dial** to see an Apple Watch–style ring countdown on the LCD.

## Features

- 30-minute walk & stretch reminder (configurable)
- Ring countdown on the dial LCD — just the ring, with time in the center
- Customizable ring color
- **Press dial** → reset the timer to the full interval (default 30 minutes)

## Requirements

- Stream Deck app **7.1+**
- Stream Deck **+** (encoder dial)
- Node.js **24+**
- macOS 12+ or Windows 10+

## Development

```bash
npm install
npx streamdeck link com.orionwong.walkar-dial.sdPlugin
npx streamdeck dev
npm run watch
```

Drag **Walk & Stretch** from the **Walkar Dial** category onto a dial in the Stream Deck app.

## Build

```bash
npm run build
npx streamdeck validate com.orionwong.walkar-dial.sdPlugin
npx streamdeck pack com.orionwong.walkar-dial.sdPlugin
```

## License

MIT

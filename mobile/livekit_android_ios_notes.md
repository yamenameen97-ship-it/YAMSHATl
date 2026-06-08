# LiveKit Android / iOS quick notes

## Android
```kotlin
val room = LiveKit.connect("wss://yamshat-enqr8c2d.livekit.cloud", token)
```

## iOS
```swift
try await room.connect(url: "wss://yamshat-enqr8c2d.livekit.cloud", token: token)
```

## Web
```ts
import { connect } from "livekit-client";

const room = await connect("wss://yamshat-enqr8c2d.livekit.cloud", TOKEN);
```

## Cloud settings used in this project
- Project ID: `p_44oze9pbjvn`
- SIP URI: `sip:44oze9pbjvn.sip.livekit.cloud`
- WebSocket URL: `wss://yamshat-enqr8c2d.livekit.cloud`
- API Key / Secret: add them in backend/.env or Render dashboard before running live streaming.

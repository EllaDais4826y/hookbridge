# hookbridge

Lightweight webhook proxy that fans out incoming events to multiple endpoints with retry logic.

## Installation

```bash
npm install hookbridge
```

## Usage

```typescript
import { HookBridge } from 'hookbridge';

const bridge = new HookBridge({
  port: 3000,
  endpoints: [
    { url: 'https://service-a.example.com/webhook', retries: 3 },
    { url: 'https://service-b.example.com/webhook', retries: 5 },
    { url: 'https://service-c.example.com/events',  retries: 2 },
  ],
});

bridge.listen(() => {
  console.log('hookbridge is running on port 3000');
});
```

Send any POST request to `http://localhost:3000/incoming` and hookbridge will forward the payload to all configured endpoints concurrently. Failed deliveries are automatically retried with exponential backoff.

### Configuration Options

| Option | Type | Description |
|---|---|---|
| `port` | `number` | Port to listen on |
| `endpoints` | `Endpoint[]` | List of target URLs with retry settings |
| `secret` | `string` | Optional shared secret for HMAC signature verification |
| `timeout` | `number` | Request timeout in milliseconds (default: `5000`) |

### CLI

```bash
npx hookbridge --port 3000 --config hookbridge.config.json
```

## Contributing

Pull requests are welcome. Please open an issue first to discuss any significant changes.

## License

[MIT](LICENSE)
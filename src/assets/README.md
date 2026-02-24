# Assets Directory

## Event Images

Place your event cover images in this directory.

### Setup Instructions

1. Add your event images to this directory (e.g., `event-1.jpg`, `event-2.jpg`, `event-3.jpg`)
2. Update `src/utils/imageUtils.ts` to map event image keys to your local images:

```typescript
export const EVENT_IMAGES: Record<string, number | undefined> = {
  'event-1': require('./events/event-1.jpg'),
  'event-2': require('./events/event-2.jpg'),
  'event-3': require('./events/event-3.jpg'),
  // Add more mappings as needed
};
```

### For Production (Server URLs)

When images are served from the server, the `imageUrl` field in events will contain full URLs (e.g., `https://your-server.com/images/event-1.jpg`), and the system will automatically use those URLs instead of local images.

The `getEventImageSource` utility in `src/utils/imageUtils.ts` handles both local and remote images automatically.


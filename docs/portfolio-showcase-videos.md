# Homepage product videos

The homepage product showcase keeps each project's existing image as the poster and fallback. A finished video can be added without changing the component by setting these optional fields in the project's JSON record:

```json
{
  "showcaseVideo": {
    "url": "/videos/products/relay.mp4",
    "label": "Relay product demo"
  },
  "showcaseVideoCaptions": {
    "url": "/videos/products/relay.vtt",
    "label": "English captions"
  }
}
```

Place the final MP4 and WebVTT file under `public/videos/products/`. Keep the existing `showcaseImage` or `coverImage`; it is displayed while the video loads, when autoplay is unavailable, and if the video cannot be loaded.

Configured videos autoplay muted and inline, expose native playback controls, and advance to the next product when they finish. Visitors who request reduced motion keep the poster and manual navigation instead of automatic playback or advancement.

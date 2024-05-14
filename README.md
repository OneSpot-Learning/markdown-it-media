Plugin provides a special handling of video and audio and outputs them as
`<video>` and `<audio>` html elements respectively. Additional attributes are
also provided:

- **Media size**: `=WxH` (see [@mdit/img-size][@mdit/img-size]).
- **Multiple sources**: `![media/type](/path/to/alt-media.mp4)`.
- **Thumbnails**: `#=/path/to/poster.jpeg`.
- **Captions**: `[lang](/path/to/captions.lang.vtt)`.

This plugin uses the normal image syntax for all media types, and looks at the
extensions of the URL to determine whether to output `<img>`, `<audio>`, or
`<video>` elements. This is similar to
[markdown-it-html5-media][markdown-it-html5-media]. If the extension is missing
or unknown, we default to `<img>`.

## Installation

```bash
npm install @gotfeedback/markdown-it-media
```

## Usage

```js
import markdownIt from "markdown-it";
import markdownItMedia from "@gotfeedback/markdown-it-media";

// optional (with defaults)
const options = {
  controls: false,
  attrs: {
    image: {},
    audio: {},
    video: {},
  },
};

const md = markdownIt().use(markdownItMedia, options);
```

```js
md.render("![Small Image](image.jpeg =85x50)");
```

```html
<p>
  <img src="image.jpeg" alt="Small Image" width="85" height="50" />
</p>
```

```js
md.render("![Funny Clip](my-video.mp4)");
```

```html
<p>
  <video>
    <source src="my-video.mp4" />
    Funny Clip <a href="my-video.mp4">Download video</a>.
  </video>
</p>
```

## Options

### Controls

Enable controls with `controls` (default `false`).

```js
const md = markdownIt().use(markdownItMedia, { controls: true });

md.render("![](my-video.webm)");
```

```html
<p>
  <video controls>
    <source src="my-video.webm" />
    <a href="my-video.webm">Download video</a>.
  </video>
</p>
```

### Attrs

You can add arbitrary attributes to image, audio, or video using the `attrs`
option:

```js
const md = markdownIt().use(markdownItMedia, {
  attrs: {
    image: { lazy: "true" },
    video: { crossorigin: "anonymous", autoplay: "autoplay", muted: "muted" },
    audio: { crossorigin: "anonymous", preload: "metadata", controls: "true" },
  },
});

md.render(`
![](image.webp)
![](video.webm)
![](![audio/webm](audio.webm))
`);
```

```html
<p>
  <img src="image.webp" lazy="true" />

  <video crossorigin="anonymous" autoplay="autoplay" muted="muted">
    <source src="video.webm" />
    <a href="video.webm">Download video</a>.
  </video>

  <audio crossorigin="anonymous" preload="metadata" controls="true">
    <source src="audio.webm" type="audio/webm" />
    <a href="audio.webm">Download audio</a>.
  </audio>
</p>
```

## Media Size

Use the `=WxH` syntax to specify the width and height of the image, audio, or
video. Either the width or height can be omitted, but not the literal `x`
between them. In other words, you can specify only 800 px width with `=800x` or
only 600 px height with `=x600`.

The size attribute must come after the optional title.

```markdown
![](image.jpeg "Title" =800x600)
```

```html
<img src="image.jpeg" title="Title" width="800" height="600" />
```

```markdown
![](image.jpeg =800x)
```

```html
<img src="image.jpeg" width="800" />
```

```markdown
![](image.jpeg =x600)
```

```html
<img src="image.jpeg" height="600" />
```

## Multiple Sources / Explicit Media Type

For audio or video You can replace the source or add additional sources using
the `![media/type](/path/to/media.ext)` syntax in place or after the source.

Additional sources must come before the optional title.

```markdown
![Description](/video.webm ![video/mpeg](/path/to/alt-video.mp4) "optional title")
![Description](![video/webm](video.webm) ![video/mpeg](/path/to/alt-video.mp4) "optional title")
```

The using explicit media source can be handy if you are referencing a video or
audio wich doesn’t have a matching file extension.

```markdown
![Description](<![video/webm](/path/to/video)> "optional title")
![webm audio file](<![audio/webm](/path/to/audio.webm)%3E> "optional title")
```

**Note:** Additional sources or explicit media types are ignored for images.

## Thumbnails

Thumbnails (or poster) can be added to a video or audio using the
`#=/path/to/poster.jpeg` syntax.

The thumbnail attribute must come after the optional title.

```markdown
![](video.webm "Title" #=thumbnail.jpeg)
```

```html
<video poster="thumbnail.jpeg">
  <source src="image.jpeg" />
</video>
```

**Note:** If you add a thumbnail to an audio, it will result in a `<video>` element.

```markdown
![An audio with thumbnail](song.mp3 #=album-cover.jpeg)
```

```html
<video poster="album-cover.jpeg">
  <source src="song.mp3" />
  <!-- ... -->
</video>
```

## Captions

Captions can be added to audio or video using the `![lang](path/to/caption.vtt
"Captions Label")`. `[lang]` is a [language
tag](https://en.wikipedia.org/wiki/IETF_language_tag) e.g. `[zh]` for Chinese,
`[en-US]` for US English, or `[es-005]` for Latin American Spanish. The source
URL must be a [`.vtt`
file](https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API).

You can add multiple captions and the caption attribute must come after the
optional title:

```markdown
![](video.webm "Title" ![zh](chinese-captions.vtt) ![en](english-captions.vtt))
```

```html
<video title="Title">
  <source src="video.webm" />
  <track src="chinese-captions.vtt" srclang="zh" kind="captions" />
  <track src="english-captions.vtt" srclang="en" kind="captions" />
  <!-- ... -->
</video>
```

Captions can also be labelled:

```markdown
![](video.webm "Title" ![en](captions.vtt "Caption Label"))
```

```html
<video title="Title">
  <source src="video.webm" />
  <track
    src="captions.vtt"
    srclang="en"
    label="Caption Label"
    kind="captions"
  />
  <!-- ... -->
</video>
```

**Note:** If you add captions to an audio, it will result in a `<video>` element.

```markdown
![An audio with captions](song.mp3 [en](lyrics.vtt "Show Lyrics"))
```

```html
<video>
  <source src="song.mp3" />
  <track src="lyrics.vtt" srclang="en" label="Show Lyrics" />
  <!-- ... -->
</video>
```

## Examples

An Image with a width of 200 px and auto height:

```markdown
![Image description](/path/to/image.png "some title" =200x)
```

```html
<img alt="Image description" title="some title" width="200" />
```

An audio:

```markdown
![Audio description](/path/to/audio.mp3)
```

```html
<audio>
  <source src="/path/to/audio.mp3" />
  Audio description
  <a href="/path/to/audio.mp3">Download audio</a>.
</audio>
```

A video with a width of 800 px and height of 600 px:

```markdown
![Video description](/path/to/video.webm =800x600)
```

```html
<video width="800" height="600">
  <source src="/path/to/video.webm" />
  Video description
  <a href="/path/to/video">Download audio</a>.
</video>
```

A webm video with an alternative mp4 source:

```markdown
![video description](![video/webm](/movie.webm) ![video/mpeg](/movie.mp4))
```

```html
<video>
  <source src="/movie.webm" type="video/webm" />
  <source src="/movie.mp4" type="video/mpeg" />
  video
  <a href="/movie.webm">Download webm video</a>
  <a href="/movie.mp4">Download mpeg video</a>.
</video>
```

Video with a poster:

```markdown
![Video description](/path/to/video.webm #=/path/to/poster.jpeg)
```

```html
<video poster="/path/to/poster.jpeg">
  <source src="/path/to/video.webm" />
  Video description
</video>
```

Video with english and arabic subtitles:

```markdown
![Video description](/path/to/video.webm [en](/path/to/captions.en.vtt) [ar](/path/to/captions.ar.vtt))
```

```html
<video>
  <source src="/path/to/video.webm" />
  <track kind="captions" src="/path/to/captions.en.vtt" srclang="en" />
  <track kind="captions" src="/path/to/captions.ar.vtt" srclang="ar" />
  Video description
</video>
```

Video with thumbnail, a poster, and a webm backup source

```markdown
![Video with thumbnail, a poster, subtitles, and a webm backup source](
my-video.mp4
![video/webm](my-video.webm)
"optional title"
=800x600
#=thumbnail.jpeg
[en](captions.en.vtt "English")
[ar](captions.ar.vtt "Arabic")
)
```

```html
<video title="optional title" width="800" height="600" poster="thumbnail.jpeg">
  <source src="my-video.mp4" />
  <source src="my-video.webm" type="video/webm" />
  <track src="captions.en.vtt" srclang="en" label="English" kind="captions" />
  <track src="captions.ar.vtt" srclang="ar" label="Arabic" kind="captions" />
  Video with thumbnail, a poster, subtitles, and a webm backup source
  <a href="my-video.mp4">Download video</a>
  <a href="my-video.webm">Download webm video</a>.
</video>
```

Greatly inspired by [markdown-it-html5-media][markdown-it-html5-media]
and [@mdit/img-size][@mdit/img-size]

[markdown-it-html5-media]: https://github.com/eloquence/markdown-it-html5-media
[@mdit/img-size]: https://mdit-plugins.github.io/img-size.html

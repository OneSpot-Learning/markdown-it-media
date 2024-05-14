/**
 * @typedef {"audio" | "image" | "video" | null} MediaType
 * @typedef {{ src: string, type: string | null }} Source
min
 */

/** @type {Map<string, MediaType>} */
const EXTENSION_FILE_TYPE_MAP = new Map([
  ["bmp", "image"], // Bitmap Image
  ["gif", "image"], // Graphical Interchange Format
  ["jpg", "image"], // JPEG Image
  ["jpeg", "image"], // JPEG Image
  ["png", "image"], // Portable Network Graphic
  ["svg", "image"], // Scalable Vector Graphics File
  ["tif", "image"], // Tagged Image File
  ["tiff", "image"], // Tagged Image File Format
  ["webp", "image"], // WebP Image File

  ["avi", "video"], // Audio Video Interleave
  ["m4v", "video"], // iTunes Video File
  ["mkv", "video"], // Matroska Video File
  ["mov", "video"], // Apple QuickTime Movie
  ["mpg", "video"], // MPEG-4 Video File
  ["mp4", "video"], // MPEG-4 Video File
  ["ogv", "video"], // Ogg Container Format
  ["webm", "video"], // WebM Video
  ["wmv", "video"], // Windows Media Video

  ["aac", "audio"], // Advanced Audio Coding
  ["flac", "audio"], // Free Lossless Audio Codec
  ["m4a", "audio"], // MPEG-4 Audio
  ["mp3", "audio"], // MP3 Audio
  ["oga", "audio"], // Ogg Container Format
  ["ogg", "audio"], // Ogg Container Format
  ["wav", "audio"], // WAVE Audio
]);

/**
 * Guess the media type (video, audio, etc.) of an href. Inrered from
 * the extention of the pathname. For example
 * https://example.com/song.mp3?some=query will spot the .mp3 part and
 * infer this is an audio file.
 *
 * @param {Source[]} sources - The list of URLs and media types for this media.
 * @returns {MediaType} - The guessed mime-type prefix.
 */
export function getMediaType(sources) {
  // First check all the sources for a media type.
  for (const source of sources) {
    if (source.type) {
      const [type] = source.type.split("/");

      if (type && (type === "image" || type === "audio" || type === "video")) {
        return type;
      }
    }
  }

  // Next check all the sources for a matching extension.
  for (const { src } of sources) {
    const { pathname } = new URL(src, "http://unused.invalid");
    const extension = pathname.split(".").at(-1)?.toLowerCase() ?? "";
    const type = EXTENSION_FILE_TYPE_MAP.get(extension);

    if (type) {
      return type;
    }
  }

  return null;
}

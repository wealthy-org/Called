import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE = join(ROOT, "public", "called-logo-no-bg.png");
const VOID = "#0a0a0b";
const ICON_PADDING = 0.16;
const ICO_SIZES = [16, 32, 48] as const;

interface Written {
  path: string;
  bytes: number;
}

async function loadMark(): Promise<Buffer> {
  return sharp(SOURCE).trim({ threshold: 1 }).png().toBuffer();
}

async function tile(mark: Buffer, size: number, background: string | null): Promise<Buffer> {
  const inner = Math.round(size * (1 - ICON_PADDING * 2));
  const resized = await sharp(mark)
    .resize(inner, inner, { fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();

  const canvas = background === null ? { r: 0, g: 0, b: 0, alpha: 0 } : background;

  return sharp({
    create: { width: size, height: size, channels: 4, background: canvas },
  })
    .composite([{ input: resized, gravity: "center" }])
    .png()
    .toBuffer();
}

async function squareMark(mark: Buffer, size: number): Promise<Buffer> {
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      {
        input: await sharp(mark)
          .resize(size, size, { fit: "inside" })
          .png()
          .toBuffer(),
        gravity: "center",
      },
    ])
    .png()
    .toBuffer();
}

interface IcoImage {
  size: number;
  data: Buffer;
}

function buildIco(images: readonly IcoImage[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const directory = Buffer.alloc(16 * images.length);
  let offset = 6 + directory.length;

  images.forEach((image, index) => {
    const base = index * 16;
    directory.writeUInt8(image.size >= 256 ? 0 : image.size, base);
    directory.writeUInt8(image.size >= 256 ? 0 : image.size, base + 1);
    directory.writeUInt8(0, base + 2);
    directory.writeUInt8(0, base + 3);
    directory.writeUInt16LE(1, base + 4);
    directory.writeUInt16LE(32, base + 6);
    directory.writeUInt32LE(image.data.length, base + 8);
    directory.writeUInt32LE(offset, base + 12);
    offset += image.data.length;
  });

  return Buffer.concat([header, directory, ...images.map((image) => image.data)]);
}

async function main(): Promise<void> {
  const written: Written[] = [];

  async function emit(path: string, data: Buffer): Promise<void> {
    await mkdir(join(path, ".."), { recursive: true });
    await writeFile(path, data);
    written.push({ path: path.slice(ROOT.length + 1), bytes: data.length });
  }

  const mark = await loadMark();

  await emit(join(ROOT, "app", "icon.png"), await tile(mark, 512, null));
  await emit(join(ROOT, "app", "apple-icon.png"), await tile(mark, 180, VOID));
  await emit(
    join(ROOT, "public", "called-logo.png"),
    await sharp(mark).resize(512, 512, { fit: "inside" }).png().toBuffer(),
  );
  await emit(join(ROOT, "public", "called-mark.png"), await squareMark(mark, 512));

  const icoImages: IcoImage[] = [];
  for (const size of ICO_SIZES) {
    icoImages.push({ size, data: await tile(mark, size, null) });
  }
  await emit(join(ROOT, "app", "favicon.ico"), buildIco(icoImages));

  for (const entry of written) {
    console.log(`  ${entry.path}  ${entry.bytes} bytes`);
  }
  console.log(`icons generated from ${SOURCE}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

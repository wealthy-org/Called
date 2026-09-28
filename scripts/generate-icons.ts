import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { DISPLAY_SYMBOL_CONFIG, MICRO_SYMBOL_CONFIG, iconConfigFor } from "../lib/brand/geometry";
import { lockupSvg, symbolSvg } from "../lib/brand/svg";

const ROOT = process.cwd();
const ICO_SIZES = [16, 32, 48] as const;
const FAVICON_APPLE_SIZE = 180;
const FAVICON_SIZE = 512;

interface Written {
  path: string;
  bytes: number;
}

const written: Written[] = [];

async function emit(path: string, data: Buffer): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, data);
  written.push({ path: path.slice(ROOT.length + 1), bytes: data.length });
}

async function rasterise(svg: string, width: number, height: number): Promise<Buffer> {
  return sharp(Buffer.from(svg), { density: 384 })
    .resize(width, height, { fit: "contain" })
    .png()
    .toBuffer();
}

const sealSymbol = (size: number) =>
  symbolSvg({ color: "seal", sealColor: "seal", config: iconConfigFor(size), size });

const signatureSymbol = (size: number) =>
  symbolSvg({ color: "bone", sealColor: "seal", config: DISPLAY_SYMBOL_CONFIG, size });

function buildIco(images: readonly { size: number; data: Buffer }[]): Buffer {
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
  await emit(
    join(ROOT, "app", "icon.png"),
    await rasterise(sealSymbol(FAVICON_SIZE), FAVICON_SIZE, FAVICON_SIZE),
  );
  await emit(
    join(ROOT, "app", "apple-icon.png"),
    await rasterise(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none"><rect width="64" height="64" fill="#0a0a0b"/>${signatureSymbol(
        64,
      )
        .replace(/^<svg[^>]*>/, "")
        .replace(/<\/svg>\s*$/, "")}</svg>`,
      FAVICON_APPLE_SIZE,
      FAVICON_APPLE_SIZE,
    ),
  );

  const logo = lockupSvg({ kind: "horizontal", color: "bone", sealColor: "seal" });
  await emit(join(ROOT, "public", "called-logo.png"), await rasterise(logo, 512, 113));
  await emit(join(ROOT, "public", "called-mark.png"), await rasterise(signatureSymbol(512), 512, 512));

  const icoImages = await Promise.all(
    ICO_SIZES.map(async (size) => ({ size, data: await rasterise(sealSymbol(size), size, size) })),
  );
  await emit(join(ROOT, "app", "favicon.ico"), buildIco(icoImages));

  for (const entry of written) {
    console.log(`  ${entry.path}  ${entry.bytes} bytes`);
  }
  console.log(
    `icons generated: favicon + icon are the seal colourway on transparency, apple-icon is opaque void, micro stroke ${MICRO_SYMBOL_CONFIG.strokeWidth}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

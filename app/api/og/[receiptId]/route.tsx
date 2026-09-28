import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { desc, eq } from "drizzle-orm";
import { ImageResponse } from "next/og";
import { db } from "@/db";
import { anchors, questions, receipts, sealReveals, seals } from "@/db/schema";
import { indexIsAnchored, type AnchorRecord } from "@/lib/anchor-status";
import { shareHeadline, shareProvenWord, shareVerificationUrl } from "@/lib/share";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WIDTH = 1200;
const HEIGHT = 630;
const MAX_QUESTION_LENGTH = 150;
const BACKGROUND = "#0a0a0b";
const LINE = "#26262b";
const BONE = "#ece9e4";
const MUTE = "#a19d95";
const SEAL = "#ff5a36";

const fontCache = new Map<string, Buffer>();

async function loadFont(file: string): Promise<Buffer> {
  const cached = fontCache.get(file);
  if (cached !== undefined) {
    return cached;
  }
  const data = await readFile(join(process.cwd(), "assets", "fonts", file));
  fontCache.set(file, data);
  return data;
}

let logoCache: string | null = null;

async function loadLogo(): Promise<string> {
  if (logoCache !== null) {
    return logoCache;
  }
  const data = await readFile(
    join(process.cwd(), "public", "called-mark.png"),
  );
  logoCache = `data:image/png;base64,${data.toString("base64")}`;
  return logoCache;
}

function clampText(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) {
    return normalized;
  }
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function parseProbability(payloadJson: string): number | null {
  try {
    const parsed: unknown = JSON.parse(payloadJson);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    const value = (parsed as Record<string, unknown>).p;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return null;
    }
    if (value < 0 || value > 1) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

interface CardData {
  probability: number | null;
  questionText: string;
  sealedAt: Date;
  outcome: "YES" | "NO" | "VOID" | null;
  anchorStatus: "sealed" | "pending anchor" | "anchored";
}

async function loadCardData(receiptId: string): Promise<CardData | null> {
  const [row] = await db
    .select({
      sealedAt: seals.sealedAt,
      recordIndex: seals.recordIndex,
      questionText: questions.text,
      questionStatus: questions.status,
      outcome: questions.outcome,
      payloadJson: sealReveals.payloadJson,
    })
    .from(receipts)
    .innerJoin(seals, eq(seals.id, receipts.sealId))
    .innerJoin(questions, eq(questions.id, seals.questionId))
    .leftJoin(sealReveals, eq(sealReveals.sealId, seals.id))
    .where(eq(receipts.id, receiptId))
    .limit(1);

  if (row === undefined) {
    return null;
  }

  const anchorRows = await db
    .select({
      headHash: anchors.headHash,
      recordCount: anchors.recordCount,
      txHash: anchors.txHash,
      blockNumber: anchors.blockNumber,
      blockTime: anchors.blockTime,
    })
    .from(anchors)
    .orderBy(desc(anchors.recordCount));

  const anchorRecords: AnchorRecord[] = anchorRows;
  const anchorStatus = indexIsAnchored(row.recordIndex, anchorRecords)
    ? "anchored"
    : "pending anchor";

  const outcome =
    row.questionStatus === "void"
      ? "VOID"
      : row.outcome === null
        ? null
        : row.outcome
          ? "YES"
          : "NO";

  return {
    probability:
      row.payloadJson === null ? null : parseProbability(row.payloadJson),
    questionText: row.questionText,
    sealedAt: row.sealedAt,
    outcome,
    anchorStatus,
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ receiptId: string }> },
): Promise<Response> {
  const { receiptId } = await context.params;
  const data = await loadCardData(receiptId);

  if (data === null) {
    return new Response("receipt not found", { status: 404 });
  }

  const [doto, monoRegular, monoMedium, logo] = await Promise.all([
    loadFont("Doto-900.ttf"),
    loadFont("IBMPlexMono-400.ttf"),
    loadFont("IBMPlexMono-500.ttf"),
    loadLogo(),
  ]);

  const origin = new URL(request.url).origin;
  const headline = shareHeadline({
    probability: data.probability,
    sealedAt: data.sealedAt,
    outcome: data.outcome,
  });
  const verification = shareVerificationUrl(origin, receiptId);
  const proven = shareProvenWord(data.anchorStatus);
  const question = clampText(data.questionText, MAX_QUESTION_LENGTH);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: BACKGROUND,
          padding: "64px 72px",
          fontFamily: "IBM Plex Mono",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "Doto",
            fontSize: 44,
            color: BONE,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse (Satori) cannot render next/image */}
            <img src={logo} alt="" width={56} height={56} />
            <div style={{ display: "flex" }}>Called</div>
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "IBM Plex Mono",
              fontSize: 22,
              color: SEAL,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {data.anchorStatus} · {proven}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div
            style={{
              display: "flex",
              fontSize: 52,
              lineHeight: 1.15,
              color: BONE,
              maxWidth: 980,
            }}
          >
            {headline}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: MUTE,
              maxWidth: 980,
            }}
          >
            {question}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            borderTop: `1px solid ${LINE}`,
            paddingTop: 22,
          }}
        >
          <div style={{ display: "flex", fontSize: 20, color: MUTE }}>
            Verify it yourself:
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontFamily: "IBM Plex Mono",
              fontWeight: 500,
              color: BONE,
            }}
          >
            {verification}
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: "Doto", data: doto, weight: 900, style: "normal" },
        { name: "IBM Plex Mono", data: monoRegular, weight: 400, style: "normal" },
        { name: "IBM Plex Mono", data: monoMedium, weight: 500, style: "normal" },
      ],
    },
  );
}

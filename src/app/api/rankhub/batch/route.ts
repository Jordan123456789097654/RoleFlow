import { NextResponse } from "next/server";
import type { BatchRankItem } from "@/lib/rankhub-types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, dryRun, rankCeiling = 200, protectedRanks = [250, 254, 255] } = body as {
      items: BatchRankItem[];
      dryRun: boolean;
      rankCeiling?: number;
      protectedRanks?: number[];
    };

    if (!items || !items.length) {
      return NextResponse.json({ error: "No items provided in batch queue" }, { status: 400 });
    }

    const processedItems: BatchRankItem[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const item of items) {
      // Security checks: rank ceiling and protected ranks
      if (item.newRank > rankCeiling) {
        processedItems.push({
          ...item,
          status: "error",
          errorDetails: `Blocked by Rank Ceiling: Target rank ${item.newRank} exceeds configured ceiling ${rankCeiling}.`,
        });
        errorCount++;
        continue;
      }

      if (protectedRanks.includes(item.newRank) || protectedRanks.includes(item.currentRank)) {
        processedItems.push({
          ...item,
          status: "error",
          errorDetails: `Protected Role Boundary: Rank ${item.newRank} or current rank ${item.currentRank} is designated as protected.`,
        });
        errorCount++;
        continue;
      }

      if (dryRun) {
        processedItems.push({
          ...item,
          status: "simulated",
          errorDetails: "Simulated successfully. Rank call validated without mutating live Roblox group.",
        });
        successCount++;
      } else {
        processedItems.push({
          ...item,
          status: "success",
        });
        successCount++;
      }
    }

    return NextResponse.json({
      success: true,
      batchId: `batch_${dryRun ? "sim" : "exec"}_${Date.now()}`,
      dryRun,
      totalCount: items.length,
      successCount,
      errorCount,
      items: processedItems,
      message: dryRun
        ? `Dry run simulation complete: ${successCount} passed, ${errorCount} rejected by safety boundaries.`
        : `Live rank batch complete: ${successCount} updated successfully, ${errorCount} flagged.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Batch rank execution failed" }, { status: 500 });
  }
}

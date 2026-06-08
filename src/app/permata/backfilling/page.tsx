'use client';
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { backfillEmbeddings } from "../lib/transactions-service";

export default function BackfillingPage() {
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<{ success: boolean; processed?: number; failed?: number; error?: string } | null>(null);


  const handleBackfill = async () => {
    setIsBackfilling(true);
    try {
      const result = await backfillEmbeddings();
      setBackfillResult(result);
      if (result.success) {
        toast.success(`Embeddings regenerated: ${result.processed} processed, ${result.failed} failed`);
      } else {
        toast.error('Backfill failed: ' + result.error);
      }
    } catch (error) {
      console.error('Backfill error:', error);
      toast.error('Failed to regenerate embeddings');
    } finally {
      setIsBackfilling(false);
    }
  };


  return (
    <main>
      {backfillResult && (
        <div className="flex flex-col gap-4">
          <h2>Backfill Result</h2>
          <p>Success: {backfillResult.success ? 'Yes' : 'No'}</p>
          <p>Processed: {backfillResult.processed}</p>
          <p>Failed: {backfillResult.failed}</p>
          <p>Error: {backfillResult.error}</p>
        </div>
      )}
      <div className="flex flex-col gap-4">
        <h1>Backfilling</h1>
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            If some transactions are missing categories, regenerate embeddings to backfill missing
            entries.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackfill}
            disabled={isBackfilling}
            className="self-start"
          >
            {isBackfilling ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Regenerating...
              </span>
            ) : (
              'Regenerate Embeddings'
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}
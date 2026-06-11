import { handleGetMissingEmbeddings } from '@/app/transactions/backfilling/actions';
import { BackfillingTable } from '@/app/transactions/backfilling/components/backfilling-table';


export default async function BackfillingPage() {

  const missingEmbeddings = await handleGetMissingEmbeddings();

  return (
    <main className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Backfilling</h1>
        <p className="text-sm text-muted-foreground">
          Missing transaction embeddings are loaded from the current database state.
        </p>
      </div>

      {missingEmbeddings.success ? (
        <BackfillingTable items={missingEmbeddings.data} />
      ) : (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          {missingEmbeddings.error ?? 'Failed to load missing embeddings.'}
        </div>
      )}
    </main>
  );
}

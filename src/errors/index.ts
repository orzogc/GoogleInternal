export class PartialBatchError extends Error {
  constructor(
    public results: any[],
    public errors: Record<number, Error>
  ) {
    super(`Batch execution completed with ${Object.keys(errors).length} errors.`);
    this.name = 'PartialBatchError';
  }
}

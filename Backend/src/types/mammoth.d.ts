// mammoth ships no type declarations; this covers only what we use.
declare module "mammoth" {
  interface ExtractRawTextResult {
    value: string;
    messages: unknown[];
  }

  export function extractRawText(input: {
    buffer: Buffer;
  }): Promise<ExtractRawTextResult>;
}

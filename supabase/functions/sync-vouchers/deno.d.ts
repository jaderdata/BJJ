// Type declarations for Deno runtime in Edge Functions
declare namespace Deno {
    export const env: {
        get(key: string): string | undefined;
    };

    export function serve(
        handler: (request: Request) => Response | Promise<Response>
    ): void;
}

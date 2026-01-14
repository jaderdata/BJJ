// Type declarations for google-auth-library
declare module "npm:google-auth-library@^9.0.0" {
    export class JWT {
        constructor(options: {
            email: string;
            key: string;
            scopes: string[];
        });
        authorize(): Promise<{ access_token: string | null | undefined }>;
    }
}

declare module "google-auth-library" {
    export class JWT {
        constructor(options: {
            email: string;
            key: string;
            scopes: string[];
        });
        authorize(): Promise<{ access_token: string | null | undefined }>;
    }
}

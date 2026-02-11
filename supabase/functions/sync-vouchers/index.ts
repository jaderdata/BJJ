/// <reference path="./deno.d.ts" />
/// <reference path="./google-auth.d.ts" />
import { JWT } from "google-auth-library";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { events } = await req.json();

        if (!events || typeof events !== 'object') {
            throw new Error('Invalid data: events object is required');
        }

        const envCreds = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
        if (!envCreds) {
            throw new Error('Configuração faltante: O segredo GOOGLE_SERVICE_ACCOUNT não foi encontrado no Supabase.');
        }

        const serviceAccount = JSON.parse(envCreds);
        const auth = new JWT({
            email: serviceAccount.client_email,
            key: serviceAccount.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const token = await auth.authorize();
        const accessToken = token.access_token;

        const spreadsheetId = '1gQRwAE2UELgPLiz24HZptmzJq3mRjhs9hxIGss-_wuk';
        const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;

        // 1. Get spreadsheet metadata
        const metaResponse = await fetch(baseUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const metaData = await metaResponse.json();
        if (!metaResponse.ok) throw new Error('Erro ao acessar planilha.');

        const eventNames = Object.keys(events);
        let sheets = metaData.sheets;

        // 2. Create missing sheets and prepare batch requests
        const createRequests = [];
        const existingTitles = sheets.map((s: any) => s.properties.title);

        for (const name of eventNames) {
            if (!existingTitles.includes(name)) {
                createRequests.push({ addSheet: { properties: { title: name } } });
            }
        }

        if (createRequests.length > 0) {
            const resp = await fetch(`${baseUrl}:batchUpdate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ requests: createRequests })
            });
            const data = await resp.json();
            // Update our local sheets list with newly created ones
            const refreshedMeta = await fetch(baseUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } }).then(r => r.json());
            sheets = refreshedMeta.sheets;
        }

        // 3. Prepare Batch Data & Formatting Requests
        const formattingRequests: any[] = [];
        const valueData: any[] = [];

        for (const eventName of eventNames) {
            const vouchers = events[eventName];
            const sheet = sheets.find((s: any) => s.properties.title === eventName);
            const sheetId = sheet.properties.sheetId;

            const values = [
                ['Código', 'Data', 'Academia', 'Vendedor', 'RETIRADO'],
                ...vouchers.map((v: any) => [v.codigo, v.data, v.academia, v.vendedor, v.retirado])
            ];

            valueData.push({
                range: `${eventName}!A1`,
                values: values
            });

            // CLEANUP: Remove old conditional formatting for this sheet to avoid duplicates
            // (Simplified: We just overwrite rules or clear them. Clearning is better.)
            // Actually, we'll just send 'setDataValidation' and 'addConditionalFormatRule'.

            // A. Data Validation (YES/NO Dropdown for Column E)
            formattingRequests.push({
                setDataValidation: {
                    range: {
                        sheetId: sheetId,
                        startRowIndex: 1, // Skip header
                        startColumnIndex: 4,
                        endColumnIndex: 5
                    },
                    rule: {
                        condition: {
                            type: 'ONE_OF_LIST',
                            values: [{ userEnteredValue: 'YES' }, { userEnteredValue: 'NO' }]
                        },
                        showCustomUi: true,
                        strict: true
                    }
                }
            });

            // B. Conditional Formatting Rules
            // Rule 1: NO -> Green (#E8F5E9)
            // Rule 2: YES -> Red (#FFEBEE) or stronger red? User said "tom de verde bem claro" and "vermelha".
            // Let's use light green for NO and a clear red for YES.

            formattingRequests.push({
                addConditionalFormatRule: {
                    rule: {
                        ranges: [{ sheetId, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: 5 }],
                        booleanRule: {
                            condition: {
                                type: 'TEXT_EQ',
                                values: [{ userEnteredValue: 'NO' }]
                            },
                            format: { backgroundColor: { red: 0.91, green: 0.96, blue: 0.91 } } // Light Green
                        }
                    },
                    index: 0
                }
            });

            formattingRequests.push({
                addConditionalFormatRule: {
                    rule: {
                        ranges: [{ sheetId, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: 5 }],
                        booleanRule: {
                            condition: {
                                type: 'TEXT_EQ',
                                values: [{ userEnteredValue: 'YES' }]
                            },
                            format: { backgroundColor: { red: 1.0, green: 0.8, blue: 0.8 } } // Reddish
                        }
                    },
                    index: 1
                }
            });
        }

        // 4. Update Values
        const valResp = await fetch(`${baseUrl}/values:batchUpdate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ valueInputOption: 'RAW', data: valueData })
        });
        if (!valResp.ok) throw new Error('Erro ao atualizar valores.');

        // 5. Apply Formatting & Validation
        // Note: We should probably clear existing rules before adding new ones to prevent stacking.
        const finalBatchUpdate = await fetch(`${baseUrl}:batchUpdate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    // Clear rules first for each sheet
                    ...eventNames.map(name => ({
                        updateCells: {
                            range: { sheetId: sheets.find((s: any) => s.properties.title === name).properties.sheetId, startRowIndex: 1 },
                            fields: "userEnteredFormat.backgroundColor"
                        }
                    })),
                    ...formattingRequests
                ]
            })
        });

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Sync Error:', error);
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});

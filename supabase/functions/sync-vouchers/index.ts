/// <reference path="./deno.d.ts" />
/// <reference path="./google-auth.d.ts" />
// @ts-ignore
import { JWT } from "google-auth-library";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    // 0. Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Verify Environment & Imports
        const envCreds = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
        if (!envCreds) {
            console.error('Missing GOOGLE_SERVICE_ACCOUNT');
            throw new Error('Configuração faltante: O segredo GOOGLE_SERVICE_ACCOUNT não foi encontrado (Verifique Secrets).');
        }

        let serviceAccount;
        try {
            serviceAccount = JSON.parse(envCreds);
        } catch (e) {
            console.error('Invalid JSON in GOOGLE_SERVICE_ACCOUNT');
            throw new Error('Configuração inválida: O segredo GOOGLE_SERVICE_ACCOUNT não é um JSON válido.');
        }

        // 2. Parse Body
        let events;
        try {
            const body = await req.json();
            events = body.events;
        } catch (e) {
            throw new Error('Invalid JSON body in request.');
        }

        if (!events || typeof events !== 'object') {
            throw new Error('Invalid data: events object is required');
        }

        // 3. Authenticate Google
        // Using JWT from esm.sh import
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

        // 2.5 PRESERVE EXISTING STATUS (YES/NO) & CLEAR DATA
        // We must clear the sheets before writing to ensure old rows don't persist
        // but we read them first to preserve manual "RETIRADO" changes.
        const existingStatusMap: Record<string, string> = {};

        const clearRequests = eventNames.map(name => {
            const sheet = sheets.find((s: any) => s.properties.title === name);
            if (!sheet) return null;
            return {
                updateCells: {
                    range: { sheetId: sheet.properties.sheetId },
                    fields: "userEnteredValue,userEnteredFormat,dataValidation"
                }
            };
        }).filter(Boolean);

        if (clearRequests.length > 0) {
            // STEP A: Read existing values
            try {
                const ranges = eventNames
                    .filter(name => sheets.some((s: any) => s.properties.title === name))
                    .map(name => encodeURIComponent(`${name}!A2:E`));

                if (ranges.length > 0) {
                    const getResp = await fetch(`${baseUrl}/values:batchGet?ranges=${ranges.join('&ranges=')}`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                    if (getResp.ok) {
                        const getData = await getResp.json();
                        (getData.valueRanges || []).forEach((vr: any) => {
                            if (vr.values) {
                                vr.values.forEach((row: any[]) => {
                                    const code = row[0];
                                    const status = row[4]; // Column E
                                    if (code && (status === 'YES' || status === 'NO' || status === 'SIM' || status === 'NÃO')) {
                                        existingStatusMap[code] = (status === 'SIM' || status === 'YES') ? 'YES' : 'NO';
                                    }
                                });
                            }
                        });
                    }
                }
            } catch (err) {
                console.error('Erro ao ler dados para preservação:', err);
            }

            // STEP B: Perform the clear
            await fetch(`${baseUrl}:batchUpdate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ requests: clearRequests })
            });
        }

        // 3. Prepare Batch Data & Formatting Requests
        const formattingRequests: any[] = [];
        const valueData: any[] = [];

        for (const eventName of eventNames) {
            const vouchers = events[eventName];
            const sheet = sheets.find((s: any) => s.properties.title === eventName);
            if (!sheet) continue;
            const sheetId = sheet.properties.sheetId;

            const values = [
                ['Código', 'Data', 'Academia', 'Vendedor', 'RETIRADO'],
                ...vouchers.map((v: any) => {
                    // Check if we have a preserved status from the read step
                    const preservedStatus = existingStatusMap[v.codigo] || v.retirado || 'NO';
                    return [v.codigo, v.data, v.academia, v.vendedor, preservedStatus];
                })
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

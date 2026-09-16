import { google } from "googleapis";

const SHEETS_READONLY_SCOPE =
  "https://www.googleapis.com/auth/spreadsheets.readonly";

const REQUIRED_CREDENTIAL_KEYS = [
  "GAPI_CREDENTIALS_CLIENT_ID",
  "GAPI_CREDENTIALS_CLIENT_SECRET",
  "GAPI_CREDENTIALS_REFRESH_TOKEN",
] as const;

export type SheetValuesRequest = {
  spreadsheetId: string;
  range: string;
};

export type SheetMeta = {
  title: string;
  gid: string;
};

export function hasGoogleSheetsCredentials(): boolean {
  return REQUIRED_CREDENTIAL_KEYS.every((key) => Boolean(process.env[key]));
}

export function toSheetRange(sheetTitle: string, cells: string): string {
  const escapedTitle = sheetTitle.replaceAll("'", "''");
  return `'${escapedTitle}'!${cells}`;
}

async function getAuthedSheets() {
  const auth = await google.auth.getClient({
    projectId: process.env.PROJECT_ID ?? process.env.GAPI_PROJECT_ID,
    credentials: {
      type: "authorized_user",
      private_key: process.env.GAPI_CREDENTIALS_PRIVATE_KEY,
      client_secret: process.env.GAPI_CREDENTIALS_CLIENT_SECRET,
      refresh_token: process.env.GAPI_CREDENTIALS_REFRESH_TOKEN,
      client_email: process.env.GAPI_CREDENTIALS_CLIENT_EMAIL,
      client_id: process.env.GAPI_CREDENTIALS_CLIENT_ID,
      token_url: "https://oauth2.googleapis.com/token",
      universe_domain: "googleapis.com",
    },
    scopes: [SHEETS_READONLY_SCOPE],
  });

  return google.sheets({ version: "v4", auth });
}

export async function getFirstSheetMeta(
  spreadsheetId: string,
): Promise<SheetMeta> {
  const sheets = await getAuthedSheets();
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties(sheetId,title)",
  });
  const firstSheet = response.data.sheets?.[0]?.properties;
  const title = firstSheet?.title?.trim();
  if (!title) {
    throw new Error(`No first sheet found in spreadsheet ${spreadsheetId}`);
  }

  return {
    title,
    gid: String(firstSheet.sheetId ?? 0),
  };
}

export async function getSheetValues({
  spreadsheetId,
  range,
}: SheetValuesRequest): Promise<unknown[][]> {
  const sheets = await getAuthedSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values ?? [];
}

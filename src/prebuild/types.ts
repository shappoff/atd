export type RawCell = string | number | boolean | null | undefined;

export type RawRow = RawCell[];

export type PlaceItem = {
  title: string;
  type: string;
  lat: number | null;
  lng: number | null;
  kostel: string;
  owner: string;
  link: string;
  eparchy: Record<string, string>;
  atd: Record<string, string>;
  row: number;
  spreadsheetId: string;
  gid: string;
};

export type SpreadsheetSource = {
  spreadsheetId: string;
  gid: string;
};

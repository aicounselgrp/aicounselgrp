import { readFileSync } from "node:fs";
import postgres from "postgres";

const [, , urlFile, sqlFile] = process.argv;
const url = readFileSync(urlFile, "utf8").trim();
const sql = postgres(url, { ssl: "require" });

const statements = readFileSync(sqlFile, "utf8");
await sql.unsafe(statements);
await sql.end();
console.log(`Applied ${sqlFile}`);

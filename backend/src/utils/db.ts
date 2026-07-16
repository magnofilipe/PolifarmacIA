import fs from "fs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "db.json");

export function getDb() {
  if (!fs.existsSync(dbPath)) {
    return { medicos: [] };
  }
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao ler db.json", error);
    return { medicos: [] };
  }
}

export function saveDb(data: any) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Erro ao salvar db.json", error);
  }
}

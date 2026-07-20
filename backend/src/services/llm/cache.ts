import type { RagJustification } from "../../types/analysis.js";

const cache = new Map<string, RagJustification>();

export function getCached(key:string){
    return cache.get(key);
}

export function setCached(
    key:string,
    value:RagJustification
){
    cache.set(key,value);
}
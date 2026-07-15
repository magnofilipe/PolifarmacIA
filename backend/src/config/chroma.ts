import { ChromaClient } from "chromadb";


export const chroma =
    new ChromaClient();


export async function getCollection(){

    return chroma.getOrCreateCollection({
        name:"clinical-documents"
    });

}
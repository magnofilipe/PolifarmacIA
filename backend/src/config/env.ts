import dotenv from "dotenv";

dotenv.config();


export const env = {

    PORT:
        process.env.PORT || 3000,


    SUPABASE_URL:
        process.env.SUPABASE_URL!,


    SUPABASE_KEY:
        process.env.SUPABASE_KEY!,


    GEMINI_KEY:
        process.env.GEMINI_KEY!,


    CHROMA_URL:
        process.env.CHROMA_URL || "http://localhost:8000"

};


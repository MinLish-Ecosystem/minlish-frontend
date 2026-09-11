import api from "../lib/api";
export interface DictionaryResult {
    word: string;
    meaning: string;
    pronunciation?: string;
    partOfSpeech?: string;
    example?: string[];
    examples?: string[];
    descriptionEN?: string;
    audioUrl?: string;
    found: boolean;
    provider: string;
}

export const lookupWordApi = async (word: string): Promise<DictionaryResult> => {
    const res = await api.get(`/api/v1/dictionary/lookup?word=${encodeURIComponent(word)}`);
    return res.data.data;
}

export const batchLookupApi = async(words: string[]): Promise<DictionaryResult[]> => {
    const res = await api.post("/api/v1/dictionary/batch-lookup", {words});
    return res.data.data;
}

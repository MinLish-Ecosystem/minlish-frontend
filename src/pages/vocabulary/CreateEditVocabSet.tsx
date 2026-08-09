import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import api from "../../lib/api";
import { fetchSetDetail, fetchVocabSets, VocabSet, Word, VocabCategory, VocabLevel, ColorTheme } from "../../store/slices/vocabSlice";
import { AppDispatch, RootState } from "../../store";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { lookupWordApi, batchLookupApi } from "../../api/dictionary.api";

// Extended interface for managing local drafts of words
interface DraftWord {
  id: string; // temp client-side ID or existing MongoDB ID
  word: string;
  meaning: string;
  pronunciation?: string;
  partOfSpeech?: string;
  examples?: string[];
  note?: string;
  imageUrl?: string;
  audioUrl?: string;
  synonyms?: string[];
  antonyms?: string[];
  descriptionEN?: string;
  isNew: boolean;
  isModified: boolean;
  isDeleted: boolean;
}

const CATEGORIES: VocabCategory[] = [
  "General",
  "Business",
  "IELTS",
  "TOEIC",
  "Travel",
  "Technology",
  "Academic",
  "Psychology",
  "Science",
  "Other"
];

const LEVELS: VocabLevel[] = ["Beginner", "Intermediate", "Advanced", "Academic"];

const COLOR_THEMES: ColorTheme[] = ["purple", "blue", "emerald", "amber", "rose", "cyan"];

const DEFAULT_COVER_IMAGE = "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=800";

export default function CreateEditVocabSet() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Fetch current set details from Redux if in Edit Mode
  const { currentSet } = useSelector((state: RootState) => state.vocab);

  // Main Form States (Set details)
  const [setName, setSetName] = useState("");
  const [setDescription, setSetDescription] = useState("");
  const [category, setSetCategory] = useState<VocabCategory>("General");
  const [level, setSetLevel] = useState<VocabLevel>("Intermediate");
  const [colorTheme, setColorTheme] = useState<ColorTheme>("purple");
  const [tags, setSetTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [showCoverInput, setShowCoverInput] = useState(false);
  const [coverSource, setCoverSource] = useState<"upload" | "url">("upload");

  // Words Draft list
  const [draftWords, setDraftWords] = useState<DraftWord[]>([]);

  // Page Loadings
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Word Editor Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [activeTab, setActiveTab] = useState<"single" | "batch">("single");
  const [modalWordId, setModalWordId] = useState<string | null>(null);

  // Single word form inputs
  const [modalWordData, setModalWordData] = useState({
    word: "",
    pronunciation: "",
    partOfSpeech: "noun",
    meaning: "",
    example: "",
    note: "",
    imageUrl: "",
    imageSource: "upload" as "upload" | "url",
    audioUrl: "",
    synonyms: "",
    antonyms: "",
    descriptionEN: ""
  });
  const [modalLoading, setModalLoading] = useState(false);

  // Batch import inputs
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [batchRawText, setBatchRawText] = useState("");
  const [previewItems, setPreviewItems] = useState<any[]>([]);
  const [batchLookupLoading, setBatchLookupLoading] = useState(false);

  // Navigation Guard logic
  const originalSetRef = useRef<any>(null);

  // Initial Load (Edit Mode vs Create Mode)
  useEffect(() => {
    const loadData = async () => {
      if (setId) {
        setLoading(true);
        try {
          const payload = await dispatch(fetchSetDetail(setId)).unwrap();
          const setInfo = payload.set;
          originalSetRef.current = setInfo;

          setSetName(setInfo.name);
          setSetDescription(setInfo.description || "");
          setSetCategory(setInfo.category);
          setSetLevel(setInfo.level);
          setColorTheme(setInfo.colorTheme || "purple");
          setSetTags(setInfo.tags || []);
          setIsPublic(setInfo.isPublic || false);
          setCoverUrl(setInfo.coverUrl || "");

          const wordsList: DraftWord[] = payload.words.map((w: any) => ({
            id: w.id || w._id,
            word: w.word,
            meaning: w.meaning,
            pronunciation: w.pronunciation || "",
            partOfSpeech: w.partOfSpeech || "noun",
            examples: w.examples || [],
            note: w.note || "",
            imageUrl: w.imageUrl || "",
            audioUrl: w.audioUrl || "",
            synonyms: w.synonyms || [],
            antonyms: w.antonyms || [],
            descriptionEN: w.descriptionEN || "",
            isNew: false,
            isModified: false,
            isDeleted: false
          }));
          setDraftWords(wordsList);
        } catch (err) {
          toast.error("Failed to load set details");
          navigate("/vocabulary");
        } finally {
          setLoading(false);
        }
      } else {
        // Reset states for Create Mode
        setSetName("");
        setSetDescription("");
        setSetCategory("General");
        setSetLevel("Intermediate");
        setColorTheme("purple");
        setSetTags([]);
        setIsPublic(false);
        setCoverUrl("");
        setDraftWords([]);
        originalSetRef.current = null;
      }
    };
    loadData();
  }, [setId, dispatch, navigate]);

  // Calculate dirty state for Navigation Guard
  const isDirty =
    setName !== (originalSetRef.current?.name || "") ||
    setDescription !== (originalSetRef.current?.description || "") ||
    coverUrl !== (originalSetRef.current?.coverUrl || "") ||
    category !== (originalSetRef.current?.category || "General") ||
    level !== (originalSetRef.current?.level || "Intermediate") ||
    colorTheme !== (originalSetRef.current?.colorTheme || "purple") ||
    isPublic !== (originalSetRef.current?.isPublic || false) ||
    JSON.stringify(tags) !== JSON.stringify(originalSetRef.current?.tags || []) ||
    draftWords.some(w => w.isNew || w.isModified || w.isDeleted);

  // Block unsaved tab closing / browser reloads
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleBackToLibrary = () => {
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
        navigate(setId ? `/vocabulary/${setId}` : "/vocabulary");
      }
    } else {
      navigate(setId ? `/vocabulary/${setId}` : "/vocabulary");
    }
  };

  // Tag management
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const cleaned = tagInput.trim();
      if (tags.includes(cleaned)) {
        toast.error("Tag already exists");
        return;
      }
      if (tags.length >= 10) {
        toast.error("You can add a maximum of 10 tags");
        return;
      }
      setSetTags([...tags, cleaned]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSetTags(tags.filter(t => t !== tagToRemove));
  };

  // Cover image select file
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Cover image size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Word Editor Modal Actions
  // Helper to parse Dictionary API entry with improvements:
  // - Prefer US audio, fallback UK, then any
  // - Extract multiple definitions (first for meaning, first available for example)
  // - Extract secondary definition for descriptionEN
  // - Extract and deduplicate synonyms & antonyms (max 5)
  const parseDictionaryEntry = (data: any) => {
    if (!Array.isArray(data) || data.length === 0) return null;
    const entry = data[0];
    const meanings = entry.meanings || [];
    
    // 1. Part of Speech
    const firstMeaning = meanings[0];
    const pos = firstMeaning?.partOfSpeech || "noun";
    
    // 2. Definition / Meaning (used for default meaning)
    const firstDef = firstMeaning?.definitions?.[0]?.definition || "";
    
    // 3. Description EN (second definition in first meaning, or first definition in second meaning, or fallback)
    const descriptionEN = meanings[0]?.definitions[1]?.definition || 
                          meanings[1]?.definitions[0]?.definition || 
                          firstDef || "";
    
    // 4. Pronunciation / Phonetic
    const phonetic = entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || "";
    
    // 5. Example (first available across all meanings/definitions)
    let example = "";
    for (const m of meanings) {
      if (m.definitions) {
        for (const d of m.definitions) {
          if (d.example) {
            example = d.example;
            break;
          }
        }
      }
      if (example) break;
    }
    
    // 6. Audio (prefer US, then UK, then any)
    let audioUrl = "";
    if (entry.phonetics && Array.isArray(entry.phonetics)) {
      const audioPhonetics = entry.phonetics.filter((p: any) => p.audio && typeof p.audio === "string" && p.audio.length > 0);
      if (audioPhonetics.length > 0) {
        const usAudio = audioPhonetics.find((p: any) => p.audio.toLowerCase().includes("-us.mp3"));
        const ukAudio = audioPhonetics.find((p: any) => p.audio.toLowerCase().includes("-uk.mp3"));
        audioUrl = usAudio?.audio || ukAudio?.audio || audioPhonetics[0].audio;
      }
    }
    
    // 7. Synonyms (deduped, max 5)
    const synonymSet = new Set<string>();
    meanings.forEach((m: any) => {
      if (m.synonyms && Array.isArray(m.synonyms)) {
        m.synonyms.forEach((s: any) => {
          if (typeof s === "string" && s.trim()) synonymSet.add(s.trim());
        });
      }
      if (m.definitions && Array.isArray(m.definitions)) {
        m.definitions.forEach((d: any) => {
          if (d.synonyms && Array.isArray(d.synonyms)) {
            d.synonyms.forEach((s: any) => {
              if (typeof s === "string" && s.trim()) synonymSet.add(s.trim());
            });
          }
        });
      }
    });
    const synonyms = Array.from(synonymSet).slice(0, 5);
    
    // 8. Antonyms (deduped, max 5)
    const antonymSet = new Set<string>();
    meanings.forEach((m: any) => {
      if (m.antonyms && Array.isArray(m.antonyms)) {
        m.antonyms.forEach((a: any) => {
          if (typeof a === "string" && a.trim()) antonymSet.add(a.trim());
        });
      }
      if (m.definitions && Array.isArray(m.definitions)) {
        m.definitions.forEach((d: any) => {
          if (d.antonyms && Array.isArray(d.antonyms)) {
            d.antonyms.forEach((a: any) => {
              if (typeof a === "string" && a.trim()) antonymSet.add(a.trim());
            });
          }
        });
      }
    });
    const antonyms = Array.from(antonymSet).slice(0, 5);

    return {
      meaning: firstDef,
      partOfSpeech: pos.toLowerCase(),
      pronunciation: phonetic,
      example,
      audioUrl,
      descriptionEN,
      synonyms,
      antonyms
    };
  };

  const openAddWordModal = (tab: "single" | "batch" = "single") => {
    setModalMode("add");
    setActiveTab(tab);
    setModalWordId(null);
    setModalWordData({
      word: "",
      pronunciation: "",
      partOfSpeech: "noun",
      meaning: "",
      example: "",
      note: "",
      imageUrl: "",
      imageSource: "upload",
      audioUrl: "",
      synonyms: "",
      antonyms: "",
      descriptionEN: ""
    });
    setCsvFile(null);
    setBatchRawText("");
    setPreviewItems([]);
    setShowModal(true);
  };

  const openEditWordModal = (word: DraftWord) => {
    setModalMode("edit");
    setActiveTab("single");
    setModalWordId(word.id);
    setModalWordData({
      word: word.word,
      pronunciation: word.pronunciation || "",
      partOfSpeech: word.partOfSpeech || "noun",
      meaning: word.meaning,
      example: word.examples?.[0] || "",
      note: word.note || "",
      imageUrl: word.imageUrl || "",
      imageSource: word.imageUrl?.startsWith("data:") ? "upload" : "url",
      audioUrl: word.audioUrl || "",
      synonyms: word.synonyms?.join(", ") || "",
      antonyms: word.antonyms?.join(", ") || "",
      descriptionEN: word.descriptionEN || ""
    });
    setShowModal(true);
  };

  const handleModalWordImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Word illustration image must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setModalWordData((prev) => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // English dictionary API single Auto-Fill
  const handleAutoFill = async () => {
    const lookup = modalWordData.word.trim();
    if (!lookup) {
      toast.error("Please enter a word first");
      return;
    }
    setModalLoading(true);
    try{
      const details = await lookupWordApi(lookup);
      if (details && details.found){
        setModalWordData((prev) => ({
          ...prev,
          meaning: details.meaning,
          partOfSpeech: details.partOfSpeech || "noun",
          pronunciation: details.pronunciation || "",
          example: details.example?.[0] || "",
          audioUrl: details.audioUrl || "",
          descriptionEN: (details as any).descriptionEN || "",
        }));
        toast.success(`Auto-filled from ${details.provider}!`);
      } else {
        toast.error("Cound not find definition for this word");
      }
    } catch (err){
      toast.error("Cound not find dictionary details for this word");
    } finally {
      setModalLoading(false);
    }
  };

  // Text-To-Speech / Audio playback
  const playAudio = () => {
    if (modalWordData.audioUrl) {
      const audio = new Audio(modalWordData.audioUrl);
      audio.play().catch(() => {
        toast.error("Failed to play audio");
      });
    } else if (modalWordData.word) {
      const utterance = new SpeechSynthesisUtterance(modalWordData.word);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error("Nothing to play");
    }
  };

  // Save changes from word editor modal back to draftWords state
  const handleSaveWordFromModal = () => {
    if (!modalWordData.word.trim()) {
      toast.error("Word is required");
      return;
    }

    const normalizedWord = modalWordData.word.trim().toLowerCase();
    const existing = draftWords.find(
      (w) => !w.isDeleted && w.id !== modalWordId && w.word.trim().toLowerCase() === normalizedWord
    );

    if (existing) {
      setModalWordId(existing.id);
      setModalMode("edit");
      setModalWordData({
        word: existing.word,
        meaning: existing.meaning,
        pronunciation: existing.pronunciation || "",
        partOfSpeech: existing.partOfSpeech || "noun",
        example: existing.examples?.[0] || "",
        note: existing.note || "",
        imageUrl: existing.imageUrl || "",
        imageSource: existing.imageUrl ? "url" : "upload",
        audioUrl: existing.audioUrl || "",
        synonyms: existing.synonyms?.join(", ") || "",
        antonyms: existing.antonyms?.join(", ") || "",
        descriptionEN: existing.descriptionEN || "",
      });
      toast.success(`Switched to editing existing word: "${existing.word}"`);
      return;
    }

    if (!modalWordData.meaning.trim()) {
      toast.error("Meaning is required");
      return;
    }

    const parsedSynonyms = modalWordData.synonyms.trim()
      ? modalWordData.synonyms.split(",").map(s => s.trim()).filter(Boolean)
      : [];
    const parsedAntonyms = modalWordData.antonyms.trim()
      ? modalWordData.antonyms.split(",").map(s => s.trim()).filter(Boolean)
      : [];

    if (modalMode === "add") {
      const newWord: DraftWord = {
        id: "temp_" + Date.now(),
        word: modalWordData.word.trim(),
        meaning: modalWordData.meaning.trim(),
        pronunciation: modalWordData.pronunciation.trim(),
        partOfSpeech: modalWordData.partOfSpeech,
        examples: modalWordData.example.trim() ? [modalWordData.example.trim()] : [],
        note: modalWordData.note.trim(),
        imageUrl: modalWordData.imageUrl,
        audioUrl: modalWordData.audioUrl,
        synonyms: parsedSynonyms,
        antonyms: parsedAntonyms,
        descriptionEN: modalWordData.descriptionEN.trim(),
        isNew: true,
        isModified: false,
        isDeleted: false
      };
      setDraftWords([...draftWords, newWord]);
      toast.success("Word added to draft list!");
    } else if (modalMode === "edit" && modalWordId) {
      setDraftWords(
        draftWords.map((w) => {
          if (w.id === modalWordId) {
            return {
              ...w,
              word: modalWordData.word.trim(),
              meaning: modalWordData.meaning.trim(),
              pronunciation: modalWordData.pronunciation.trim(),
              partOfSpeech: modalWordData.partOfSpeech,
              examples: modalWordData.example.trim() ? [modalWordData.example.trim()] : [],
              note: modalWordData.note.trim(),
              imageUrl: modalWordData.imageUrl,
              audioUrl: modalWordData.audioUrl,
              synonyms: parsedSynonyms,
              antonyms: parsedAntonyms,
              descriptionEN: modalWordData.descriptionEN.trim(),
              isModified: true
            };
          }
          return w;
        })
      );
      toast.success("Word updated in draft list!");
    }
    setShowModal(false);
  };

  // Parse CSV file content
  const handleCsvFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseAndSetPreview(text, "csv");
      };
      reader.readAsText(file);
    }
  };

  // Parse copy-pasted text
  const handleRawTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setBatchRawText(text);
    parseAndSetPreview(text, "text");
  };

  const parseCsvLine = (line: string): string[] => {
    const fields: string[] = [];
    let currentField = "";
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (c === '"') {
        if (inQuotes && j + 1 < line.length && line[j + 1] === '"') {
          currentField += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        fields.push(currentField.trim());
        currentField = "";
      } else {
        currentField += c;
      }
    }
    fields.push(currentField.trim());
    return fields;
  };

  const harvestEnglishWords = (text: string): string[] => {
    const tokens = text.split(/[\n,;\t\r]/).map(t => t.trim()).filter(Boolean);
    const result: string[] = [];
    const seen = new Set<string>();
    const englishWordRegex = /^[a-zA-Z\s'-]+$/;

    for (const token of tokens) {
      const subTokens = token.split(/\s*[:\-]\s*/).map(t => t.trim()).filter(Boolean);
      for (const sub of subTokens) {
        const cleaned = sub.replace(/^["'([{*\-\s]+|["')\]}*.\s]+$/g, '').trim();
        if (cleaned.length >= 2 && englishWordRegex.test(cleaned)) {
          const lower = cleaned.toLowerCase();
          if (lower === "word" || lower === "meaning" || lower === "pronunciation" || lower === "part of speech" || lower === "description en" || lower === "note" || lower === "examples") {
            continue;
          }
          if (!seen.has(lower)) {
            seen.add(lower);
            const formatted = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
            result.push(formatted);
          }
        }
      }
    }
    return result;
  };

  const parseAndSetPreview = (rawContent: string, format: "csv" | "text") => {
    if (!rawContent.trim()) {
      setPreviewItems([]);
      return;
    }

    const items: any[] = [];

    if (format === "csv") {
      const lines = rawContent.split("\n").map(l => l.trim()).filter(Boolean);
      const firstLine = lines.length > 0 ? lines[0].toLowerCase() : "";
      const isSystemCsv = firstLine.includes("word") && (firstLine.includes("meaning") || firstLine.includes("pronunciation") || firstLine.includes("part of speech"));

      if (isSystemCsv) {
        const headerRow = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
        const wordIdx = headerRow.indexOf("word");
        const pronunciationIdx = headerRow.indexOf("pronunciation");
        const posIdx = headerRow.findIndex(h => h.includes("part") || h.includes("speech") || h.includes("pos"));
        const meaningIdx = headerRow.indexOf("meaning");
        const descIdx = headerRow.findIndex(h => h.includes("description") || h.includes("desc"));
        const noteIdx = headerRow.indexOf("note");
        const examplesIdx = headerRow.findIndex(h => h.includes("example"));

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          const fields = parseCsvLine(line);
          const word = wordIdx !== -1 ? fields[wordIdx] || "" : "";
          if (word.trim()) {
            const pronunciation = pronunciationIdx !== -1 ? fields[pronunciationIdx] || "" : "";
            const partOfSpeech = posIdx !== -1 ? fields[posIdx] || "noun" : "noun";
            const meaning = meaningIdx !== -1 ? fields[meaningIdx] || "" : "";
            const descriptionEN = descIdx !== -1 ? fields[descIdx] || "" : "";
            const note = noteIdx !== -1 ? fields[noteIdx] || "" : "";
            const exampleRaw = examplesIdx !== -1 ? fields[examplesIdx] || "" : "";

            items.push({
              id: "import_" + i + "_" + Date.now(),
              word: word.trim(),
              meaning: meaning.trim(),
              pronunciation: pronunciation.trim(),
              partOfSpeech: partOfSpeech.trim().toLowerCase(),
              example: exampleRaw.trim(),
              note: note.trim(),
              synonyms: [],
              antonyms: [],
              descriptionEN: descriptionEN.trim(),
              isValid: word.trim().length > 0 && meaning.trim().length > 0
            });
          }
        }
      } else {
        const harvested = harvestEnglishWords(rawContent);
        harvested.forEach((word, idx) => {
          items.push({
            id: "harvest_" + idx + "_" + Date.now(),
            word,
            meaning: "",
            pronunciation: "",
            partOfSpeech: "noun",
            example: "",
            note: "",
            synonyms: [],
            antonyms: [],
            descriptionEN: "",
            isValid: false
          });
        });
      }
    } else {
      const harvested = harvestEnglishWords(rawContent);
      harvested.forEach((word, idx) => {
        items.push({
          id: "harvest_" + idx + "_" + Date.now(),
          word,
          meaning: "",
          pronunciation: "",
          partOfSpeech: "noun",
          example: "",
          note: "",
          synonyms: [],
          antonyms: [],
          descriptionEN: "",
          isValid: false
        });
      });
    }

    setPreviewItems(items);
  };

  // Batch auto-fill definitions using public dictionary API
  const handleBatchAutoLookup = async () => {
    if (previewItems.length === 0) return;
    setBatchLookupLoading(true);
    try {
      const missingItems = previewItems.filter(item => !item.meaning || item.meaning.trim() === "");
      const wordsToLookup = missingItems.map(item => item.word);
      if (wordsToLookup.length === 0){
        toast.success("All words already have meanings!");
        setBatchLookupLoading(false);
        return;
      }
      const results = await batchLookupApi(wordsToLookup);
      let successCount = 0;
      let failedCount = 0;
      const updated = previewItems.map((item) => {
        if (!item.meaning || item.meaning.trim() === "") {
          const match = results.find((r) => r.word.toLowerCase() === item.word.trim().toLowerCase());
          if (match && match.found){
            successCount++;
            return{
              ...item,
              meaning: match.meaning,
              partOfSpeech: match.partOfSpeech || "noun",
              pronunciation: match.pronunciation || "",
              example: match.example?.[0] || "",
              audioUrl: match.audioUrl || "",
              descriptionEN: (match as any).descriptionEN || "",
              isValid: item.word.trim().length > 0 && match.meaning.trim().length > 0,
            };
          } else{
            failedCount++;
          }
        }
        return item;
      });
      setPreviewItems(updated);
      toast.success(`Batch dictionary lookup: ${successCount} words filled, ${failedCount} failed.`);
    } catch (err) {
      toast.error("Failed to perform batch auto-fill");
    } finally {
      setBatchLookupLoading(false);
    }
  };

  // Helper to check if a word is duplicate in drafts or within preview
  const isDuplicateWord = (word: string, currentId: string) => {
    const normalized = word.trim().toLowerCase();
    if (!normalized) return false;
    
    const existsInDrafts = draftWords.some(w => !w.isDeleted && w.word.trim().toLowerCase() === normalized);
    if (existsInDrafts) return true;
    
    const firstIndex = previewItems.findIndex(p => p.word.trim().toLowerCase() === normalized);
    const currentIndex = previewItems.findIndex(p => p.id === currentId);
    if (firstIndex !== -1 && firstIndex !== currentIndex) return true;
    
    return false;
  };

  // Tra cứu nghĩa riêng lẻ cho từng dòng trong bảng Batch Import
  const handleSingleBatchLookup = async (index: number) => {
    const item = previewItems[index];
    if (!item.word.trim()) {
      toast.error("Please enter a word first");
      return;
    }
    
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(item.word.trim())}`);
      if (res.ok) {
        const data = await res.json();
        const details = parseDictionaryEntry(data);
        if (details) {
          const updated = [...previewItems];
          updated[index] = {
            ...item,
            meaning: details.meaning,
            partOfSpeech: details.partOfSpeech,
            pronunciation: details.pronunciation,
            example: details.example,
            audioUrl: details.audioUrl,
            synonyms: details.synonyms,
            antonyms: details.antonyms,
            descriptionEN: details.descriptionEN,
            isValid: item.word.trim().length > 0 && details.meaning.trim().length > 0
          };
          setPreviewItems(updated);
          toast.success(`Looked up "${item.word}" successfully!`);
        } else {
          toast.error("Could not parse details for this word");
        }
      } else {
        toast.error(`Word "${item.word}" not found in dictionary`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Dictionary lookup failed");
    }
  };

  // Dọn dẹp các dòng trùng hoặc thiếu nghĩa trong bảng preview
  const handleCleanUpPreview = () => {
    const seen = new Set<string>();
    const existingWords = draftWords.filter(w => !w.isDeleted).map(w => w.word.trim().toLowerCase());
    
    const cleaned = previewItems.filter(item => {
      const wordNormalized = item.word.trim().toLowerCase();
      if (!wordNormalized) return false;
      if (!item.meaning.trim()) return false;
      
      if (existingWords.includes(wordNormalized)) return false;
      if (seen.has(wordNormalized)) return false;
      
      seen.add(wordNormalized);
      return true;
    });
    
    setPreviewItems(cleaned);
    toast.success(`Cleaned up preview: kept ${cleaned.length} unique, valid terms.`);
  };

  // Confirm import items from batch tab into main draft list
  const handleImportParsedItems = () => {
    const validItems = previewItems.filter(item => item.word.trim() && item.meaning.trim());
    if (validItems.length === 0) {
      toast.error("No valid terms to import. Ensure terms have words and meanings.");
      return;
    }

    const uniqueValidItems = validItems.filter(item => !isDuplicateWord(item.word, item.id));
    const skippedCount = validItems.length - uniqueValidItems.length;

    if (uniqueValidItems.length === 0) {
      toast.error("No new terms to import. All parsed terms are duplicates.");
      return;
    }

    const newWords: DraftWord[] = uniqueValidItems.map((item) => ({
      id: "temp_" + Math.random().toString(36).substr(2, 9),
      word: item.word.trim(),
      meaning: item.meaning.trim(),
      pronunciation: item.pronunciation || "",
      partOfSpeech: item.partOfSpeech || "noun",
      examples: item.example?.trim() ? [item.example.trim()] : [],
      note: item.note || "",
      imageUrl: "",
      audioUrl: item.audioUrl || "",
      synonyms: item.synonyms || [],
      antonyms: item.antonyms || [],
      descriptionEN: item.descriptionEN || "",
      isNew: true,
      isModified: false,
      isDeleted: false
    }));

    setDraftWords([...draftWords, ...newWords]);
    if (skippedCount > 0) {
      toast.success(`Imported ${newWords.length} terms, skipped ${skippedCount} duplicate(s).`);
    } else {
      toast.success(`Imported ${newWords.length} terms into draft list successfully!`);
    }
    setShowModal(false);
  };

  // Reorder words in local state
  const handleMoveWord = (index: number, direction: "up" | "down") => {
    const activeWords = draftWords.filter(w => !w.isDeleted);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeWords.length) return;

    const originalIdx = draftWords.indexOf(activeWords[index]);
    const originalTargetIdx = draftWords.indexOf(activeWords[targetIndex]);

    const updated = [...draftWords];
    const temp = updated[originalIdx];
    updated[originalIdx] = updated[originalTargetIdx];
    updated[originalTargetIdx] = temp;

    setDraftWords(updated);
  };

  // Delete word from local state
  const handleDeleteWord = (word: DraftWord) => {
    if (word.isNew) {
      setDraftWords(draftWords.filter(w => w.id !== word.id));
    } else {
      setDraftWords(
        draftWords.map((w) => {
          if (w.id === word.id) {
            return { ...w, isDeleted: true };
          }
          return w;
        })
      );
    }
    toast.success("Word removed from list!");
  };

  // Save Orchestrator (Batch save Set + Words)
  const handleSaveSet = async () => {
    if (!setName.trim()) {
      toast.error("Please enter a Set Title");
      return;
    }

    const activeCount = draftWords.filter(w => !w.isDeleted).length;
    if (activeCount === 0) {
      toast.error("Please add at least one vocabulary term to the set");
      return;
    }

    setSaveLoading(true);
    try {
      let savedSetId = setId;

      const payload = {
        name: setName.trim(),
        description: setDescription.trim(),
        category,
        level,
        colorTheme,
        tags,
        isPublic,
        coverUrl: coverUrl || undefined
      };

      // 1. Save Set Metadata
      if (!setId) {
        const res = await api.post("/api/v1/vocab/sets", payload);
        savedSetId = res.data.data.id;
      } else {
        await api.put(`/api/v1/vocab/sets/${setId}`, payload);
      }

      if (!savedSetId) {
        throw new Error("Failed to save set metadata");
      }

      // 2. Coordinated Word CRUD batch calls via Promise.all
      // Newly created words
      const addPromises = draftWords
        .filter(w => w.isNew && !w.isDeleted)
        .map(w => api.post(`/api/v1/vocab/sets/${savedSetId}/words`, {
          word: w.word.trim(),
          meaning: w.meaning.trim(),
          pronunciation: w.pronunciation || undefined,
          partOfSpeech: w.partOfSpeech || undefined,
          examples: w.examples?.length ? w.examples : undefined,
          note: w.note || undefined,
          imageUrl: w.imageUrl || undefined,
          audioUrl: w.audioUrl || undefined,
          synonyms: w.synonyms?.length ? w.synonyms : undefined,
          antonyms: w.antonyms?.length ? w.antonyms : undefined,
          descriptionEN: w.descriptionEN || undefined
        }));

      // Modified existing words
      const updatePromises = draftWords
        .filter(w => w.isModified && !w.isNew && !w.isDeleted)
        .map(w => api.put(`/api/v1/vocab/sets/${savedSetId}/words/${w.id}`, {
          word: w.word.trim(),
          meaning: w.meaning.trim(),
          pronunciation: w.pronunciation || undefined,
          partOfSpeech: w.partOfSpeech || undefined,
          examples: w.examples?.length ? w.examples : undefined,
          note: w.note || undefined,
          imageUrl: w.imageUrl || undefined,
          audioUrl: w.audioUrl || undefined,
          synonyms: w.synonyms?.length ? w.synonyms : undefined,
          antonyms: w.antonyms?.length ? w.antonyms : undefined,
          descriptionEN: w.descriptionEN || undefined
        }));

      // Deleted existing words
      const deletePromises = draftWords
        .filter(w => w.isDeleted && !w.isNew)
        .map(w => api.delete(`/api/v1/vocab/sets/${savedSetId}/words/${w.id}`));

      await Promise.all([...addPromises, ...updatePromises, ...deletePromises]);

      toast.success(setId ? "Vocabulary set updated successfully!" : "Vocabulary set created successfully!");
      
      // Force refresh vocabulary sets in state
      dispatch(fetchVocabSets({}));

      // Reset dirty flag and redirect
      originalSetRef.current = null; 
      if (isPublic) {
        navigate("/my-content?tab=sets");
      } else {
        navigate(`/vocabulary/${savedSetId}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to save vocabulary set");
    } finally {
      setSaveLoading(false);
    }
  };

  const activeWordsList = draftWords.filter(w => !w.isDeleted);

  // Lazy-load word cards — show 15 first, load more as user scrolls
  // We use activeWordsList (the full list) for all index calculations,
  // but only render visibleActiveWords to the DOM.
  const { visibleItems: visibleActiveWords, sentinelRef: wordsSentinelRef, hasMore: hasMoreWords } = useInfiniteScroll(activeWordsList, 15, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading set details...</p>
      </div>
    );
  }

  const modalWordNormalized = modalWordData.word.trim().toLowerCase();
  const existingWordInDraft = modalWordNormalized
    ? draftWords.find(w => !w.isDeleted && w.id !== modalWordId && w.word.trim().toLowerCase() === modalWordNormalized)
    : null;

  return (
    <div className="max-w-7xl mx-auto w-full relative z-10 py-6 px-4">
      {/* Full-screen Loading Overlay for saving */}
      {saveLoading && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center gap-4 text-white">
          <div className="w-12 h-12 rounded-full border-4 border-purple-300/30 border-t-purple-500 animate-spin" />
          <p className="font-bold text-lg tracking-wide">Saving Vocabulary Set...</p>
          <p className="text-sm text-slate-300">Synchronizing database details, please wait</p>
        </div>
      )}

      {/* Header Actions */}
      <header className="flex justify-between items-center gap-4 w-full mb-8">
        <button
          onClick={handleBackToLibrary}
          className="flex items-center gap-2 text-slate-600 hover:text-purple-600 font-semibold text-sm hover:bg-purple-50 px-4 py-2 rounded-full transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Back to Library
        </button>
        
        <button
          onClick={handleSaveSet}
          disabled={saveLoading}
          className="px-8 py-3 rounded-full shadow-md hover:shadow-lg bg-[#1000a3] text-white hover:-translate-y-0.5 hover:scale-[1.02] transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveLoading ? "Saving..." : "Save Vocabulary Set"}
        </button>
      </header>

      {/* Main Form Content */}
      <main className="flex flex-col gap-8">
        {/* Set Details Card */}
        <section className="bg-surface-container-lowest/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-slate-800">
              {setId ? "Edit Vocabulary Set" : "Create a New Set"}
            </h1>
            <p className="text-base text-slate-500 mt-1">
              Organize your vocabulary for targeted practice and structured learning.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {/* Cover Image Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Set Cover Image</label>
              <div className="flex flex-col sm:flex-row gap-5 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <img
                  src={coverUrl || DEFAULT_COVER_IMAGE}
                  alt="Set Cover Preview"
                  className="w-32 h-20 rounded-xl object-cover border border-slate-200 shadow-sm bg-white"
                />
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCoverInput(true);
                        setCoverSource("upload");
                      }}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-300 transition-all"
                    >
                      Choose Cover Image
                    </button>
                    {coverUrl && (
                      <button
                        type="button"
                        onClick={() => setCoverUrl("")}
                        className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-all"
                      >
                        Remove Cover
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Supports JPG, PNG (Max 5MB). If empty, the default library cover will be used.
                  </p>

                  {showCoverInput && (
                    <div className="mt-2 p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3 w-full max-w-md">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCoverSource("upload")}
                          className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                            coverSource === "upload" ? "bg-[#1000a3] text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          File
                        </button>
                        <button
                          type="button"
                          onClick={() => setCoverSource("url")}
                          className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                            coverSource === "url" ? "bg-[#1000a3] text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          URL
                        </button>
                      </div>

                      {coverSource === "upload" ? (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverFileChange}
                          className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-600 hover:file:bg-slate-200 cursor-pointer"
                        />
                      ) : (
                        <input
                          type="text"
                          placeholder="Paste image URL..."
                          className="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary w-full"
                          value={coverUrl.startsWith("data:") ? "" : coverUrl}
                          onChange={(e) => setCoverUrl(e.target.value)}
                        />
                      )}

                      <button
                        onClick={() => setShowCoverInput(false)}
                        className="px-2 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-md"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Set Title */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Set Title</label>
              <input
                type="text"
                placeholder="e.g., IELTS Academic Essential Verbs, N3 Grammar..."
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 font-medium text-sm"
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Description (Optional)</label>
              <textarea
                placeholder="Briefly describe the context, focus, or purpose of this set..."
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-700 text-sm resize-none"
                rows={2}
                value={setDescription}
                onChange={(e) => setSetDescription(e.target.value)}
              />
            </div>

            {/* Selects: Category, Level, ColorTheme */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">Category</label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary text-sm font-medium"
                  value={category}
                  onChange={(e) => setSetCategory(e.target.value as VocabCategory)}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">Level</label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary text-sm font-medium"
                  value={level}
                  onChange={(e) => setSetLevel(e.target.value as VocabLevel)}
                >
                  {LEVELS.map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">Color Accent</label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary text-sm font-medium"
                  value={colorTheme}
                  onChange={(e) => setColorTheme(e.target.value as ColorTheme)}
                >
                  {COLOR_THEMES.map(theme => (
                    <option key={theme} value={theme}>{theme.charAt(0).toUpperCase() + theme.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags & Privacy Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
              {/* Tags Pills */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">sell</span>
                  Tags (Press Enter to add)
                </label>
                <div className="flex flex-wrap gap-2 items-center min-h-[50px] bg-white border border-slate-200 rounded-xl p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all cursor-text">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 bg-[#8127cf]/10 text-[#8127cf] text-xs px-2.5 py-1 rounded-lg border border-[#8127cf]/20 font-semibold shadow-xs">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-500 transition-colors flex items-center justify-center rounded-full hover:bg-[#8127cf]/20 p-0.5"
                      >
                        <span className="material-symbols-outlined text-[12px] leading-none font-bold">close</span>
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={tags.length === 0 ? "Add tag..." : ""}
                    className="flex-1 bg-transparent border-none focus:ring-0 p-0.5 text-sm outline-none text-slate-700 min-w-[100px]"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                  />
                </div>
              </div>

              {/* Privacy Radio */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  Visibility
                </label>
                <div className="flex gap-3 items-center h-full">
                  <label
                    className={`relative flex items-center p-3 gap-3 rounded-xl border-2 cursor-pointer flex-1 shadow-xs transition-all ${
                      isPublic ? "border-[#1000a3] bg-blue-50/20" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="privacy"
                      checked={isPublic}
                      onChange={() => setIsPublic(true)}
                      className="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-slate-800">Public</span>
                      <span className="text-xs text-slate-400">Everyone can view</span>
                    </div>
                    <span className={`material-symbols-outlined ml-auto text-sm ${isPublic ? "text-[#1000a3]" : "text-slate-400"}`}>public</span>
                  </label>

                  <label
                    className={`relative flex items-center p-3 gap-3 rounded-xl border-2 cursor-pointer flex-1 shadow-xs transition-all ${
                      !isPublic ? "border-[#1000a3] bg-blue-50/20" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="privacy"
                      checked={!isPublic}
                      onChange={() => setIsPublic(false)}
                      className="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-slate-800">Private</span>
                      <span className="text-xs text-slate-400">Only you can view</span>
                    </div>
                    <span className={`material-symbols-outlined ml-auto text-sm ${!isPublic ? "text-[#1000a3]" : "text-slate-400"}`}>lock</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Vocabulary Terms Section */}
        <section className="flex flex-col gap-5 mt-2">
          <div className="flex justify-between items-end border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary bg-primary-50 p-1.5 rounded-lg">library_books</span>
              Vocabulary Terms
            </h2>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAddWordModal("batch")}
                  className="flex items-center gap-1.5 px-4 py-2 border border-[#1000a3] text-[#1000a3] font-semibold text-sm rounded-full hover:bg-blue-50/40 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">upload_file</span>
                  Import CSV / Text
                </button>
                <button
                  onClick={() => openAddWordModal("single")}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1000a3] text-white font-semibold text-sm rounded-full hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Add Word
                </button>
              </div>
              <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                {activeWordsList.length} {activeWordsList.length === 1 ? "Term" : "Terms"}
              </span>
            </div>
          </div>

          {/* Vocabulary list rendering */}
          {activeWordsList.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
              <span className="material-symbols-outlined text-slate-300 text-5xl mb-3">auto_stories</span>
              <h3 className="font-bold text-slate-700 mb-1 text-lg">No words in this set yet</h3>
              <p className="text-base text-slate-400 mb-6">Start building your vocabulary deck by adding your first word.</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => openAddWordModal("single")}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-bold rounded-lg transition-colors border border-slate-200"
                >
                  Add a Word
                </button>
                <button
                  onClick={() => openAddWordModal("batch")}
                  className="px-4 py-2 bg-[#1000a3] text-white hover:shadow-md text-sm font-bold rounded-lg transition-all"
                >
                  Import List
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {visibleActiveWords.map((word) => {
                // Get the true index in the full active list for move controls
                const idx = activeWordsList.indexOf(word);
                return (
                <div
                  key={word.id}
                  className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 hover:shadow-md transition-all relative group flex flex-col md:flex-row gap-4"
                >
                  {/* Index and Move controls */}
                  <div className="flex md:flex-col items-center justify-between md:justify-start gap-2 pt-1.5">
                    <span className="font-bold text-sm text-[#1000a3] bg-blue-50 w-8 h-8 rounded-full flex items-center justify-center border border-blue-100 shadow-3xs">
                      {idx + 1}
                    </span>

                    {/* Move controls */}
                    <div className="flex md:flex-col gap-1">
                      <button
                        onClick={() => handleMoveWord(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-md disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Move Up"
                      >
                        <span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span>
                      </button>
                      <button
                        onClick={() => handleMoveWord(idx, "down")}
                        disabled={idx === activeWordsList.length - 1}
                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-md disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Move Down"
                      >
                        <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
                      </button>
                    </div>
                  </div>

                  {/* Read-Only Card Info */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Left details (Word / Pronunciation / Part of Speech) */}
                    <div className="md:col-span-5 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xl font-bold text-slate-800">{word.word}</span>
                        {word.partOfSpeech && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase tracking-wider">
                            {word.partOfSpeech}
                          </span>
                        )}
                        {word.pronunciation && (
                          <span className="text-sm text-slate-400 font-medium font-sans">
                            {word.pronunciation}
                          </span>
                        )}
                      </div>
                      <p className="text-base text-slate-700 font-medium border-l-2 border-slate-200 pl-2 mt-1">
                        {word.meaning}
                      </p>
                    </div>

                    {/* Right details (Examples & Note) */}
                    <div className="md:col-span-7 flex flex-col gap-2 text-sm">
                      {word.examples && word.examples.length > 0 && (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-xs uppercase text-slate-400 tracking-wider">Example:</span>
                          <p className="text-slate-600 italic font-sans">"{word.examples[0]}"</p>
                        </div>
                      )}
                      {word.note && (
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-500 mt-1">
                          <span className="font-bold text-slate-600">Note: </span>
                          {word.note}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail illustration preview if uploaded */}
                  {word.imageUrl && (
                    <div className="hidden sm:block self-center">
                      <img
                        src={word.imageUrl}
                        alt="Word Illustration"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-100 bg-slate-50 shadow-3xs"
                      />
                    </div>
                  )}

                  {/* Actions: Edit / Delete */}
                  <div className="flex md:flex-col gap-2 justify-end md:justify-start items-center pt-1.5 md:border-l md:border-slate-100 md:pl-4">
                    <button
                      onClick={() => openEditWordModal(word)}
                      className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-full transition-all"
                      title="Edit Term"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteWord(word)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                      title="Delete Term"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              );
              })}

              {/* Sentinel for infinite scroll */}
              {hasMoreWords && <div ref={wordsSentinelRef} className="h-4 w-full" />}

              {/* Dash Add Button at bottom of list */}
              <button
                onClick={() => openAddWordModal("single")}
                className="w-full py-6 border-2 border-dashed border-slate-300 bg-slate-50/50 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-[#1000a3] hover:bg-blue-50/20 hover:border-[#1000a3]/40 transition-all group mt-2"
              >
                <div className="bg-slate-200 text-slate-600 p-2.5 rounded-full group-hover:scale-110 group-hover:bg-[#1000a3] group-hover:text-white transition-all duration-200 shadow-3xs">
                  <span className="material-symbols-outlined text-sm font-bold leading-none">add</span>
                </div>
                <span className="font-bold text-sm">Add Another Term</span>
              </button>
            </div>
          )}
        </section>

        {/* Bottom Spacer */}
        <div className="h-16"></div>
      </main>

      {/* ================= ADD/EDIT WORD POPUP MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowModal(false)}
          ></div>

          {/* Modal Container */}
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="font-headline-md text-lg text-slate-800 font-bold">
                {modalMode === "add" ? "Add New Word" : "Edit Word Detail"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-md">close</span>
              </button>
            </div>

            {/* Tabs (Disabled in Edit Mode since Edit is single word only) */}
            {modalMode === "add" && (
              <div className="flex border-b border-slate-200 px-6">
                <button
                  onClick={() => setActiveTab("single")}
                  className={`px-5 py-3 font-semibold text-xs border-b-2 transition-all ${
                    activeTab === "single"
                      ? "border-[#1000a3] text-[#1000a3]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Single Word
                </button>
                <button
                  onClick={() => setActiveTab("batch")}
                  className={`px-5 py-3 font-semibold text-xs border-b-2 transition-all ${
                    activeTab === "batch"
                      ? "border-[#1000a3] text-[#1000a3]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Batch Import
                </button>
              </div>
            )}

            {/* Modal Form Scroll Area */}
            <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[60vh] bg-slate-50/50">
              {activeTab === "single" ? (
                /* SINGLE WORD INPUTS */
                <div className="flex flex-col gap-4">
                  {/* Word Input & Dictionary Auto Fill */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Word / Term</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g., Serendipity"
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold"
                        value={modalWordData.word}
                        onChange={(e) => setModalWordData({ ...modalWordData, word: e.target.value })}
                      />
                      <button
                        onClick={handleAutoFill}
                        disabled={modalLoading}
                        className="flex items-center gap-1 px-4 py-2.5 bg-blue-50 border border-blue-200 hover:bg-blue-100/60 rounded-xl text-xs text-[#1000a3] font-bold transition-all disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                        {modalLoading ? "Searching..." : "Auto Fill"}
                      </button>
                    </div>
                    {existingWordInDraft && (
                      <p className="text-red-500 text-xs font-semibold flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        This word already exists in this set. Click the button below to edit it.
                      </p>
                    )}
                  </div>

                  {/* Pronunciation & Part of Speech */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Pronunciation phonetic</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="/ˌserənˈdipədē/"
                          className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-sans"
                          value={modalWordData.pronunciation}
                          onChange={(e) => setModalWordData({ ...modalWordData, pronunciation: e.target.value })}
                        />
                        <button
                          onClick={playAudio}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#1000a3] rounded-md transition-colors"
                          title="Speak word"
                        >
                          <span className="material-symbols-outlined text-[18px]">volume_up</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Part of Speech</label>
                      <select
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary text-sm"
                        value={modalWordData.partOfSpeech}
                        onChange={(e) => setModalWordData({ ...modalWordData, partOfSpeech: e.target.value })}
                      >
                        <option value="noun">Noun</option>
                        <option value="verb">Verb</option>
                        <option value="adjective">Adjective</option>
                        <option value="adverb">Adverb</option>
                        <option value="phrase">Phrase</option>
                        <option value="idiom">Idiom</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Meaning */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Meaning / Translation</label>
                    <textarea
                      placeholder="The occurrence and development of events by chance in a happy or beneficial way..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                      rows={2}
                      value={modalWordData.meaning}
                      onChange={(e) => setModalWordData({ ...modalWordData, meaning: e.target.value })}
                    />
                  </div>

                  {/* Example */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Example Sentence</label>
                    <textarea
                      placeholder="Nature has a way of providing serendipity when you least expect it."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                      rows={2}
                      value={modalWordData.example}
                      onChange={(e) => setModalWordData({ ...modalWordData, example: e.target.value })}
                    />
                  </div>

                  {/* English Description */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">English Description (Optional)</label>
                    <textarea
                      placeholder="An explanation or definition of the word in English..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                      rows={2}
                      value={modalWordData.descriptionEN}
                      onChange={(e) => setModalWordData({ ...modalWordData, descriptionEN: e.target.value })}
                    />
                  </div>

                  {/* Synonyms */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Synonyms (Optional, comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. happy, joyful, cheerful"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                      value={modalWordData.synonyms}
                      onChange={(e) => setModalWordData({ ...modalWordData, synonyms: e.target.value })}
                    />
                  </div>

                  {/* Antonyms */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Antonyms (Optional, comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. sad, sorrowful, depressed"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                      value={modalWordData.antonyms}
                      onChange={(e) => setModalWordData({ ...modalWordData, antonyms: e.target.value })}
                    />
                  </div>

                  {/* Optional Note */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Note (Optional)</label>
                    <input
                      type="text"
                      placeholder="Context notes, collocations, word origins..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                      value={modalWordData.note}
                      onChange={(e) => setModalWordData({ ...modalWordData, note: e.target.value })}
                    />
                  </div>

                  {/* Word Illustration image upload */}
                  <div className="flex flex-col gap-1.5 bg-white p-4 rounded-2xl border border-slate-200">
                    <label className="text-xs font-semibold text-slate-700">Word Illustration Image</label>
                    <div className="flex gap-4 items-center mt-1">
                      {modalWordData.imageUrl ? (
                        <div className="relative">
                          <img
                            src={modalWordData.imageUrl}
                            alt="Word Preview"
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-3xs"
                          />
                          <button
                            onClick={() => setModalWordData({ ...modalWordData, imageUrl: "" })}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors shadow-3xs"
                          >
                            <span className="material-symbols-outlined text-[10px] leading-none font-bold">close</span>
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300">
                          <span className="material-symbols-outlined text-lg">image</span>
                        </div>
                      )}

                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setModalWordData(prev => ({ ...prev, imageSource: "upload" }))}
                            className={`px-3 py-1 text-[11px] font-bold rounded-md ${
                              modalWordData.imageSource === "upload" ? "bg-[#1000a3] text-white" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            File
                          </button>
                          <button
                            type="button"
                            onClick={() => setModalWordData(prev => ({ ...prev, imageSource: "url" }))}
                            className={`px-3 py-1 text-[11px] font-bold rounded-md ${
                              modalWordData.imageSource === "url" ? "bg-[#1000a3] text-white" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            URL
                          </button>
                        </div>

                        {modalWordData.imageSource === "upload" ? (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleModalWordImageFile}
                            className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 file:text-slate-600 hover:file:bg-slate-200 cursor-pointer"
                          />
                        ) : (
                          <input
                            type="text"
                            placeholder="Enter image URL..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                            value={modalWordData.imageUrl.startsWith("data:") ? "" : modalWordData.imageUrl}
                            onChange={(e) => setModalWordData({ ...modalWordData, imageUrl: e.target.value })}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* BATCH IMPORT TAB */
                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-[#8127cf]/5 border border-[#8127cf]/10 rounded-2xl flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[#8127cf] text-sm mt-0.5">info</span>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                      Upload a CSV file (exported from MinLish) or paste a raw list of English words separated by commas, semicolons, dashes, or newlines. We will automatically extract the words so you can auto-lookup their definitions.
                    </p>
                  </div>

                  {/* Drag and Drop CSV Zone */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Upload CSV File</label>
                    <div className="w-full p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-white hover:bg-slate-50/50 hover:border-slate-400 transition-colors flex flex-col items-center justify-center text-center relative cursor-pointer">
                      <span className="material-symbols-outlined text-slate-400 text-3xl mb-1">csv</span>
                      <span className="font-bold text-xs text-slate-700">
                        {csvFile ? csvFile.name : "Select or Drop CSV file here"}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">UTF-8 Encoded CSV format</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvFileSelection}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                  </div>

                  <div className="text-center text-xs font-semibold text-slate-400 my-0.5">— OR —</div>

                  {/* Raw Text copy-paste area */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Paste Raw English Text</label>
                    <textarea
                      placeholder="Enter English words here (e.g. serendipity, integrity, synergy or paste a paragraph/list)..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-sans leading-relaxed"
                      rows={6}
                      value={batchRawText}
                      onChange={handleRawTextChange}
                    />
                  </div>

                  {/* Batch preview items and Auto-Lookup triggers */}
                  {previewItems.length > 0 && (
                    <div className="flex flex-col gap-3 mt-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-100 gap-2">
                        <span className="font-bold text-xs text-slate-700 tracking-wide">
                          Parsed Preview ({previewItems.length} terms)
                        </span>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={handleBatchAutoLookup}
                            disabled={batchLookupLoading}
                            className="flex items-center justify-center gap-1.5 bg-blue-50 text-[#1000a3] hover:bg-blue-100/50 rounded-xl px-3 py-2 text-xs font-bold transition-all disabled:opacity-50 shadow-3xs"
                          >
                            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                            {batchLookupLoading ? "Lookup..." : "Auto-Lookup"}
                          </button>
                          <button
                            onClick={handleCleanUpPreview}
                            className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-bold transition-all shadow-3xs"
                          >
                            <span className="material-symbols-outlined text-[16px]">cleaning_services</span>
                            Clean Up
                          </button>
                        </div>
                      </div>

                      {/* Interactive Preview Table */}
                      <div className="max-h-60 overflow-y-auto mt-1 border border-slate-100 rounded-xl">
                        <table className="min-w-full text-left text-xs text-slate-700 bg-white">
                          <thead className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-100 sticky top-0 backdrop-blur-xs">
                            <tr>
                              <th className="px-4 py-2.5 w-1/3">Word</th>
                              <th className="px-4 py-2.5 w-1/3">Meaning</th>
                              <th className="px-4 py-2.5 text-center">Status</th>
                              <th className="px-4 py-2.5 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {previewItems.map((item, index) => {
                              const isDup = isDuplicateWord(item.word, item.id);
                              const isMissingMeaning = !item.meaning || !item.meaning.trim();
                              
                              let statusBadge = null;
                              if (isDup) {
                                statusBadge = (
                                  <span className="inline-flex items-center gap-0.5 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                                    <span className="material-symbols-outlined text-[10px]">warning</span>
                                    Duplicate
                                  </span>
                                );
                              } else if (isMissingMeaning) {
                                statusBadge = (
                                  <span className="inline-flex items-center gap-0.5 bg-amber-50 border border-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                                    <span className="material-symbols-outlined text-[10px]">help_center</span>
                                    No Meaning
                                  </span>
                                );
                              } else {
                                statusBadge = (
                                  <span className="inline-flex items-center gap-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                                    <span className="material-symbols-outlined text-[10px]">check_circle</span>
                                    Ready
                                  </span>
                                );
                              }

                              return (
                                <tr key={item.id} className={`${isDup ? "bg-rose-50/20" : isMissingMeaning ? "bg-amber-50/10" : ""} hover:bg-slate-50/30 transition-colors`}>
                                  <td className="px-4 py-2">
                                    <input
                                      type="text"
                                      value={item.word}
                                      disabled={isDup}
                                      onChange={(e) => {
                                        const updated = [...previewItems];
                                        updated[index] = {
                                          ...item,
                                          word: e.target.value,
                                          isValid: e.target.value.trim().length > 0 && item.meaning.trim().length > 0
                                        };
                                        setPreviewItems(updated);
                                      }}
                                      className={`bg-transparent border-none p-1 focus:ring-1 focus:ring-[#1000a3]/20 focus:bg-white rounded w-full font-semibold ${isDup ? "text-slate-400 cursor-not-allowed" : ""}`}
                                    />
                                  </td>
                                  <td className="px-4 py-2">
                                    <input
                                      type="text"
                                      placeholder={isDup ? "Duplicate term, will be skipped" : "Type meaning or click Auto-Lookup"}
                                      value={item.meaning}
                                      disabled={isDup}
                                      onChange={(e) => {
                                        const updated = [...previewItems];
                                        updated[index] = {
                                          ...item,
                                          meaning: e.target.value,
                                          isValid: item.word.trim().length > 0 && e.target.value.trim().length > 0
                                        };
                                        setPreviewItems(updated);
                                      }}
                                      className={`bg-transparent border-none p-1 focus:ring-1 focus:ring-[#1000a3]/20 focus:bg-white rounded w-full ${
                                        item.meaning ? "" : "text-amber-600 placeholder-amber-300 font-medium"
                                      } ${isDup ? "text-slate-400 cursor-not-allowed" : ""}`}
                                    />
                                  </td>
                                  <td className="px-4 py-2 text-center select-none">
                                    {statusBadge}
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {isMissingMeaning && !isDup && (
                                        <button
                                          onClick={() => handleSingleBatchLookup(index)}
                                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded-lg transition-colors flex items-center justify-center"
                                          title="Tra cứu từ điển"
                                        >
                                          <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                                        </button>
                                      )}
                                      <button
                                        onClick={() => setPreviewItems(previewItems.filter(p => p.id !== item.id))}
                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors flex items-center justify-center"
                                        title="Exclude"
                                      >
                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 rounded-full text-xs font-semibold text-slate-500 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>

              {activeTab === "single" ? (
                <button
                  onClick={handleSaveWordFromModal}
                  className={`px-6 py-2 rounded-full text-xs font-semibold hover:shadow-lg transition-all ${
                    existingWordInDraft
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "bg-[#1000a3] text-white"
                  }`}
                >
                  {existingWordInDraft ? "Word already exists. Edit it?" : (modalMode === "add" ? "Add Word" : "Save Changes")}
                </button>
              ) : (
                <button
                  onClick={handleImportParsedItems}
                  disabled={previewItems.length === 0}
                  className="px-6 py-2 bg-[#1000a3] text-white rounded-full text-xs font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Import {previewItems.filter(p => p.isValid).length} Terms
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

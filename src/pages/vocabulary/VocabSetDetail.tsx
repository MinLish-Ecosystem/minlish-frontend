import React, { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronRight, Brain, CheckCircle, Hourglass, Edit3, Plus, Trash2, Play } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { clearCurrentSet, fetchSetDetail, type Word as VocabWord } from "../../store/slices/vocabSlice";
import WordCard, { WordStatus } from "../../components/features/vocabulary/WordCard";
import { EmptyState, TextField } from "../../components/common";
import api from "../../lib/api";
import { toast } from "react-hot-toast";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";

const mapWordStatus = (status?: VocabWord["status"]): WordStatus => {
  switch (status) {
    case "learning":
      return "Learning";
    case "mastered":
      return "Mastered";
    case "new":
    default:
      return "New";
  }
};

export default function VocabSetDetail() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentSet, currentSetWords, currentSetLoading } = useSelector((state: RootState) => state.vocab);
  const [showEdit, setShowEdit] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [activeTab, setActiveTab] = useState<"single" | "batch">("single");
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [savingSet, setSavingSet] = useState(false);
  const [addingWord, setAddingWord] = useState(false);
  const [updatingWord, setUpdatingWord] = useState(false);
  const [deletingSet, setDeletingSet] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "General",
    level: "Intermediate",
    colorTheme: "blue",
    isPublic: false,
  });

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

  // Helper to parse Dictionary API entry
  const parseDictionaryEntry = (data: any) => {
    if (!Array.isArray(data) || data.length === 0) return null;
    const entry = data[0];
    const meanings = entry.meanings || [];
    
    const firstMeaning = meanings[0];
    const pos = firstMeaning?.partOfSpeech || "noun";
    const firstDef = firstMeaning?.definitions?.[0]?.definition || "";
    
    const descriptionEN = meanings[0]?.definitions[1]?.definition || 
                          meanings[1]?.definitions[0]?.definition || 
                          firstDef || "";
    
    const phonetic = entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || "";
    
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
    
    let audioUrl = "";
    if (entry.phonetics && Array.isArray(entry.phonetics)) {
      const audioPhonetics = entry.phonetics.filter((p: any) => p.audio && typeof p.audio === "string" && p.audio.length > 0);
      if (audioPhonetics.length > 0) {
        const usAudio = audioPhonetics.find((p: any) => p.audio.toLowerCase().includes("-us.mp3"));
        const ukAudio = audioPhonetics.find((p: any) => p.audio.toLowerCase().includes("-uk.mp3"));
        audioUrl = usAudio?.audio || ukAudio?.audio || audioPhonetics[0].audio;
      }
    }
    
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
    setEditingWordId(null);
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

  const openEditWordModal = (word: VocabWord) => {
    setModalMode("edit");
    setActiveTab("single");
    setEditingWordId(word.id);
    setModalWordData({
      word: word.word || "",
      pronunciation: word.pronunciation || "",
      partOfSpeech: word.partOfSpeech || "noun",
      meaning: word.meaning || "",
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

  useEffect(() => {
    if (setId) {
      dispatch(fetchSetDetail(setId));
    }

    return () => {
      dispatch(clearCurrentSet());
    };
  }, [setId, dispatch]);

  useEffect(() => {
    if (!currentSet) return;

    setEditForm({
      name: currentSet.name,
      description: currentSet.description || "",
      category: currentSet.category,
      level: currentSet.level,
      colorTheme: currentSet.colorTheme,
      isPublic: currentSet.isPublic,
    });
  }, [currentSet]);

  const wordsCount = currentSet?.totalWords ?? currentSetWords.length;
  const masteredCount = currentSetWords.filter((word) => mapWordStatus(word.status) === "Mastered").length;
  const learningCount = currentSetWords.filter((word) => mapWordStatus(word.status) === "Learning").length;

  // Lazy-load word cards — show 12 first, load more as the user scrolls
  const { visibleItems: visibleWords, sentinelRef: wordSentinelRef, hasMore: hasMoreWords } = useInfiniteScroll(currentSetWords, 12, []);

  const splitList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

  const handleUpdateSet = async () => {
    if (!setId) return;
    if (!editForm.name.trim()) {
      toast.error("Set name is required");
      return;
    }

    setSavingSet(true);
    try {
      await api.put(`/api/v1/vocab/sets/${setId}`, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        category: editForm.category,
        level: editForm.level,
        colorTheme: editForm.colorTheme,
        isPublic: editForm.isPublic,
      });
      await dispatch(fetchSetDetail(setId));
      toast.success("Set updated!");
      setShowEdit(false);
    } catch {
      toast.error("Failed to update set. Try again.");
    } finally {
      setSavingSet(false);
    }
  };

  const handleDeleteSet = async () => {
    if (!setId) return;
    const ok = window.confirm(
      `Are you sure you want to delete "${currentSet?.name}"? This will permanently delete all ${wordsCount} words inside. This action cannot be undone.`
    );
    if (!ok) return;
    setDeletingSet(true);
    try {
      await api.delete(`/api/v1/vocab/sets/${setId}`);
      toast.success("Set deleted successfully");
      navigate("/vocabulary");
    } catch {
      toast.error("Failed to delete set. Try again.");
    } finally {
      setDeletingSet(false);
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
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(lookup)}`);
      if (!res.ok) {
        throw new Error("Word not found in dictionary");
      }
      const data = await res.json();
      const details = parseDictionaryEntry(data);
      if (details) {
        setModalWordData((prev) => ({
          ...prev,
          meaning: details.meaning,
          partOfSpeech: details.partOfSpeech,
          pronunciation: details.pronunciation,
          example: details.example,
          audioUrl: details.audioUrl,
          descriptionEN: details.descriptionEN,
          synonyms: details.synonyms.join(", "),
          antonyms: details.antonyms.join(", ")
        }));
        toast.success("Dictionary details auto-filled!");
      } else {
        toast.error("Could not parse dictionary details");
      }
    } catch (err) {
      toast.error("Could not find dictionary details for this word");
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

  // Save changes from word editor modal back to DB
  const handleSaveWordFromModal = async () => {
    if (!modalWordData.word.trim()) {
      toast.error("Word is required");
      return;
    }

    const normalizedWord = modalWordData.word.trim().toLowerCase();
    const existing = currentSetWords.find(
      (w) => w.id !== editingWordId && w.word.trim().toLowerCase() === normalizedWord
    );

    if (existing) {
      setEditingWordId(existing.id);
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
      setAddingWord(true);
      try {
        await api.post(`/api/v1/vocab/sets/${setId}/words`, {
          word: modalWordData.word.trim(),
          meaning: modalWordData.meaning.trim(),
          pronunciation: modalWordData.pronunciation.trim() || undefined,
          partOfSpeech: modalWordData.partOfSpeech,
          examples: modalWordData.example.trim() ? [modalWordData.example.trim()] : undefined,
          note: modalWordData.note.trim() || undefined,
          imageUrl: modalWordData.imageUrl || undefined,
          audioUrl: modalWordData.audioUrl || undefined,
          synonyms: parsedSynonyms,
          antonyms: parsedAntonyms,
          descriptionEN: modalWordData.descriptionEN.trim() || undefined
        });
        await dispatch(fetchSetDetail(setId!));
        toast.success("Word added to this set!");
        setShowModal(false);
      } catch (err) {
        toast.error("Failed to add word. Try again.");
      } finally {
        setAddingWord(false);
      }
    } else if (modalMode === "edit" && editingWordId) {
      setUpdatingWord(true);
      try {
        await api.put(`/api/v1/vocab/sets/${setId}/words/${editingWordId}`, {
          word: modalWordData.word.trim(),
          meaning: modalWordData.meaning.trim(),
          pronunciation: modalWordData.pronunciation.trim() || undefined,
          partOfSpeech: modalWordData.partOfSpeech,
          examples: modalWordData.example.trim() ? [modalWordData.example.trim()] : undefined,
          note: modalWordData.note.trim() || undefined,
          imageUrl: modalWordData.imageUrl || undefined,
          audioUrl: modalWordData.audioUrl || undefined,
          synonyms: parsedSynonyms,
          antonyms: parsedAntonyms,
          descriptionEN: modalWordData.descriptionEN.trim() || undefined
        });
        await dispatch(fetchSetDetail(setId!));
        toast.success("Word updated successfully!");
        setShowModal(false);
        setEditingWordId(null);
      } catch (err) {
        toast.error("Failed to update word. Try again.");
      } finally {
        setUpdatingWord(false);
      }
    }
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
    setBatchRawText(e.target.value);
    parseAndSetPreview(e.target.value, "text");
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

  const handleBatchAutoLookup = async () => {
    if (previewItems.length === 0) return;
    setBatchLookupLoading(true);
    let successCount = 0;
    let failedCount = 0;

    const updated = [...previewItems];
    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      if (!item.meaning || item.meaning.trim() === "") {
        try {
          const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(item.word.trim())}`);
          if (res.ok) {
            const data = await res.json();
            const details = parseDictionaryEntry(data);
            if (details) {
              updated[i] = {
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
              successCount++;
            } else {
              failedCount++;
            }
          } else {
            failedCount++;
          }
        } catch (e) {
          failedCount++;
        }
      }
    }

    setPreviewItems(updated);
    setBatchLookupLoading(false);
    toast.success(`Batch dictionary lookup: ${successCount} words filled, ${failedCount} failed.`);
  };

  // Helper to check if a word is duplicate in currentSetWords or within preview
  const isDuplicateWord = (word: string, currentId: string) => {
    const normalized = word.trim().toLowerCase();
    if (!normalized) return false;
    
    const existsInSet = currentSetWords.some(w => w.word.trim().toLowerCase() === normalized);
    if (existsInSet) return true;
    
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
    const existingWords = currentSetWords.map(w => w.word.trim().toLowerCase());
    
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

  // Confirm import items from batch tab into set
  const handleImportParsedItems = async () => {
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

    setAddingWord(true);
    try {
      const addPromises = uniqueValidItems.map(item => api.post(`/api/v1/vocab/sets/${setId}/words`, {
        word: item.word.trim(),
        meaning: item.meaning.trim(),
        pronunciation: item.pronunciation || undefined,
        partOfSpeech: item.partOfSpeech || "noun",
        examples: item.example?.trim() ? [item.example.trim()] : undefined,
        note: item.note || undefined,
        imageUrl: "",
        audioUrl: item.audioUrl || undefined,
        synonyms: item.synonyms || [],
        antonyms: item.antonyms || [],
        descriptionEN: item.descriptionEN || ""
      }));

      await Promise.all(addPromises);
      await dispatch(fetchSetDetail(setId!));
      if (skippedCount > 0) {
        toast.success(`Imported ${uniqueValidItems.length} terms, skipped ${skippedCount} duplicate(s).`);
      } else {
        toast.success(`Imported ${uniqueValidItems.length} terms successfully!`);
      }
      setShowModal(false);
    } catch {
      toast.error("Failed to import some terms. Try again.");
    } finally {
      setAddingWord(false);
    }
  };

  const handleDeleteWord = async (wordId: string) => {
    if (!setId) return;
    const ok = window.confirm("Delete this word? This action cannot be undone.");
    if (!ok) return;

    try {
      await api.delete(`/api/v1/vocab/sets/${setId}/words/${wordId}`);
      await dispatch(fetchSetDetail(setId));
      toast.success("Word deleted");
    } catch {
      toast.error("Failed to delete word. Try again.");
    }
  };

  if (currentSetLoading || (setId && !currentSet)) {
    return <div className="max-w-7xl mx-auto pb-12 text-slate-400">Loading set...</div>;
  }

  if (!currentSet) {
    return (
      <div className="max-w-7xl mx-auto pb-12">
        <EmptyState
          title="Set not found"
          description="The requested vocabulary set could not be loaded."
        />
      </div>
    );
  }
  const modalWordNormalized = modalWordData.word.trim().toLowerCase();
  const existingWordInSet = modalWordNormalized
    ? currentSetWords.find(w => w.id !== editingWordId && w.word.trim().toLowerCase() === modalWordNormalized)
    : null;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-slate-500 mb-6 text-sm font-semibold">
        <Link to="/vocabulary" className="hover:text-purple-600 transition-colors">My Library</Link>
        <ChevronRight className="w-4 h-4 mx-1" />
        <Link to="/vocabulary" className="hover:text-purple-600 transition-colors">Sets</Link>
        <ChevronRight className="w-4 h-4 mx-1" />
        <span className="text-slate-800">{currentSet.name}</span>
      </nav>

      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between border border-slate-200">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">{currentSet.name}</h2>
          <p className="text-base text-slate-500 mb-4 md:mb-0">
            {currentSet.description || "Master essential vocabulary in this set."}
          </p>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Brain className="text-cyan-500 w-5 h-5" />
              <span className="text-sm font-semibold text-slate-800">{wordsCount} Words</span>
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-emerald-500 w-5 h-5" />
              <span className="text-sm font-semibold text-slate-800">{masteredCount} Mastered</span>
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <Hourglass className="text-amber-500 w-5 h-5" />
              <span className="text-sm font-semibold text-slate-800">{learningCount} Learning</span>
            </div>
          </div>
        </div>

        <div className="mt-6 md:mt-0 flex flex-col gap-3">
          {/* Start Learning — Primary CTA */}
          <button
            onClick={() => navigate(`/learn/${setId}`)}
            disabled={wordsCount === 0}
            className="w-full px-6 py-3 rounded-2xl text-base font-extrabold text-white shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-[1.03] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-violet-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0"
          >
            <Play className="w-5 h-5 fill-white" />
            Start Learning
          </button>

          {/* Secondary Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => openAddWordModal()}
              className="flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Word
            </button>
            <button
              onClick={() => navigate(`/vocabulary/${setId}/edit`)}
              className="flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold text-purple-600 border-2 border-purple-200 hover:bg-purple-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Edit3 className="w-4 h-4" />
              Edit Set
            </button>
            <button
              onClick={handleDeleteSet}
              disabled={deletingSet}
              className="flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-400 border-2 border-rose-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {deletingSet ? "..." : "Delete"}
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid List */}
      {currentSetWords.length === 0 ? (
        <EmptyState
          title="No words in this set"
          description="Add the first word to start building this vocabulary set."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleWords.map((word) => (
            <WordCard
              key={word.id}
              term={word.word}
              pronunciation={word.pronunciation || ""}
              definition={word.meaning}
              status={mapWordStatus(word.status)}
              audioUrl={word.audioUrl}
              onEdit={() => openEditWordModal(word)}
              onDelete={() => handleDeleteWord(word.id)}
            />
          ))}
          {/* Sentinel for infinite scroll */}
          {hasMoreWords && <div ref={wordSentinelRef} className="col-span-full h-4" />}
        </div>
      )}

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Edit Set</h3>
                <p className="text-sm text-slate-500 mt-1">Update the set information and visibility.</p>
              </div>
              <button onClick={() => setShowEdit(false)} className="text-slate-400 hover:text-slate-700 text-sm font-semibold" type="button">
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                id="edit-set-name"
                label="Set Name"
                value={editForm.name}
                onChange={(value) => setEditForm((prev) => ({ ...prev, name: value }))}
                placeholder="Business English"
                required
              />
              <div className="space-y-2">
                <label htmlFor="edit-set-category" className="text-sm font-semibold text-slate-700">Category</label>
                <select
                  id="edit-set-category"
                  value={editForm.category}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all"
                >
                  {['General', 'Business', 'IELTS', 'TOEIC', 'Travel', 'Technology', 'Academic', 'Psychology', 'Science', 'Other'].map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-set-level" className="text-sm font-semibold text-slate-700">Level</label>
                <select
                  id="edit-set-level"
                  value={editForm.level}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, level: e.target.value }))}
                  className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all"
                >
                  {['Beginner', 'Intermediate', 'Advanced', 'Academic'].map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-set-theme" className="text-sm font-semibold text-slate-700">Color Theme</label>
                <select
                  id="edit-set-theme"
                  value={editForm.colorTheme}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, colorTheme: e.target.value }))}
                  className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all"
                >
                  {['blue', 'emerald', 'amber', 'purple', 'rose', 'cyan'].map((theme) => (
                    <option key={theme} value={theme}>
                      {theme}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label htmlFor="edit-set-description" className="text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  id="edit-set-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all resize-none"
                />
              </div>

              <label className="md:col-span-2 flex items-center gap-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={editForm.isPublic}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, isPublic: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-200"
                />
                Public set
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateSet}
                disabled={savingSet}
                className="px-5 py-2 rounded-lg bg-linear-to-r from-purple-500 to-indigo-600 text-white font-semibold hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                {savingSet ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                    {existingWordInSet && (
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
                  disabled={addingWord || updatingWord}
                  className={`px-6 py-2 rounded-full text-xs font-semibold hover:shadow-lg transition-all disabled:opacity-50 ${
                    existingWordInSet
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "bg-[#1000a3] text-white"
                  }`}
                >
                  {addingWord || updatingWord
                    ? "Saving..."
                    : existingWordInSet
                    ? "Word already exists. Edit it?"
                    : modalMode === "add"
                    ? "Add Word"
                    : "Save Changes"}
                </button>
              ) : (
                <button
                  onClick={handleImportParsedItems}
                  disabled={previewItems.length === 0 || addingWord}
                  className="px-6 py-2 bg-[#1000a3] text-white rounded-full text-xs font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingWord ? "Importing..." : `Import ${previewItems.filter(p => p.isValid).length} Terms`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

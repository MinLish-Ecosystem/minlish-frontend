import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Brain, CheckCircle, Hourglass, Edit3, Plus } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { clearCurrentSet, fetchSetDetail, type Word as VocabWord } from "../../store/slices/vocabSlice";
import WordCard, { WordStatus } from "../../components/features/vocabulary/WordCard";
import { EmptyState, TextField } from "../../components/common";
import api from "../../lib/api";
import { toast } from "react-hot-toast";

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
  const dispatch = useDispatch<AppDispatch>();
  const { currentSet, currentSetWords, currentSetLoading } = useSelector((state: RootState) => state.vocab);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddWord, setShowAddWord] = useState(false);
  const [showEditWord, setShowEditWord] = useState(false);
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [savingSet, setSavingSet] = useState(false);
  const [addingWord, setAddingWord] = useState(false);
  const [updatingWord, setUpdatingWord] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "General",
    level: "Intermediate",
    colorTheme: "blue",
    isPublic: false,
  });
  const [wordForm, setWordForm] = useState({
    word: "",
    pronunciation: "",
    partOfSpeech: "",
    meaning: "",
    descriptionEN: "",
    examples: "",
    synonyms: "",
    antonyms: "",
    collocations: "",
    note: "",
    imageUrl: "",
    audioUrl: "",
  });

  const openEditWord = (word: VocabWord) => {
    setEditingWordId(word.id);
    setWordForm({
      word: word.word || "",
      pronunciation: word.pronunciation || "",
      partOfSpeech: word.partOfSpeech || "",
      meaning: word.meaning || "",
      descriptionEN: word.descriptionEN || "",
      examples: (word.examples || []).join(", "),
      synonyms: (word.synonyms || []).join(", "),
      antonyms: (word.antonyms || []).join(", "),
      collocations: (word.collocations || []).join(", "),
      note: word.note || "",
      imageUrl: word.imageUrl || "",
      audioUrl: word.audioUrl || "",
    });
    setShowEditWord(true);
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

  const handleAddWord = async () => {
    if (!setId) return;
    if (!wordForm.word.trim() || !wordForm.meaning.trim()) {
      toast.error("Word and meaning are required");
      return;
    }

    setAddingWord(true);
    try {
      await api.post(`/api/v1/vocab/sets/${setId}/words`, {
        word: wordForm.word.trim(),
        pronunciation: wordForm.pronunciation.trim() || undefined,
        partOfSpeech: wordForm.partOfSpeech.trim() || undefined,
        meaning: wordForm.meaning.trim(),
        descriptionEN: wordForm.descriptionEN.trim() || undefined,
        examples: splitList(wordForm.examples),
        synonyms: splitList(wordForm.synonyms),
        antonyms: splitList(wordForm.antonyms),
        collocations: splitList(wordForm.collocations),
        note: wordForm.note.trim() || undefined,
        imageUrl: wordForm.imageUrl.trim() || undefined,
        audioUrl: wordForm.audioUrl.trim() || undefined,
      });

      await dispatch(fetchSetDetail(setId));
      toast.success("Word added!");
      setShowAddWord(false);
      setWordForm({
        word: "",
        pronunciation: "",
        partOfSpeech: "",
        meaning: "",
        descriptionEN: "",
        examples: "",
        synonyms: "",
        antonyms: "",
        collocations: "",
        note: "",
        imageUrl: "",
        audioUrl: "",
      });
    } catch {
      toast.error("Failed to add word. Try again.");
    } finally {
      setAddingWord(false);
    }
  };

  const handleUpdateWord = async () => {
    if (!setId || !editingWordId) return;
    if (!wordForm.word.trim() || !wordForm.meaning.trim()) {
      toast.error("Word and meaning are required");
      return;
    }

    setUpdatingWord(true);
    try {
      await api.put(`/api/v1/vocab/sets/${setId}/words/${editingWordId}`, {
        word: wordForm.word.trim(),
        pronunciation: wordForm.pronunciation.trim() || undefined,
        partOfSpeech: wordForm.partOfSpeech.trim() || undefined,
        meaning: wordForm.meaning.trim(),
        descriptionEN: wordForm.descriptionEN.trim() || undefined,
        examples: splitList(wordForm.examples),
        synonyms: splitList(wordForm.synonyms),
        antonyms: splitList(wordForm.antonyms),
        collocations: splitList(wordForm.collocations),
        note: wordForm.note.trim() || undefined,
        imageUrl: wordForm.imageUrl.trim() || undefined,
        audioUrl: wordForm.audioUrl.trim() || undefined,
      });

      await dispatch(fetchSetDetail(setId));
      toast.success("Word updated!");
      setShowEditWord(false);
      setEditingWordId(null);
    } catch {
      toast.error("Failed to update word. Try again.");
    } finally {
      setUpdatingWord(false);
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

        <div className="mt-6 md:mt-0 flex gap-3">
          <button
            onClick={() => setShowEdit(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-purple-600 border-2 border-purple-500 hover:bg-purple-50 transition-colors flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Edit Set
          </button>
          <button
            onClick={() => setShowAddWord(true)}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.05] hover:-translate-y-1 flex items-center gap-2 bg-linear-to-r from-purple-500 to-indigo-600"
          >
            <Plus className="w-4 h-4" />
            Add Word
          </button>
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
          {currentSetWords.map((word) => (
            <WordCard
              key={word.id}
              term={word.word}
              pronunciation={word.pronunciation || ""}
              definition={word.meaning}
              status={mapWordStatus(word.status)}
              onEdit={() => openEditWord(word)}
              onDelete={() => handleDeleteWord(word.id)}
            />
          ))}
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

      {showAddWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Add Word</h3>
                <p className="text-sm text-slate-500 mt-1">Add a new word to this vocabulary set.</p>
              </div>
              <button onClick={() => setShowAddWord(false)} className="text-slate-400 hover:text-slate-700 text-sm font-semibold" type="button">
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                id="word-word"
                label="Word"
                value={wordForm.word}
                onChange={(value) => setWordForm((prev) => ({ ...prev, word: value }))}
                placeholder="Synergy"
                required
              />
              <TextField
                id="word-meaning"
                label="Meaning"
                value={wordForm.meaning}
                onChange={(value) => setWordForm((prev) => ({ ...prev, meaning: value }))}
                placeholder="The interaction of parts..."
                required
              />
              <TextField
                id="word-pronunciation"
                label="Pronunciation"
                value={wordForm.pronunciation}
                onChange={(value) => setWordForm((prev) => ({ ...prev, pronunciation: value }))}
                placeholder="/ˈsɪnərdʒi/"
              />
              <TextField
                id="word-pos"
                label="Part of Speech"
                value={wordForm.partOfSpeech}
                onChange={(value) => setWordForm((prev) => ({ ...prev, partOfSpeech: value }))}
                placeholder="noun"
              />
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="word-description" className="text-sm font-semibold text-slate-700">English Description</label>
                <textarea
                  id="word-description"
                  value={wordForm.descriptionEN}
                  onChange={(e) => setWordForm((prev) => ({ ...prev, descriptionEN: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all resize-none"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="word-examples" className="text-sm font-semibold text-slate-700">Examples</label>
                <textarea
                  id="word-examples"
                  value={wordForm.examples}
                  onChange={(e) => setWordForm((prev) => ({ ...prev, examples: e.target.value }))}
                  rows={3}
                  placeholder="Use commas to separate examples"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all resize-none"
                />
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <TextField
                  id="word-synonyms"
                  label="Synonyms"
                  value={wordForm.synonyms}
                  onChange={(value) => setWordForm((prev) => ({ ...prev, synonyms: value }))}
                  placeholder="collaboration, cooperation"
                />
                <TextField
                  id="word-antonyms"
                  label="Antonyms"
                  value={wordForm.antonyms}
                  onChange={(value) => setWordForm((prev) => ({ ...prev, antonyms: value }))}
                  placeholder="isolation"
                />
                <TextField
                  id="word-collocations"
                  label="Collocations"
                  value={wordForm.collocations}
                  onChange={(value) => setWordForm((prev) => ({ ...prev, collocations: value }))}
                  placeholder="build synergy"
                />
              </div>
              <TextField
                id="word-note"
                label="Note"
                value={wordForm.note}
                onChange={(value) => setWordForm((prev) => ({ ...prev, note: value }))}
                placeholder="Helpful reminder or memory trick"
                containerClassName="md:col-span-2"
              />
              <TextField
                id="word-image"
                label="Image URL"
                value={wordForm.imageUrl}
                onChange={(value) => setWordForm((prev) => ({ ...prev, imageUrl: value }))}
                placeholder="https://..."
              />
              <TextField
                id="word-audio"
                label="Audio URL"
                value={wordForm.audioUrl}
                onChange={(value) => setWordForm((prev) => ({ ...prev, audioUrl: value }))}
                placeholder="https://..."
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddWord(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddWord}
                disabled={addingWord}
                className="px-5 py-2 rounded-lg bg-linear-to-r from-purple-500 to-indigo-600 text-white font-semibold hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                {addingWord ? "Adding..." : "Add Word"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showEditWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Edit Word</h3>
                <p className="text-sm text-slate-500 mt-1">Update the word details for this set.</p>
              </div>
              <button onClick={() => { setShowEditWord(false); setEditingWordId(null); }} className="text-slate-400 hover:text-slate-700 text-sm font-semibold" type="button">
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                id="edit-word-word"
                label="Word"
                value={wordForm.word}
                onChange={(value) => setWordForm((prev) => ({ ...prev, word: value }))}
                placeholder="Synergy"
                required
              />
              <TextField
                id="edit-word-meaning"
                label="Meaning"
                value={wordForm.meaning}
                onChange={(value) => setWordForm((prev) => ({ ...prev, meaning: value }))}
                placeholder="The interaction of parts..."
                required
              />
              <TextField
                id="edit-word-pronunciation"
                label="Pronunciation"
                value={wordForm.pronunciation}
                onChange={(value) => setWordForm((prev) => ({ ...prev, pronunciation: value }))}
                placeholder="/ˈsɪnərdʒi/"
              />
              <TextField
                id="edit-word-pos"
                label="Part of Speech"
                value={wordForm.partOfSpeech}
                onChange={(value) => setWordForm((prev) => ({ ...prev, partOfSpeech: value }))}
                placeholder="noun"
              />
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="edit-word-description" className="text-sm font-semibold text-slate-700">English Description</label>
                <textarea
                  id="edit-word-description"
                  value={wordForm.descriptionEN}
                  onChange={(e) => setWordForm((prev) => ({ ...prev, descriptionEN: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all resize-none"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="edit-word-examples" className="text-sm font-semibold text-slate-700">Examples</label>
                <textarea
                  id="edit-word-examples"
                  value={wordForm.examples}
                  onChange={(e) => setWordForm((prev) => ({ ...prev, examples: e.target.value }))}
                  rows={3}
                  placeholder="Use commas to separate examples"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all resize-none"
                />
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <TextField
                  id="edit-word-synonyms"
                  label="Synonyms"
                  value={wordForm.synonyms}
                  onChange={(value) => setWordForm((prev) => ({ ...prev, synonyms: value }))}
                  placeholder="collaboration, cooperation"
                />
                <TextField
                  id="edit-word-antonyms"
                  label="Antonyms"
                  value={wordForm.antonyms}
                  onChange={(value) => setWordForm((prev) => ({ ...prev, antonyms: value }))}
                  placeholder="isolation"
                />
                <TextField
                  id="edit-word-collocations"
                  label="Collocations"
                  value={wordForm.collocations}
                  onChange={(value) => setWordForm((prev) => ({ ...prev, collocations: value }))}
                  placeholder="build synergy"
                />
              </div>
              <TextField
                id="edit-word-note"
                label="Note"
                value={wordForm.note}
                onChange={(value) => setWordForm((prev) => ({ ...prev, note: value }))}
                placeholder="Helpful reminder or memory trick"
                containerClassName="md:col-span-2"
              />
              <TextField
                id="edit-word-image"
                label="Image URL"
                value={wordForm.imageUrl}
                onChange={(value) => setWordForm((prev) => ({ ...prev, imageUrl: value }))}
                placeholder="https://..."
              />
              <TextField
                id="edit-word-audio"
                label="Audio URL"
                value={wordForm.audioUrl}
                onChange={(value) => setWordForm((prev) => ({ ...prev, audioUrl: value }))}
                placeholder="https://..."
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowEditWord(false); setEditingWordId(null); }}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateWord}
                disabled={updatingWord}
                className="px-5 py-2 rounded-lg bg-linear-to-r from-purple-500 to-indigo-600 text-white font-semibold hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                {updatingWord ? "Updating..." : "Update Word"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

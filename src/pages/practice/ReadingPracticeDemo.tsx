import React, { useState } from "react";
import ReadingPractice from "../../components/features/reading/ReadingPractice";
import type { ReadingQuestion, QuestionResult } from "../../components/features/reading/types";
import { BookOpen, ListChecks, FileText, PlusCircle } from "lucide-react";

// ─── Sample Questions Data ────────────────────────────────────────────────────────

const sampleQuestions: ReadingQuestion[] = [
  // ── Dạng 1: Short Sentence MCQ ──
  {
    id: "q1",
    type: "short-sentence-mcq",
    sentence: "The quick brown ___blank___ jumps over the lazy dog.",
    questionNumber: 1,
    options: [
      { id: "fox", text: "fox" },
      { id: "cat", text: "cat" },
      { id: "dog", text: "dog" },
      { id: "bird", text: "bird" },
    ],
    correctAnswer: "fox",
    explanation: "This is a pangram - a sentence that contains every letter of the English alphabet at least once. The correct word is 'fox'.",
  },
  {
    id: "q2",
    type: "short-sentence-mcq",
    sentence: "She ___blank___ to the store yesterday afternoon.",
    questionNumber: 2,
    options: [
      { id: "go", text: "go" },
      { id: "goes", text: "goes" },
      { id: "went", text: "went" },
      { id: "going", text: "going" },
    ],
    correctAnswer: "went",
    explanation: "The sentence is in past tense (yesterday), so we need the past form 'went' instead of 'go' or 'goes'.",
  },

  // ── Dạng 2: Main Idea MCQ ──
  {
    id: "q3",
    type: "main-idea-mcq",
    title: "Passage A",
    passage: `Climate change is one of the most pressing challenges facing humanity today. Rising global temperatures have led to melting ice caps, rising sea levels, and increasingly extreme weather events. Scientists worldwide agree that human activities, particularly the burning of fossil fuels, are the primary cause of this environmental crisis. Governments and corporations are being pressured to adopt greener practices and invest in renewable energy sources. While some progress has been made, much more needs to be done to mitigate the worst effects of climate change. The future of our planet depends on the actions we take today.`,
    question: "What is the main idea of this passage?",
    options: [
      {
        id: "a",
        text: "Climate change is caused by natural cycles in Earth's history.",
      },
      {
        id: "b",
        text: "Climate change is a serious problem driven by human activity, requiring urgent action.",
      },
      {
        id: "c",
        text: "Renewable energy is the only solution to climate change.",
      },
      {
        id: "d",
        text: "Governments should ban all fossil fuel use immediately.",
      },
    ],
    correctAnswer: "b",
    explanation: "The passage discusses the causes and effects of climate change, emphasizing that human activities are the primary driver and that urgent action is needed. Options A, C, and D are either incorrect or too narrow.",
  },
  {
    id: "q4",
    type: "main-idea-mcq",
    title: "Passage B",
    passage: `The invention of the smartphone has revolutionized the way we communicate and access information. What started as a device for making phone calls has evolved into a powerful mini-computer that fits in our pockets. Today, people use smartphones for everything from banking and shopping to navigation and entertainment. However, this constant connectivity comes with challenges, including concerns about privacy, screen addiction, and the impact on face-to-face social interactions. Despite these drawbacks, the smartphone remains an indispensable tool for millions of people worldwide.`,
    question: "What is the author's main purpose in this passage?",
    options: [
      {
        id: "a",
        text: "To argue that smartphones should be banned.",
      },
      {
        id: "b",
        text: "To describe how smartphones have transformed daily life while acknowledging their downsides.",
      },
      {
        id: "c",
        text: "To explain the technical specifications of smartphones.",
      },
      {
        id: "d",
        text: "To compare smartphones with traditional mobile phones.",
      },
    ],
    correctAnswer: "b",
    explanation: "The author presents both the benefits (revolutionizing communication, convenience) and the drawbacks (privacy, addiction, social impact) of smartphones, giving a balanced view of their role in modern life.",
  },

  // ── Dạng 3: Word Bank Fill ──
  {
    id: "q5",
    type: "word-bank-fill",
    passage: `Artificial Intelligence (AI) is rapidly transforming our world. {{blank_1}} to recent advances in machine learning, computers can now perform tasks that once seemed impossible. From voice assistants to autonomous vehicles, AI is becoming increasingly integrated into our {{blank_2}}. However, this raises important questions about privacy, job displacement, and the ethical use of {{blank_3}}.

    Despite these challenges, many experts believe that the benefits of AI outweigh the risks. The technology has the potential to revolutionize healthcare, education, and environmental protection. As we continue to develop AI, it is crucial that we do so responsibly and with careful consideration of its impact on society.`,
    wordOptions: ["technology", "technology", "society", "data", "Thanks", "Due", "daily lives", "world"],
    correctMapping: {
      blank_1: "Thanks",
      blank_2: "daily lives",
      blank_3: "technology",
    },
    explanation: "The passage uses 'Thanks to' as a collocation meaning 'because of'. 'Daily lives' is the correct collocation with 'our'. 'Technology' is the broad term that encompasses AI systems and their applications.",
  },
  {
    id: "q6",
    type: "word-bank-fill",
    passage: `The Amazon rainforest, often called the "lungs of the Earth", plays a vital role in regulating our planet's climate. {{blank_1}} millions of species of plants and animals call this {{blank_2}} home, and it absorbs vast amounts of carbon dioxide from the atmosphere. However, deforestation and illegal logging threaten this precious ecosystem. Conservation efforts are underway to protect the rainforest and the countless species that {{blank_3}} it.`,
    wordOptions: ["inhabit", "inhabit", "ecosystem", "Thousands", "Millions", "depend", "depend on", "rainforest"],
    correctMapping: {
      blank_1: "Millions",
      blank_2: "rainforest",
      blank_3: "inhabit",
    },
    explanation: "'Millions' is the correct quantifier for the large scale of biodiversity. 'Rainforest' logically completes 'this ___ home'. 'Inhabit' means to live in, which correctly describes species living in the rainforest.",
  },
];

// ─── Demo Page ──────────────────────────────────────────────────────────────────

export default function ReadingPracticeDemo() {
  const [showDemo, setShowDemo] = useState(false);

  const handleComplete = (results: QuestionResult[]) => {
    console.log("Session completed!", results);
    const correct = results.filter(r => r.isCorrect).length;
    console.log(`Score: ${correct}/${results.length}`);
  };

  if (showDemo) {
    return (
      <div className="min-h-screen bg-[#fcf8ff] py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => setShowDemo(false)}
            className="mb-6 flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700 transition-colors"
          >
            ← Back to Demo Menu
          </button>

          <ReadingPractice
            questions={sampleQuestions}
            title="Reading Practice Demo"
            description="Practice all 3 question types: Sentence Completion, Main Idea, and Word Bank Fill."
            onComplete={handleComplete}
            onExit={() => setShowDemo(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf8ff] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-xl shadow-purple-200 mb-6">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-3">Reading Question Components</h1>
          <p className="text-slate-500 leading-relaxed">
            Tái sử dụng components cho 3 dạng câu hỏi Reading:
            <br />
            <strong>Short Sentence MCQ</strong> · <strong>Main Idea MCQ</strong> · <strong>Word Bank Fill</strong>
          </p>
        </div>

        {/* Question Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {/* Type 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Short Sentence MCQ</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Câu ngắn có chỗ trống ___
              <br />
              Chọn 1 đáp án trắc nghiệm
            </p>
            <div className="text-[11px] text-purple-600 font-semibold bg-purple-50 rounded-lg px-3 py-2">
              2 sample questions
            </div>
          </div>

          {/* Type 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <ListChecks className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Main Idea MCQ</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Đoạn văn dài + câu hỏi ý chính
              <br />
              Không có chỗ trống
            </p>
            <div className="text-[11px] text-blue-600 font-semibold bg-blue-50 rounded-lg px-3 py-2">
              2 sample questions
            </div>
          </div>

          {/* Type 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Word Bank Fill</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Click từ bên dưới để điền vào blank
              <br />
              Click blank để bỏ chọn
            </p>
            <div className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 rounded-lg px-3 py-2">
              2 sample questions
            </div>
          </div>
        </div>

        {/* Start Demo Button */}
        <button
          onClick={() => setShowDemo(true)}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black text-base shadow-xl shadow-purple-200 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          Start Interactive Demo
        </button>

        {/* Code Usage Hint */}
        <div className="mt-8 p-5 rounded-2xl bg-slate-900 text-slate-300">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Usage Example</p>
          <pre className="text-xs leading-relaxed overflow-x-auto">
{`import { ReadingPractice } from '@/components/features/reading';
import type { ReadingQuestion } from '@/components/features/reading/types';

const questions: ReadingQuestion[] = [
  {
    id: 'q1',
    type: 'short-sentence-mcq',
    sentence: 'The quick brown ___blank___ jumps over.',
    options: [
      { id: 'fox', text: 'fox' },
      { id: 'cat', text: 'cat' },
    ],
    correctAnswer: 'fox',
  },
  {
    id: 'q2',
    type: 'main-idea-mcq',
    passage: '...',
    question: 'What is the main idea?',
    options: [...],
    correctAnswer: 'a',
  },
  {
    id: 'q3',
    type: 'word-bank-fill',
    passage: 'Fill in {{blank_1}} the blanks.',
    wordOptions: ['the', 'a', 'some'],
    correctMapping: { blank_1: 'the' },
  },
];

<ReadingPractice
  questions={questions}
  title="Reading Practice"
  onComplete={(results) => console.log(results)}
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
}

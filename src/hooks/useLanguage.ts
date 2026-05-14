import { useState } from "react";
import type { Lang } from "../types";

export type { Lang } from "../types";

export const STRINGS = {
  en: {
    badge: "AI IELTS CHECKER",
    title: "An honest band, in under a minute.",
    subtitle: "Your essay graded against the official IELTS Writing descriptors — with line-level feedback and a clear path to the next band.",
    t1: "Task 1 — Report",
    t2: "Task 2 — Essay",
    questionLabel: "TASK QUESTION",
    questionPlaceholder: "Paste the official question prompt here…",
    imageLabel: "CHART / DIAGRAM",
    imagePlaceholder: "Click or drop an image (JPG or PNG)",
    imageChange: "Change image",
    essayLabel: "YOUR ESSAY",
    essayPlaceholder: "Paste your essay text here…",
    words: (n: number) => `${n} words`,
    minWords: (min: number) => `min. ${min}`,
    pressLabel: "Press",
    toEvaluate: "to evaluate",
    checkBtn: "Evaluate essay",
    checkingBtn: "Evaluating…",
    errorTask2: "Please fill in both fields — question and essay.",
    errorTask1: "Please upload an image and write your essay.",
    errorGeneric: "Error: ",
    loadingText: "Analysing essay against 4 IELTS criteria…",
    overallTitle: "OVERALL BAND SCORE",
    overallSubtitleT1: "Score across 4 IELTS Writing Task 1 criteria",
    overallSubtitleT2: "Score across 4 IELTS Writing Task 2 criteria",
    summaryTitle: "EXAMINER SUMMARY",
    errorsTitle: "Where the marks went.",
    evaluationTitle: "Your Evaluation",
    updatedNow: "Updated just now",
    criteriaLabel: "CRITERIA",
    outOf: "out of 9.0",
    lineLevelFeedback: "LINE-LEVEL FEEDBACK",
    whereMarksWent: "Where the marks went.",
    legendWord: "Word",
    legendPhrase: "Phrase",
    legendNote: "Examiner note",
    repeatedWordsLegend: "Repeated word",
    grammarLegend: "Grammar / vocab error",
    improveBtn: "Improve my essay",
    improvingBtn: "Improving…",
    improvedTitle: "IMPROVED VERSION",
    copy: "Copy",
    copied: "Copied",
    settingsTitle: "Settings",
    languageLabel: "Language",
    langEn: "English",
    langRu: "Russian",
  },
  ru: {
    badge: "AI IELTS ЧЕКЕР",
    title: "Честный балл за минуту.",
    subtitle: "Эссе оценивается по официальным критериям IELTS Writing — с разбором ошибок и понятным путём к следующему баллу.",
    t1: "Task 1 — Report",
    t2: "Task 2 — Essay",
    questionLabel: "ВОПРОС ЗАДАНИЯ",
    questionPlaceholder: "Вставьте сюда вопрос IELTS Writing…",
    imageLabel: "ГРАФИК / ДИАГРАММА",
    imagePlaceholder: "Нажмите или перетащите изображение (JPG, PNG)",
    imageChange: "Заменить",
    essayLabel: "ВАШЕ ЭССЕ",
    essayPlaceholder: "Вставьте текст эссе…",
    words: (n: number) => `${n} слов`,
    minWords: (min: number) => `мин. ${min}`,
    pressLabel: "Нажмите",
    toEvaluate: "для оценки",
    checkBtn: "Проверить эссе",
    checkingBtn: "Проверяю…",
    errorTask2: "Заполните оба поля — вопрос и эссе.",
    errorTask1: "Загрузите изображение и напишите эссе.",
    errorGeneric: "Ошибка: ",
    loadingText: "Анализирую эссе по 4 критериям IELTS…",
    overallTitle: "ИТОГОВЫЙ БАЛЛ",
    overallSubtitleT1: "Балл по 4 критериям IELTS Writing Task 1",
    overallSubtitleT2: "Балл по 4 критериям IELTS Writing Task 2",
    summaryTitle: "КОММЕНТАРИЙ ЭКЗАМЕНАТОРА",
    errorsTitle: "Где потеряны баллы.",
    evaluationTitle: "Ваша оценка",
    updatedNow: "Обновлено только что",
    criteriaLabel: "КРИТЕРИИ",
    outOf: "из 9.0",
    lineLevelFeedback: "РАЗБОР ПО ТЕКСТУ",
    whereMarksWent: "Где потеряны баллы.",
    legendWord: "Слово",
    legendPhrase: "Фраза",
    legendNote: "Комментарий",
    repeatedWordsLegend: "Повтор",
    grammarLegend: "Ошибка",
    improveBtn: "Улучшить эссе",
    improvingBtn: "Улучшаю…",
    improvedTitle: "УЛУЧШЕННАЯ ВЕРСИЯ",
    copy: "Копировать",
    copied: "Скопировано",
    settingsTitle: "Настройки",
    languageLabel: "Язык",
    langEn: "Английский",
    langRu: "Русский",
  },
} as const;

export type Strings = {
  badge: string;
  title: string;
  subtitle: string;
  t1: string;
  t2: string;
  questionLabel: string;
  questionPlaceholder: string;
  imageLabel: string;
  imagePlaceholder: string;
  imageChange: string;
  essayLabel: string;
  essayPlaceholder: string;
  words: (n: number) => string;
  minWords: (min: number) => string;
  pressLabel: string;
  toEvaluate: string;
  checkBtn: string;
  checkingBtn: string;
  errorTask2: string;
  errorTask1: string;
  errorGeneric: string;
  loadingText: string;
  overallTitle: string;
  overallSubtitleT1: string;
  overallSubtitleT2: string;
  summaryTitle: string;
  errorsTitle: string;
  evaluationTitle: string;
  updatedNow: string;
  criteriaLabel: string;
  outOf: string;
  lineLevelFeedback: string;
  whereMarksWent: string;
  legendWord: string;
  legendPhrase: string;
  legendNote: string;
  repeatedWordsLegend: string;
  grammarLegend: string;
  improveBtn: string;
  improvingBtn: string;
  improvedTitle: string;
  copy: string;
  copied: string;
  settingsTitle: string;
  languageLabel: string;
  langEn: string;
  langRu: string;
};

export function useLanguage() {
  const [lang, setLang] = useState<Lang>("en");
  const s: Strings = STRINGS[lang];
  return { lang, setLang, s };
}

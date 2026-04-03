import { useState } from "react";
import type { Lang } from "../types";

export const STRINGS = {
  en: {
    badge: "AI-POWERED",
    title: "IELTS Essay Checker",
    subtitle: "AI evaluation using official IELTS Writing criteria",
    t1: "Task 1",
    t2: "Task 2",
    questionLabel: "TASK QUESTION",
    questionPlaceholder: "Paste the IELTS Writing Task 2 question here...",
    imageLabel: "CHART / DIAGRAM",
    imagePlaceholder: "Click to upload image (JPG or PNG)",
    imageChange: "Change image",
    essayLabel: "ESSAY",
    essayPlaceholder: "Paste your essay here...",
    words: (n: number) => `${n} words`,
    minWords: (min: number) => `· min. ${min}`,
    checkBtn: "Check Essay",
    checkingBtn: "Analysing essay...",
    errorTask2: "Please fill in both fields — question and essay.",
    errorTask1: "Please upload an image and write your essay.",
    errorGeneric: "Error: ",
    loadingText: "Analysing essay against 4 IELTS criteria...",
    overallTitle: "Overall Band Score",
    overallSubtitleT1: "Score across 4 IELTS Writing Task 1 criteria",
    overallSubtitleT2: "Score across 4 IELTS Writing Task 2 criteria",
    summaryTitle: "Overall Comment",
    errorsTitle: "Error Breakdown",
    settingsTitle: "Settings",
    languageLabel: "Language",
    langEn: "English",
    langRu: "Russian",
  },
  ru: {
    badge: "НА ОСНОВЕ ИИ",
    title: "IELTS Essay Checker",
    subtitle: "Проверка по официальным критериям IELTS Writing",
    t1: "Task 1",
    t2: "Task 2",
    questionLabel: "ВОПРОС ЗАДАНИЯ",
    questionPlaceholder: "Вставьте сюда вопрос IELTS Writing Task 2...",
    imageLabel: "ГРАФИК / ДИАГРАММА",
    imagePlaceholder: "Нажмите для загрузки (JPG или PNG)",
    imageChange: "Изменить изображение",
    essayLabel: "ЭССЕ",
    essayPlaceholder: "Вставьте своё эссе сюда...",
    words: (n: number) => `${n} слов`,
    minWords: (min: number) => `· мин. ${min}`,
    checkBtn: "Проверить эссе",
    checkingBtn: "Анализирую эссе...",
    errorTask2: "Заполни оба поля — вопрос и эссе.",
    errorTask1: "Загрузи изображение и напиши эссе.",
    errorGeneric: "Ошибка: ",
    loadingText: "Анализирую эссе по 4 критериям IELTS...",
    overallTitle: "Overall Band Score",
    overallSubtitleT1: "Балл по 4 критериям IELTS Writing Task 1",
    overallSubtitleT2: "Итоговый балл по 4 критериям IELTS Writing Task 2",
    summaryTitle: "Общий комментарий",
    errorsTitle: "Разбор ошибок",
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

export enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
  SuperHard = 'Super Hard'
}

export enum Topic {
  Probability = 'Probability',
  Statistics = 'Statistics',
  BrainTeasers = 'Brain Teasers',
  StochasticCalculus = 'Stochastic Calculus',
  LinearAlgebra = 'Linear Algebra'
}

export enum Language {
  English = 'English',
  Chinese = 'Chinese'
}

export enum Model {
  Flash = 'Gemini 2.5 Flash',
  Pro = 'Gemini 3.0 Pro',
  Lite = 'Gemini Flash Lite'
}

export interface QuestionData {
  title: string;
  questionText: string;
  hint: string;
  solution: string;
  keyTakeaway: string;
}

export interface OptionProps<T> {
  label: string;
  value: T;
  isSelected: boolean;
  onClick: (value: T) => void;
}
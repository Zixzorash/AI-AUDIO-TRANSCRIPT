export type SupportedFormat = 'vtt' | 'srt' | 'txt';

export type LanguageCode = 'ja' | 'en' | 'zh' | 'th' | 'ko';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeName: string;
}

export interface ModelOption {
  id: string;
  label: string;
  isPro: boolean;
}

export interface GenerationConfig {
  inputLang: LanguageCode;
  outputLang: LanguageCode;
  model: string;
  format: SupportedFormat;
}

export type ProcessingStatus = 'idle' | 'reading' | 'uploading' | 'processing' | 'completed' | 'error';

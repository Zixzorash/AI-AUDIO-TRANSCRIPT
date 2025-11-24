import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileAudio, 
  FileVideo, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Copy, 
  Wand2, 
  Settings2,
  Play,
  Languages
} from 'lucide-react';
import { LANGUAGES, MODELS } from './constants';
import { generateSubtitles } from './services/geminiService';
import { Button } from './components/Button';
import { SupportedFormat, LanguageCode, ProcessingStatus } from './types';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB as requested (Note: Browser Base64 encoding may struggle with files > 50-100MB depending on RAM)

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  // Config State
  const [inputLang, setInputLang] = useState<LanguageCode>('ja');
  const [outputLang, setOutputLang] = useState<LanguageCode>('th');
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0].id);
  const [outputFormat, setOutputFormat] = useState<SupportedFormat>('srt');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError("File size exceeds 500MB limit.");
        return;
      }
      setFile(selectedFile);
      setError('');
      setStatus('idle');
      setResult('');
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/mp3;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.onprogress = (data) => {
        if (data.lengthComputable) {
          // Simulate reading progress (0-30%)
          setProgress(Math.round((data.loaded / data.total) * 30));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    if (!file) return;

    // IMPORTANT: Security check for API key
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setError("Missing API Key. Please configure process.env.API_KEY.");
      return;
    }

    try {
      setStatus('reading');
      setError('');
      setProgress(5);

      const base64Data = await convertFileToBase64(file);
      
      setStatus('processing');
      setProgress(40);
      
      // Simulate progress for the AI wait time (Gemini is fast but not instant)
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 5;
        });
      }, 1000);

      const generatedText = await generateSubtitles(
        apiKey,
        selectedModel,
        base64Data,
        file.type,
        inputLang,
        outputLang,
        outputFormat
      );

      clearInterval(interval);
      setResult(generatedText);
      setStatus('completed');
      setProgress(100);

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setError(err.message || "An error occurred during generation.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitle_${Date.now()}.${outputFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 selection:bg-red-900 selection:text-white">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
               {/* Logo inspired concept - pure CSS/SVG */}
               <div className="w-10 h-10 bg-gradient-to-tr from-yellow-500 via-red-600 to-black rounded-full flex items-center justify-center border-2 border-yellow-500 overflow-hidden">
                 <span className="font-black text-white text-xs italic transform -skew-x-12">JAV</span>
               </div>
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Auto Subtitles <span className="text-red-600">Generator</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><Languages size={14}/> Multi-language Support</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* Intro */}
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Transcribe & Translate <span className="text-red-600">Adult Content</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            AI-powered subtitle generation optimized for erotic dialogue, specific terminology, and realistic sound effects. 
            Supports mp4, mp3, m4a, wav, acc, flac.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Configuration */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* File Upload */}
            <div 
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 group
                ${file ? 'border-red-600 bg-red-900/10' : 'border-zinc-700 hover:border-red-500 hover:bg-zinc-800/50'}
              `}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                   setFile(e.dataTransfer.files[0]);
                   setError('');
                   setStatus('idle');
                }
              }}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".mp3,.mp4,.m4a,.wav,.acc,.flac" 
                className="hidden" 
                onChange={handleFileChange}
              />
              
              <div className="flex flex-col items-center gap-4">
                <div className={`p-4 rounded-full ${file ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:scale-110 transition-transform'}`}>
                  {file ? <CheckCircle2 size={32} /> : <Upload size={32} />}
                </div>
                <div>
                  {file ? (
                    <div className="space-y-1">
                      <p className="font-semibold text-white break-all line-clamp-2">{file.name}</p>
                      <p className="text-xs text-zinc-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="text-xs text-red-400 hover:text-red-300 underline mt-2"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium text-white">Click or Drag file here</p>
                      <p className="text-xs text-zinc-500 mt-2">Max size 500MB</p>
                    </>
                  )}
                </div>
              </div>
              
              {!file && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 w-full h-full cursor-pointer"
                />
              )}
            </div>

            {/* Settings Card */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-zinc-800">
                <Settings2 className="text-red-600" size={20} />
                <h3 className="font-semibold text-white">Configuration</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Model</label>
                  <select 
                    value={selectedModel} 
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  >
                    {MODELS.map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Audio Language</label>
                    <select 
                      value={inputLang} 
                      onChange={(e) => setInputLang(e.target.value as LanguageCode)}
                      className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                    >
                      {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Subtitle Language</label>
                    <select 
                      value={outputLang} 
                      onChange={(e) => setOutputLang(e.target.value as LanguageCode)}
                      className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600"
                    >
                      {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Output Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['srt', 'vtt', 'txt'] as SupportedFormat[]).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setOutputFormat(fmt)}
                        className={`
                          px-2 py-2 text-xs font-bold rounded border uppercase transition-colors
                          ${outputFormat === fmt 
                            ? 'bg-red-600 text-white border-red-600' 
                            : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500'}
                        `}
                      >
                        .{fmt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={!file || status === 'processing' || status === 'reading'}
                isLoading={status === 'processing' || status === 'reading'}
                className="w-full py-3"
              >
                {status === 'idle' || status === 'completed' || status === 'error' ? (
                  <>
                    <Wand2 size={18} /> Generate Subtitles
                  </>
                ) : (
                  <span>{status === 'reading' ? 'Reading File...' : 'Processing...'}</span>
                )}
              </Button>

              {error && (
                <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                  <p className="text-xs text-red-200">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-2">
            <div className="h-full bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col overflow-hidden relative min-h-[500px]">
              
              {/* Output Header */}
              <div className="bg-zinc-900/80 border-b border-zinc-800 p-4 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                   <span className="text-sm font-medium text-white">Live Output</span>
                </div>
                
                {result && (
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={handleCopy} className="text-xs py-1.5 px-3">
                      <Copy size={14} /> Copy
                    </Button>
                    <Button variant="primary" onClick={handleDownload} className="text-xs py-1.5 px-3">
                      <Download size={14} /> Download
                    </Button>
                  </div>
                )}
              </div>

              {/* Progress Bar (Sticky just below header) */}
              {(status === 'processing' || status === 'reading') && (
                <div className="absolute top-[60px] left-0 right-0 h-1 bg-zinc-800 z-10">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 via-red-600 to-yellow-500 animate-gradient-x transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {/* Content Area */}
              <div className="flex-1 p-0 relative">
                {status === 'idle' && !result && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 gap-4">
                    <FileAudio size={48} className="opacity-20" />
                    <p>Ready to transcribe...</p>
                  </div>
                )}

                {status === 'processing' && !result && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-zinc-800"></div>
                      <div className="w-16 h-16 rounded-full border-4 border-t-red-600 animate-spin absolute top-0 left-0"></div>
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-white font-medium animate-pulse">Analyzing Audio Stream</p>
                      <p className="text-xs text-zinc-500">Detecting explicit terminology and vocalizations...</p>
                    </div>
                  </div>
                )}

                <textarea
                  className="w-full h-full bg-transparent p-6 text-sm font-mono text-zinc-300 resize-none focus:outline-none"
                  value={result}
                  readOnly
                  placeholder={status === 'completed' ? '' : "Subtitle output will appear here..."}
                  style={{ minHeight: '500px' }}
                />
              </div>

              {/* Footer Statistics */}
              <div className="bg-black/40 border-t border-zinc-800 p-2 px-4 flex justify-between text-[10px] text-zinc-600 uppercase tracking-wider">
                <span>Model: {selectedModel}</span>
                <span>Format: {outputFormat}</span>
                <span>Status: {status.toUpperCase()}</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Styles for custom animations */}
      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 2s ease infinite;
        }
      `}</style>
    </div>
  );
}

export default App;
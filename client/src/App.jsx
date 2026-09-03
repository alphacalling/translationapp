import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [language, setLanguage] = useState("Hindi");
  const [text, setText] = useState("");
  const [translation, setTranslation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTranslate = async () => {
    if (!text.trim()) {
      setError("Write something first.");
      return;
    }

    setLoading(true);
    setError("");
    setTranslation("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            language,
            text,
          },
        }),
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (response.status === 429) {
        setError(data?.message || "Too many requests. Please try again later.");
        return;
      }

      if (!response.ok) {
        setError(
          data?.message ||
            data?.error ||
            `Request failed with status ${response.status}.`,
        );
        return;
      }

      // Success
      setTranslation(data?.output || "");
    } catch (err) {
      console.error("FETCH ERROR:", err);

      setError(
        "Due to LLM API cost, your request is denied. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b1120] text-white">
      <header className="border-b border-[#24324a] bg-[#0b1120]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-sm font-bold">T</span>
            </div>

            <span className="font-semibold tracking-tight text-slate-200">
              Translator
            </span>
          </div>

          <div className="text-xs text-slate-500">LangChain · FastAPI</div>
        </div>
      </header>

      {/* Main */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        {/* Intro */}
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-400 mb-3">
            Translation
          </p>

          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-100">
            Say it in another language.
          </h1>

          <p className="mt-3 text-slate-400 max-w-xl">
            Enter your text, choose a language, and get a clean translation.
          </p>
        </div>

        {/* Workspace */}
        <div className="grid lg:grid-cols-2 border border-[#24324a] rounded-xl overflow-hidden bg-[#111a2e] shadow-2xl shadow-black/20">
          <div className="border-b lg:border-b-0 lg:border-r border-[#24324a]">
            <div className="px-5 py-4 border-b border-[#24324a] flex items-center justify-between">
              <span className="text-sm text-slate-300">Original</span>

              <span
                className={`text-xs ${
                  text.length >= 500 ? "text-red-400" : "text-slate-500"
                }`}
              >
                {text.length}/500 characters
              </span>
            </div>

            {/* Textarea */}
            <div className="p-5 bg-[#0d1628]">
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setError("");
                }}
                placeholder="Type something..."
                rows="10"
                maxLength={500}
                className="w-full bg-transparent text-slate-200 placeholder:text-slate-600 resize-none outline-none leading-7 text-[15px]"
              />
            </div>

            {/* Controls */}
            <div className="px-5 py-4 bg-[#111a2e] border-t border-[#24324a] flex items-center justify-between gap-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[#172238] border border-[#2a3a55] text-slate-300 text-sm rounded-md px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              >
                <option>Hindi</option>
                <option>English</option>
                <option>French</option>
                <option>German</option>
                <option>Spanish</option>
                <option>Japanese</option>
                <option>Chinese</option>
              </select>

              <button
                onClick={handleTranslate}
                disabled={loading || !text.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-indigo-400 text-white text-sm font-medium px-5 py-2.5 rounded-md transition-all shadow-lg shadow-indigo-600/10"
              >
                {loading ? "Translating..." : "Translate →"}
              </button>
            </div>
          </div>

          {/* Output */}
          <div className="min-h-[340px] flex flex-col bg-[#111a2e]">
            <div className="px-5 py-4 border-b border-[#24324a]">
              <span className="text-sm text-slate-300">Translation</span>
            </div>

            <div className="flex-1 p-5">
              {loading ? (
                <div className="flex items-center gap-3 text-slate-500 text-sm">
                  <div className="w-3 h-3 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
                  Translating...
                </div>
              ) : translation ? (
                <p className="text-slate-200 leading-7 text-[15px] whitespace-pre-wrap">
                  {translation}
                </p>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                  Your translation will appear here.
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 px-4 py-3 border border-red-500/20 bg-red-500/10 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between text-xs text-slate-600">
          <span>AI-powered translation</span>
          <span> ©2026 @codervikas</span>
        </div>
      </section>
    </main>
  );
}

export default App;

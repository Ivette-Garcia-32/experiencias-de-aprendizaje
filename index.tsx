import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";
import { 
  Download, 
  MessageSquare, 
  FileText, 
  Music, 
  BarChart3, 
  Send, 
  Sparkles,
  X,
  FileSpreadsheet,
  Accessibility
} from "lucide-react";

// --- Interfaces ---

interface Comment {
  id: string;
  author: string;
  text: string;
  date: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  type: "pdf" | "audio";
  url: string; // In a real app, this would be the real file path
  downloadCount: number;
  comments: Comment[];
}

// --- Mock Data (Initial State - Themed for Accessibility) ---

const INITIAL_RESOURCES: Resource[] = [
  {
    id: "1",
    title: "Guía de Pautas WCAG 2.1",
    description: "Documento técnico completo sobre los principios de percepción, operación, comprensión y robustez para accesibilidad web.",
    type: "pdf",
    url: "#",
    downloadCount: 156,
    comments: [
      { id: "c1", author: "Dev_Inclusivo", text: "Esencial para entender los criterios de conformidad A y AA.", date: "2023-11-10" }
    ]
  },
  {
    id: "2",
    title: "Podcast: Diseño Universal para el Aprendizaje (DUA)",
    description: "Episodio 01: Estrategias para eliminar barreras en el aula y crear currículos flexibles. Duración: 35 min.",
    type: "audio",
    url: "#",
    downloadCount: 98,
    comments: [
      { id: "c2", author: "Profe_Ana", text: "Muy útil la sección sobre múltiples formas de representación.", date: "2023-11-12" }
    ]
  },
  {
    id: "3",
    title: "Manual de Lectura Fácil",
    description: "Metodologías para la adaptación de textos y creación de contenidos cognitivamente accesibles.",
    type: "pdf",
    url: "#",
    downloadCount: 210,
    comments: []
  }
];

// --- Main Application ---

const App = () => {
  // State
  const [resources, setResources] = useState<Resource[]>(() => {
    const saved = localStorage.getItem("accesibilidad_resources");
    return saved ? JSON.parse(saved) : INITIAL_RESOURCES;
  });
  
  const [showStats, setShowStats] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Persist to LocalStorage
  useEffect(() => {
    localStorage.setItem("accesibilidad_resources", JSON.stringify(resources));
  }, [resources]);

  // --- Handlers ---

  const handleDownload = (id: string, title: string) => {
    setResources(prev => prev.map(r => {
      if (r.id === id) return { ...r, downloadCount: r.downloadCount + 1 };
      return r;
    }));

    // Simulate file download
    alert(`Descargando recurso: ${title}`);
  };

  const handleAddComment = (id: string, text: string, author: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      author: author || "Usuario",
      text,
      date: new Date().toISOString().split('T')[0]
    };

    setResources(prev => prev.map(r => {
      if (r.id === id) return { ...r, comments: [newComment, ...r.comments] };
      return r;
    }));
  };

  const exportStats = () => {
    // Generate CSV Content
    const headers = "ID,Titulo,Tipo,Descargas,Total_Comentarios\n";
    const rows = resources.map(r => 
      `${r.id},"${r.title}",${r.type},${r.downloadCount},${r.comments.length}`
    ).join("\n");
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_accesibilidad.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const analyzeWithGemini = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Prepare data for the model
      const dataSummary = JSON.stringify(resources.map(r => ({
        title: r.title,
        type: r.type,
        downloads: r.downloadCount,
        recentComments: r.comments.slice(0, 3).map(c => c.text)
      })));

      const prompt = `
        Actúa como un especialista en Accesibilidad y Educación.
        Analiza los siguientes datos de recursos educativos:
        ${dataSummary}
        
        Genera un reporte breve (máximo 100 palabras) en formato Markdown que destaque:
        1. El tema de accesibilidad más demandado.
        2. Qué formato (Audio/PDF) prefiere la audiencia.
        3. Una sugerencia para crear nuevo contenido inclusivo.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setAiAnalysis(response.text);
    } catch (error) {
      console.error("Error calling Gemini:", error);
      setAiAnalysis("Error de conexión con el asistente. Por favor verifica la configuración.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-700 rounded-lg flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
              <Accessibility size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">Inclusión Digital</h1>
              <p className="text-xs text-slate-500 font-medium">Experiencias de Aprendizaje y Accesibilidad</p>
            </div>
          </div>
          <button 
            onClick={() => setShowStats(!showStats)}
            aria-label={showStats ? "Cerrar panel de estadísticas" : "Abrir panel de estadísticas"}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              showStats 
                ? "bg-indigo-100 text-indigo-800" 
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {showStats ? <X size={18} /> : <BarChart3 size={18} />}
            <span className="hidden sm:inline">{showStats ? "Cerrar Panel" : "Reportes"}</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Stats Dashboard Overlay */}
        {showStats && (
          <div className="mb-8 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-6 border-b border-slate-100 flex flex-wrap justify-between items-center bg-slate-50 gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Métricas de Impacto</h2>
                <p className="text-sm text-slate-500">Seguimiento de descargas y participación</p>
              </div>
              <div className="flex gap-2">
                 <button 
                  onClick={exportStats}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-indigo-500"
                >
                  <FileSpreadsheet size={16} />
                  CSV
                </button>
                <button 
                  onClick={analyzeWithGemini}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-700 text-white rounded-lg text-sm font-medium hover:bg-indigo-800 transition-colors disabled:opacity-70 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                >
                  <Sparkles size={16} />
                  {isAnalyzing ? "Procesando..." : "IA Insights"}
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* KPI Cards */}
              <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                <p className="text-sm text-indigo-600 font-medium mb-1">Descargas Totales</p>
                <p className="text-3xl font-bold text-indigo-900">
                  {resources.reduce((acc, r) => acc + r.downloadCount, 0)}
                </p>
              </div>
              <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
                <p className="text-sm text-emerald-600 font-medium mb-1">Interacciones</p>
                <p className="text-3xl font-bold text-emerald-900">
                  {resources.reduce((acc, r) => acc + r.comments.length, 0)}
                </p>
              </div>
              <div className="bg-amber-50 p-5 rounded-xl border border-amber-100">
                <p className="text-sm text-amber-600 font-medium mb-1">Más Solicitado</p>
                <p className="text-lg font-bold text-amber-900 truncate" title={resources.reduce((prev, current) => (prev.downloadCount > current.downloadCount) ? prev : current).title}>
                  {resources.reduce((prev, current) => (prev.downloadCount > current.downloadCount) ? prev : current).title}
                </p>
              </div>
            </div>

            {/* AI Result Area */}
            {aiAnalysis && (
              <div className="mx-6 mb-6 p-5 bg-gradient-to-br from-white to-indigo-50 rounded-xl border border-indigo-100 shadow-inner">
                <div className="flex items-center gap-2 mb-3 text-indigo-800 font-bold">
                  <Sparkles size={18} className="text-indigo-600" />
                  <span>Análisis Inteligente</span>
                </div>
                <div className="prose prose-sm prose-indigo text-slate-700">
                   {aiAnalysis.split('\n').map((line, i) => (
                     <p key={i} className="mb-2 leading-relaxed">{line}</p>
                   ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resource List */}
        <div className="grid gap-6">
          {resources.map(resource => (
            <ResourceCard 
              key={resource.id} 
              resource={resource} 
              onDownload={handleDownload}
              onAddComment={handleAddComment}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

// --- Sub-Components ---

interface ResourceCardProps {
  resource: Resource;
  onDownload: (id: string, title: string) => void;
  onAddComment: (id: string, text: string, author: string) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ 
  resource, 
  onDownload, 
  onAddComment 
}) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(resource.id, newComment, authorName);
    setNewComment("");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="p-6 flex flex-col md:flex-row gap-6">
        {/* Icon / Thumbnail */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
          resource.type === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-sky-600'
        }`}>
          {resource.type === 'pdf' ? <FileText size={32} /> : <Music size={32} />}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-2">
            <div>
              <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide mb-2 ${
                 resource.type === 'pdf' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-sky-50 text-sky-700 border border-sky-100'
              }`}>
                {resource.type === 'pdf' ? 'Documento PDF' : 'Audio / Podcast'}
              </span>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{resource.title}</h3>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full text-sm font-semibold text-slate-600 border border-slate-200">
              <Download size={14} />
              <span aria-label={`${resource.downloadCount} descargas`}>{resource.downloadCount}</span>
            </div>
          </div>
          
          <p className="text-slate-600 mb-6 text-sm leading-relaxed">
            {resource.description}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 border-t border-slate-100 pt-4">
            <button 
              onClick={() => onDownload(resource.id, resource.title)}
              className="flex-1 bg-slate-900 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
            >
              <Download size={16} />
              Descargar Recurso
            </button>
            <button 
              onClick={() => setShowComments(!showComments)}
              className={`px-4 py-2.5 rounded-lg font-medium text-sm border transition-colors flex items-center justify-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                showComments 
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <MessageSquare size={16} />
              {resource.comments.length} {resource.comments.length === 1 ? 'Comentario' : 'Comentarios'}
            </button>
          </div>
        </div>
      </div>

      {/* Comment Section (Accordion) */}
      {showComments && (
        <div className="bg-slate-50 border-t border-slate-200 p-6 animate-in slide-in-from-top-2 duration-200">
          <h4 className="font-semibold text-slate-800 mb-4 text-sm flex items-center gap-2">
            <MessageSquare size={14} className="text-slate-500"/>
            Debate y Opiniones
          </h4>
          
          {/* Comment List */}
          <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
            {resource.comments.length === 0 ? (
              <div className="text-center py-6 bg-white rounded-lg border border-slate-200 border-dashed">
                <p className="text-slate-400 text-sm italic">Aún no hay comentarios. ¡Inicia la conversación!</p>
              </div>
            ) : (
              resource.comments.map(comment => (
                <div key={comment.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{comment.author}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">{comment.date}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-snug">{comment.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmitComment} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder="Tu nombre (opcional)"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="text-sm p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none w-full sm:w-1/3 transition-shadow"
                aria-label="Nombre del autor"
              />
              <div className="flex flex-1 gap-2">
                <input 
                  type="text" 
                  placeholder="Escribe tu aporte o pregunta..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 text-sm p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-shadow"
                  aria-label="Texto del comentario"
                />
                <button 
                  type="submit"
                  disabled={!newComment.trim()}
                  className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  aria-label="Enviar comentario"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// --- Render ---

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
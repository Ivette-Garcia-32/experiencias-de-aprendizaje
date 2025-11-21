import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";
import { 
  Download, 
  MessageSquare, 
  FileText, 
  Headphones, 
  BarChart3, 
  Sparkles, 
  Save,
  User,
  Settings
} from "lucide-react";

// --- Interfaces ---

interface DownloadableFile {
  id: string;
  label: string;
  filename: string;
  count: number;
}

interface Experience {
  id: number;
  title: string;
  audioSrc: string; // Placeholder for UI
  files: DownloadableFile[];
}

interface Comment {
  id: string;
  author: string;
  email?: string;
  text: string;
  date: string;
}

// --- Datos Iniciales (Tu contenido original) ---

const INITIAL_EXPERIENCES: Experience[] = [
  {
    id: 1,
    title: "1. Escribe con tu voz: experimenta la accesibilidad con TalkBack",
    audioSrc: "exp1-audio.mp3",
    files: [
      { id: "e1-f1", label: "Descargar Guía Escrita", filename: "exp1-guia.pdf", count: 0 },
      { id: "e1-f2", label: "Descargar Plantilla de Observación Docente", filename: "exp1-observacion-docente.pdf", count: 0 },
      { id: "e1-f3", label: "Descargar Plantilla de Reflexión Estudiantil", filename: "exp1-reflexion-estudiante.pdf", count: 0 },
    ]
  },
  {
    id: 2,
    title: "2. Descubre con tus oídos: explorando el mundo con Google Lens",
    audioSrc: "exp2-audio.mp3",
    files: [
      { id: "e2-f1", label: "Descargar Guía Escrita", filename: "exp2-guia.pdf", count: 0 },
      { id: "e2-f2", label: "Plantilla de Observación Docente", filename: "exp2-observacion-docente.pdf", count: 0 },
      { id: "e2-f3", label: "Plantilla de Reflexión Estudiantil", filename: "exp2-reflexion-estudiante.pdf", count: 0 },
    ]
  },
  {
    id: 3,
    title: "3. Escucha para aprender: acceso a la información escrita con Lookout",
    audioSrc: "exp3-audio.mp3",
    files: [
      { id: "e3-f1", label: "Descargar Guía Escrita", filename: "exp3-guia.pdf", count: 0 },
      { id: "e3-f2", label: "Plantilla de Observación Docente", filename: "exp3-observacion-docente.pdf", count: 0 },
      { id: "e3-f3", label: "Plantilla de Reflexión Estudiantil", filename: "exp3-reflexion-estudiante.pdf", count: 0 },
    ]
  }
];

const App = () => {
  // --- Estados ---
  const [experiences, setExperiences] = useState<Experience[]>(() => {
    const saved = localStorage.getItem("exp_data_v1");
    return saved ? JSON.parse(saved) : INITIAL_EXPERIENCES;
  });

  const [comments, setComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem("exp_comments_v1");
    return saved ? JSON.parse(saved) : [];
  });

  const [showAdmin, setShowAdmin] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- Persistencia ---
  useEffect(() => {
    localStorage.setItem("exp_data_v1", JSON.stringify(experiences));
  }, [experiences]);

  useEffect(() => {
    localStorage.setItem("exp_comments_v1", JSON.stringify(comments));
  }, [comments]);

  // --- Lógica ---

  const handleDownload = (expId: number, fileId: string) => {
    setExperiences(prev => prev.map(exp => {
      if (exp.id !== expId) return exp;
      return {
        ...exp,
        files: exp.files.map(f => f.id === fileId ? { ...f, count: f.count + 1 } : f)
      };
    }));
  };

  const handleAddComment = (name: string, email: string, text: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      author: name,
      email,
      text,
      date: new Date().toLocaleString()
    };
    setComments([newComment, ...comments]);
  };

  // --- Funciones Administrativas (Exportar CSV y Gemini) ---

  const exportData = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Sección Descargas
    csvContent += "--- REPORTE DE DESCARGAS ---\n";
    csvContent += "Experiencia,Archivo,Descargas\n";
    experiences.forEach(exp => {
      exp.files.forEach(f => {
        csvContent += `"${exp.title}","${f.filename}",${f.count}\n`;
      });
    });

    // Sección Comentarios
    csvContent += "\n--- REPORTE DE COMENTARIOS ---\n";
    csvContent += "Fecha,Autor,Email,Comentario\n";
    comments.forEach(c => {
      csvContent += `"${c.date}","${c.author}","${c.email || ''}","${c.text.replace(/"/g, '""')}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_experiencias.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const analyzeWithGemini = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const totalDownloads = experiences.reduce((acc, exp) => acc + exp.files.reduce((a, f) => a + f.count, 0), 0);
      const summary = {
        total_downloads: totalDownloads,
        total_comments: comments.length,
        top_files: experiences.flatMap(e => e.files).sort((a,b) => b.count - a.count).slice(0, 3).map(f => `${f.filename} (${f.count})`),
        latest_comments: comments.slice(0, 5).map(c => c.text)
      };

      const prompt = `Actúa como un analista de datos educativos. Analiza este JSON con datos de uso de un repositorio de accesibilidad: ${JSON.stringify(summary)}.
      
      Dame un reporte breve en Markdown con:
      1. Tendencia general de uso.
      2. Qué temas parecen interesar más basado en los archivos más descargados.
      3. Un resumen del sentimiento de los comentarios.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setAiAnalysis(response.text);
    } catch (error) {
      setAiAnalysis("Error conectando con la IA. Asegúrate de tener conexión a internet.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen pb-10 font-sans bg-[#f5f5f5] text-[#333]">
      
      {/* Header */}
      <header className="header-bg py-8 px-4 text-center shadow-md">
        <div className="max-w-4xl mx-auto relative">
          <h1 className="text-3xl font-bold mb-2">Experiencias de Aprendizaje Accesibles</h1>
          <p className="text-lg opacity-90">Estrategias para apoyar a estudiantes ciegos en el acceso a la información</p>
          
          {/* Botón Admin Secreto */}
          <button 
            onClick={() => setShowAdmin(!showAdmin)}
            className="absolute top-[-10px] right-0 text-white/50 hover:text-white p-2"
            title="Panel de Administración"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="max-w-[900px] mx-auto px-5 py-6">
        
        {/* PANEL DE ADMINISTRACIÓN (Oculto por defecto) */}
        {showAdmin && (
          <div className="bg-slate-800 text-white rounded-lg p-6 mb-8 shadow-xl animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="text-blue-400" /> Panel de Estadísticas
              </h2>
              <button onClick={exportData} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center gap-2 font-bold text-sm transition-colors">
                <Save size={16} /> Descargar Reporte (Excel/CSV)
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-700 p-3 rounded text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {experiences.reduce((acc, e) => acc + e.files.reduce((a, f) => a + f.count, 0), 0)}
                </div>
                <div className="text-xs text-slate-300 uppercase">Descargas Totales</div>
              </div>
              <div className="bg-slate-700 p-3 rounded text-center">
                <div className="text-2xl font-bold text-blue-400">{comments.length}</div>
                <div className="text-xs text-slate-300 uppercase">Comentarios</div>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4">
               <button 
                onClick={analyzeWithGemini} 
                disabled={isAnalyzing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3 rounded font-bold flex justify-center items-center gap-2 transition-colors"
               >
                 <Sparkles size={18} /> 
                 {isAnalyzing ? "Analizando datos..." : "Analizar con Inteligencia Artificial"}
               </button>
               
               {aiAnalysis && (
                 <div className="mt-4 bg-slate-700 p-4 rounded text-sm text-gray-200 prose prose-invert max-w-none">
                    {aiAnalysis.split('\n').map((line, i) => (
                      <p key={i} className="mb-2">{line}</p>
                    ))}
                 </div>
               )}
            </div>
          </div>
        )}

        {/* TARJETAS DE EXPERIENCIA */}
        {experiences.map((exp) => (
          <div key={exp.id} className="bg-white p-6 mb-6 rounded-[10px] shadow-[0_4px_10px_rgba(0,0,0,0.1)]">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">{exp.title}</h2>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Headphones size={20} className="text-blue-600" /> Audio de la experiencia
              </h3>
              <audio controls className="w-full mt-2 bg-gray-100 rounded">
                <source src={exp.audioSrc} type="audio/mpeg" />
                Tu navegador no soporta el elemento de audio.
              </audio>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" /> Descargas
              </h3>
              
              <div className="space-y-3">
                {exp.files.map((file) => (
                  <div key={file.id} className="flex flex-wrap items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                    <a 
                      href={`#`} // En un entorno real, aquí va la URL del archivo
                      onClick={(e) => {
                        e.preventDefault();
                        handleDownload(exp.id, file.id);
                        alert("Simulando descarga de: " + file.filename);
                      }}
                      className="btn-primary px-4 py-2.5 rounded-md text-sm md:text-base no-underline inline-block flex-1 md:flex-none text-center md:text-left"
                    >
                      {file.label}
                    </a>
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium min-w-[80px] justify-center">
                      <Download size={14} />
                      <span>{file.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* SECCIÓN DE COMENTARIOS */}
        <div className="bg-white p-6 mb-6 rounded-[10px] shadow-[0_4px_10px_rgba(0,0,0,0.1)]">
          <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <MessageSquare className="text-blue-600" /> Comparte tu opinión
          </h2>
          <p className="text-gray-600 mb-6">Tu retroalimentación nos ayuda a mejorar estas guías y experiencias.</p>

          <CommentForm onSubmit={handleAddComment} />

          <div className="mt-4 text-xs text-gray-500">
            📌 Al enviar, aceptas que nombre y correo (si lo proporcionas) sean almacenados para fines académicos.
          </div>

          <h3 className="text-lg font-bold text-gray-800 mt-8 mb-4 border-b pb-2">Comentarios recientes</h3>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {comments.length === 0 ? (
              <p className="text-gray-400 italic text-center py-4">Sé el primero en comentar.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                         <User size={16} />
                       </div>
                       <div>
                         <strong className="text-[#1a73e8] block leading-tight">{c.author}</strong>
                         <span className="text-xs text-gray-400">{c.date}</span>
                       </div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{c.text}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// Componente de Formulario de Comentarios
const CommentForm = ({ onSubmit }: { onSubmit: (n:string, e:string, t:string) => void }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    onSubmit(name, email, text);
    setName("");
    setEmail("");
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Nombre:</label>
        <input 
          type="text" 
          required
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
        />
      </div>
      
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Correo (opcional):</label>
        <input 
          type="email" 
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Comentario:</label>
        <textarea 
          rows={4}
          required
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
        ></textarea>
      </div>

      <button 
        type="submit" 
        className="btn-primary px-6 py-2.5 rounded-md font-bold shadow-sm w-full md:w-auto cursor-pointer"
      >
        Enviar Comentario
      </button>
    </form>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);


import React, { useState, useEffect } from 'react';
import { 
  Search, Download, MapPin, Building2, Trash2, 
  Map as MapIcon, Loader2, Info, 
  Phone, Mail, Globe, MessageSquare, Hash, Lightbulb, Sparkles
} from 'lucide-react';
import { BusinessLead, SearchParams } from './types';
import { fetchBusinessLeads } from './services/geminiService';

const App: React.FC = () => {
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchParams>({ 
    businessType: '', 
    location: '', 
    limit: 10 
  });
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.log("Location access denied", err)
      );
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchParams.businessType || !searchParams.location) return;

    setLoading(true);
    setError(null);
    try {
      const result = await fetchBusinessLeads(searchParams, userLocation);
      
      setLeads(prev => {
        const newLeads = result.leads.filter(
          nl => !prev.some(pl => pl.name.toLowerCase() === nl.name.toLowerCase() && pl.address === nl.address)
        );
        return [...prev, ...newLeads];
      });
      
      setAiAnalysis(result.rawText);
    } catch (err: any) {
      setError("Failed to fetch data. Please try again with a more specific location.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearLeads = () => {
    if (window.confirm("Are you sure you want to clear all extracted leads?")) {
      setLeads([]);
      setAiAnalysis(null);
    }
  };

  const exportToCSV = () => {
    if (leads.length === 0) return;

    // Added "AI Suggestion" header
    const headers = ["Business Name", "Address", "Mobile No.", "WhatsApp No.", "Email ID", "Website", "AI Suggestion", "Maps Link", "Category", "Search Area"];
    const rows = leads.map(lead => [
      `"${lead.name.replace(/"/g, '""')}"`,
      `"${(lead.address || 'N/A').replace(/"/g, '""')}"`,
      `"${lead.phoneNumber || 'N/A'}"`,
      `"${lead.whatsapp || 'N/A'}"`,
      `"${lead.email || 'N/A'}"`,
      `"${lead.website || 'N/A'}"`,
      `"${(lead.suggestion || 'Analyze for improvements').replace(/"/g, '""')}"`,
      `"${lead.mapsUrl || ''}"`,
      `"${lead.category}"`,
      `"${lead.location}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `map_leads_marketing_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-white border-r border-slate-200 p-6 flex flex-col gap-6 sticky top-0 h-auto md:h-screen z-10 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-100">
            <MapIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">MapLeads Pro</h1>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Type</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Tile Showrooms"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm outline-none transition-all"
                value={searchParams.businessType}
                onChange={e => setSearchParams(prev => ({ ...prev, businessType: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Specific Area</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Surat, Gujarat"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm outline-none transition-all"
                value={searchParams.location}
                onChange={e => setSearchParams(prev => ({ ...prev, location: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Data Count (1-99)</label>
            <div className="relative">
              <Hash className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="number"
                min="1"
                max="99"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm outline-none transition-all"
                value={searchParams.limit}
                onChange={e => setSearchParams(prev => ({ ...prev, limit: Math.min(99, Math.max(1, parseInt(e.target.value) || 1)) }))}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-100 mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Processing...' : 'Extract & Analyze'}
          </button>
        </form>

        <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-slate-100">
          <button
            onClick={exportToCSV}
            disabled={leads.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download Excel/CSV ({leads.length})
          </button>
          <button
            onClick={clearLeads}
            disabled={leads.length === 0}
            className="w-full bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Reset Data
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Marketing Dashboard</h2>
            <p className="text-slate-500 text-sm font-medium">Verified data from {searchParams.location || 'Your Region'}.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-100 border border-indigo-500">
              Extracted: {leads.length} / {searchParams.limit}
            </div>
          </div>
        </header>

        {aiAnalysis && (
          <div className="mb-8 p-6 bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-2 mb-3 text-amber-700 font-bold">
              <Sparkles className="w-5 h-5 fill-amber-200" />
              <h3>Regional Market Insight</h3>
            </div>
            <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed italic border-l-4 border-amber-300 pl-4">
              {aiAnalysis}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-3">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {loading && (
          <div className="mb-8 p-12 bg-white rounded-2xl border border-indigo-100 shadow-sm flex flex-col items-center justify-center text-center gap-4">
            <div className="relative">
               <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
               <Building2 className="w-6 h-6 text-indigo-400 absolute top-3 left-3 opacity-50" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Scouring Google Maps & Web...</h3>
              <p className="text-slate-500 text-sm">Identifying websites, mobile numbers, and AI-driven improvement tips.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1500px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Business Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile No.</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp No.</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Website</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">AI Suggestion</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Maps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.length > 0 ? (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4 max-w-[250px]">
                        <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{lead.name}</div>
                        <div className="text-[10px] text-slate-400 mt-1 truncate" title={lead.address}>{lead.address}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className={lead.phoneNumber === 'N/A' ? 'text-slate-300 italic' : 'font-medium'}>{lead.phoneNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span className={lead.whatsapp === 'N/A' ? 'text-slate-300 italic font-normal' : ''}>{lead.whatsapp}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className={lead.email === 'N/A' ? 'text-slate-300 italic' : 'truncate max-w-[150px]'}>{lead.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {lead.website !== 'N/A' ? (
                          <a 
                            href={lead.website!.startsWith('http') ? lead.website : `https://${lead.website}`} 
                            target="_blank" 
                            className="flex items-center gap-2 text-indigo-600 hover:underline text-sm font-medium"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            Visit Site
                          </a>
                        ) : (
                          <span className="text-xs text-slate-300 italic font-normal">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-start gap-2 max-w-[200px]">
                           <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                           <span className={`text-xs ${lead.suggestion === 'N/A' ? 'text-slate-300 italic' : 'text-slate-600'}`}>
                             {lead.suggestion || 'Analyze for improvements'}
                           </span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {lead.mapsUrl !== 'N/A' ? (
                          <a href={lead.mapsUrl} target="_blank" className="inline-flex items-center justify-center p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                            <MapIcon className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-300">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : !loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-24 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-4">
                        <div className="bg-slate-50 p-8 rounded-full border border-dashed border-slate-200">
                          <Building2 className="w-16 h-16 opacity-20" />
                        </div>
                        <div className="max-w-md mx-auto">
                          <p className="text-xl font-bold text-slate-600">Start Extracting Leads</p>
                          <p className="text-sm mt-2">Enter the business type and location in the sidebar to extract contact info and AI marketing tips into a professional list.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

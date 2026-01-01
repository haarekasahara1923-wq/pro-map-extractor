
import { GoogleGenAI } from "@google/genai";
import { BusinessLead, SearchParams } from "../types";

const API_KEY = process.env.API_KEY || "";

export const fetchBusinessLeads = async (
  params: SearchParams,
  userLocation?: { latitude: number; longitude: number }
): Promise<{ leads: BusinessLead[]; rawText: string }> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `Find exactly ${params.limit} businesses of type "${params.businessType}" in "${params.location}".
  
  TASK 1: EXTRACT DATA (INDIVIDUAL BUSINESSES)
  For each business, you MUST provide these details. If missing, write "N/A":
  ---
  Name: [Business Name]
  Address: [Full Address]
  Mobile: [Contact Phone Number]
  WhatsApp: [WhatsApp Number]
  Email: [Official Email Address]
  Website: [Official Website URL]
  Maps: [Google Maps Link]
  Suggestion: [Very brief marketing tip, e.g., "Needs website", "Low reviews", "SEO required", "Add WhatsApp"]
  ---

  TASK 2: GENERAL MARKET ANALYSIS
  After the list, provide a concise summary titled "MARKET OVERVIEW". 
  Analyze the competition in "${params.location}" for "${params.businessType}".

  Use Google Search and Google Maps to verify contact details and check if websites exist.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: userLocation ? {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude
            } : undefined
          }
        }
      },
    });

    const rawText = response.text || "";
    
    // Split the text to extract the business segments and the general overview
    const parts = rawText.split(/MARKET OVERVIEW/i);
    const dataPart = parts[0] || "";
    const suggestionsPart = parts[1] || "No overall overview generated.";

    const segments = dataPart.split('---').filter(s => s.trim().length > 20);
    
    const leads: BusinessLead[] = segments.map((segment, index) => {
      const getField = (label: string) => {
        const regex = new RegExp(`${label}:\\s*([^\\n]+)`, 'i');
        const match = segment.match(regex);
        const val = match ? match[1].trim() : "N/A";
        if (/^n\/?a$/i.test(val) || val === "-" || val === "None") return "N/A";
        return val;
      };

      const name = getField("Name");
      
      return {
        id: `lead-${Date.now()}-${index}`,
        name: name === "N/A" ? `Business ${index + 1}` : name,
        address: getField("Address"),
        phoneNumber: getField("Mobile"),
        whatsapp: getField("WhatsApp"),
        email: getField("Email"),
        website: getField("Website"),
        mapsUrl: getField("Maps"),
        suggestion: getField("Suggestion"),
        category: params.businessType,
        location: params.location,
      };
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const mapsLeads = chunks
      .filter((c: any) => c.maps)
      .map((c: any, i: number) => ({
        id: `m-lead-${Date.now()}-${i}`,
        name: c.maps.title,
        mapsUrl: c.maps.uri,
        address: "Refer to Maps",
        phoneNumber: "N/A",
        whatsapp: "N/A",
        email: "N/A",
        website: "N/A",
        suggestion: "Analyze for improvements",
        category: params.businessType,
        location: params.location,
      }));

    const finalLeads = leads.length > 0 ? leads : mapsLeads;

    return { leads: finalLeads.slice(0, params.limit), rawText: suggestionsPart.trim() };
  } catch (error) {
    console.error("Error fetching business leads:", error);
    throw error;
  }
};

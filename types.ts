
export interface BusinessLead {
  id: string;
  name: string;
  address: string;
  phoneNumber?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  mapsUrl?: string;
  suggestion?: string;
  category: string;
  location: string;
}

export interface SearchParams {
  businessType: string;
  location: string;
  limit: number;
}

export interface GroundingChunk {
  maps?: {
    uri: string;
    title: string;
  };
}

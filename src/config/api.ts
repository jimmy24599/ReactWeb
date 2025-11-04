// API Configuration
export const API_CONFIG = {
  // OpenRouter API for chatbot
  OPENROUTER_API_KEY: import.meta.env.VITE_AAA_API_KEY,
  OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
  
  // Google Maps API for locations
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  
  // Backend API
  BACKEND_BASE_URL: import.meta.env.VITE_API_BASE_URL,
}

// OpenRouter model configuration
export const OPENROUTER_CONFIG = {
  model: 'tngtech/deepseek-r1t2-chimera:free',
  maxTokens: 40000,
  temperature: 0.7,
  headers: {
    'HTTP-Referer': window.location.origin,
    'X-Title': 'Warehouse Management Assistant'
  }
}

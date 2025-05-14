import fetch from "node-fetch";
import { JSDOM } from "jsdom";

// Basic scraper to extract product data from URLs
export interface ScrapedProduct {
  name: string;
  price: number;
  currency: string;
  imageUrl?: string;
}

// Gemini API for when traditional scraping fails
const GEMINI_API_KEY = "AIzaSyDn0iT9GoSyP3IRQqB-kYqmjA7btK9SPM0";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

interface GeminiRequest {
  contents: {
    parts: {
      text: string;
    }[];
  }[];
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

async function getProductInfoFromGemini(url: string): Promise<ScrapedProduct | null> {
  try {
    console.log("Using Gemini API for product info:", url);
    
    const prompt = `
      You are a product data extraction expert. Extract EXACT product information from this Amazon URL: ${url}
      
      Don't make up information or guess! If you cannot access the actual page, explicitly say so.
      
      Return ONLY a valid JSON object with these fields:
      {
        "name": "Full product name without modifications, exactly as shown on the page",
        "price": 19.99,
        "currency": "INR",
        "imageUrl": "https://example.com/image.jpg"
      }
      
      IMPORTANT INSTRUCTIONS:
      - For name, extract the EXACT product name as displayed on the Amazon page
      - For price, return ONLY a number without currency symbols (e.g., 1999 not ₹1,999)
      - For currency, use the exact currency code from the page (INR for Indian prices, USD for US, etc.)
      - If you cannot determine a field, use null for imageUrl and "Unknown Product" for name
      - For price, use 0 if unknown
      - DO NOT return a fixed/dummy response
    `;
    
    const requestBody: GeminiRequest = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ]
    };
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      console.error(`Gemini API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json() as GeminiResponse;
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error("No response from Gemini API");
      return null;
    }
    
    const text = data.candidates[0].content.parts[0].text;
    console.log("Gemini response:", text);
    
    // Extract the JSON object from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in Gemini response");
      return null;
    }
    
    const productInfo = JSON.parse(jsonMatch[0]);
    
    return {
      name: productInfo.name || "Unknown Product",
      price: typeof productInfo.price === 'number' ? productInfo.price : 0,
      currency: productInfo.currency || "USD",
      imageUrl: productInfo.imageUrl || undefined
    };
  } catch (error) {
    console.error("Error getting product info from Gemini:", error);
    return null;
  }
}

// Handle Amazon URLs
function expandAmazonUrl(url: string): string {
  try {
    console.log("Original URL:", url);
    
    // Direct pass-through for full Amazon URLs
    if (url.includes('amazon.com')) {
      console.log("Amazon.com URL detected, using as-is");
      return url;
    }
    
    // For shortened URLs like amzn.in/d/PRODUCTID
    if (url.includes('amzn.in') || url.includes('amzn.to')) {
      let productId = '';
      
      // Pattern like amzn.in/d/abc123
      if (url.includes('/d/')) {
        const parts = url.split('/d/');
        if (parts.length > 1) {
          productId = parts[1].split('?')[0].split('/')[0].trim();
          console.log("Extracted product ID from /d/ format:", productId);
        }
      } 
      
      // If we couldn't extract ID using the /d/ pattern, try another approach
      if (!productId) {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
        productId = pathParts[pathParts.length - 1].trim();
        console.log("Extracted product ID using pathname:", productId);
      }
      
      // If we're processing an Indian Amazon URL, keep it that way
      let expandedUrl = '';
      if (url.includes('amzn.in')) {
        expandedUrl = `https://www.amazon.in/dp/${productId}`;
      } else {
        // Default to US Amazon
        expandedUrl = `https://www.amazon.com/dp/${productId}`;
      }
      
      console.log("Expanded URL:", expandedUrl);
      return expandedUrl;
    }
    
    // Return unchanged if it's not an Amazon URL
    return url;
  } catch (error) {
    console.error("Error expanding Amazon URL:", error);
    return url; // Return original URL if expansion fails
  }
}

// Simple scraper that attempts to extract data from common e-commerce sites
export async function scrapeProduct(url: string): Promise<ScrapedProduct> {
  try {
    // First, try to expand shortened URLs
    const expandedUrl = expandAmazonUrl(url);
    console.log(`Attempting to scrape: ${expandedUrl}`);
    
    // Step 1: First try traditional scraping
    try {
      const response = await fetch(expandedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        redirect: 'follow'
      });

      if (response.ok) {
        const html = await response.text();
        const dom = new JSDOM(html);
        const document = dom.window.document;

        const extractedInfo = extractProductInfo(document, expandedUrl);
        
        // If we got meaningful data, return it
        if (extractedInfo.name !== 'Unknown Product' && extractedInfo.price > 0) {
          console.log("Successfully extracted product info using traditional scraping:", extractedInfo);
          return extractedInfo;
        }
      } else {
        console.error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error in traditional scraping: ${error}`);
    }
    
    // Step 2: If traditional scraping failed, use Gemini API
    console.log("Traditional scraping failed, trying Gemini API...");
    const geminiResult = await getProductInfoFromGemini(url);
    
    if (geminiResult) {
      console.log("Successfully extracted product info using Gemini API:", geminiResult);
      return geminiResult;
    }
    
    // Step 3: If both methods failed, return a basic fallback
    console.log("Both scraping methods failed, using fallback data");
    return {
      name: `Product from ${new URL(url).hostname}`,
      price: 0,
      currency: 'USD',
      imageUrl: undefined
    };
  } catch (error) {
    console.error(`Error in scraping process: ${error}`);
    
    // Return fallback data rather than throwing
    return {
      name: `Product from ${new URL(url).hostname}`,
      price: 0,
      currency: 'USD',
      imageUrl: undefined
    };
  }
}

function extractProductInfo(document: Document, url: string): ScrapedProduct {
  let name = '';
  let price = 0;
  let currency = 'USD';
  let imageUrl: string | undefined;
  
  // Detect if this is an Amazon URL
  const isAmazon = url.includes('amazon.com') || url.includes('amazon.in') || url.includes('amzn.in') || url.includes('amzn.to');
  
  // Try to extract product name
  // Common selectors for product names
  const nameSelectors = [
    // Amazon specific selectors
    '#productTitle',
    '#title',
    '.product-title',
    // General selectors
    'h1.product-title',
    'h1.product-name',
    'h1.product_title',
    'h1#productTitle',
    'h1.title',
    'h1',
  ];

  for (const selector of nameSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent) {
      name = element.textContent.trim();
      break;
    }
  }

  // Try to extract price
  // Common selectors for prices
  const priceSelectors = [
    // Amazon specific selectors
    '.a-price .a-offscreen',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '.a-color-price',
    '#price_inside_buybox',
    '#buyNewSection .a-color-price',
    // General selectors
    'span.price',
    'div.price',
    'span.product-price',
    'span.current-price',
    'p.price',
    '[data-price]',
    'meta[property="product:price:amount"]',
    'span.price-value',
  ];

  for (const selector of priceSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      let priceText = '';
      
      if (selector === 'meta[property="product:price:amount"]') {
        priceText = element.getAttribute('content') || '';
      } else if (element.hasAttribute('data-price')) {
        priceText = element.getAttribute('data-price') || '';
      } else {
        priceText = element.textContent || '';
      }
      
      // Extract numbers from price string
      const priceMatch = priceText.replace(/[^\d.,]/g, '').replace(',', '.');
      if (priceMatch) {
        price = parseFloat(priceMatch);
        break;
      }
    }
  }

  // For Amazon, try to get price from JSON data embedded in the page
  if (isAmazon && price === 0) {
    try {
      // Look for pricing data in scripts
      const scripts = document.querySelectorAll('script');
      for (let i = 0; i < scripts.length; i++) {
        const scriptContent = scripts[i].textContent || '';
        
        // Look for price patterns
        if (scriptContent.includes('"price":')) {
          const priceMatch = scriptContent.match(/"price":\s*"([^"]+)"/);
          if (priceMatch && priceMatch[1]) {
            const extractedPrice = parseFloat(priceMatch[1].replace(/[^\d.,]/g, '').replace(',', '.'));
            if (!isNaN(extractedPrice) && extractedPrice > 0) {
              price = extractedPrice;
              break;
            }
          }
        }
      }
    } catch (e) {
      console.error('Error extracting price from JSON:', e);
    }
  }

  // Try to extract currency
  // First check if the price text includes currency symbols
  if (price > 0) {
    const allPriceTexts = [];
    for (const selector of priceSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        allPriceTexts.push(element.textContent.trim());
      }
    }
    
    // Check for currency symbols in the price texts
    const currencyMap: {[key: string]: string} = {
      '₹': 'INR',
      '$': 'USD', 
      '€': 'EUR',
      '£': 'GBP',
      '¥': 'JPY'
    };
    
    for (const priceText of allPriceTexts) {
      for (const [symbol, code] of Object.entries(currencyMap)) {
        if (priceText.includes(symbol)) {
          currency = code;
          break;
        }
      }
      if (currency !== 'USD') break;  // Found a non-default currency
    }
  }
  
  // If still using default, try other selectors
  if (currency === 'USD') {
    const currencySelectors = [
      'meta[property="product:price:currency"]',
      'span.currency',
    ];

    for (const selector of currencySelectors) {
      const element = document.querySelector(selector);
      if (element) {
        if (selector === 'meta[property="product:price:currency"]') {
          currency = element.getAttribute('content') || 'USD';
        } else {
          currency = element.textContent?.trim() || 'USD';
        }
        break;
      }
    }
  }

  // Try to extract product image
  const imageSelectors = [
    // Amazon specific selectors
    '#landingImage',
    '#imgBlkFront',
    '#main-image',
    // General selectors
    'img.product-image',
    'img.main-image',
    'img#main-product-image',
    'img#product-image',
    'img#productImage',
    'div.product-image img',
    'meta[property="og:image"]',
  ];

  for (const selector of imageSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      if (selector === 'meta[property="og:image"]') {
        imageUrl = element.getAttribute('content') || undefined;
      } else {
        imageUrl = element.getAttribute('src') || element.getAttribute('data-old-hires') || undefined;
      }
      
      // Ensure URL is absolute
      if (imageUrl && !imageUrl.startsWith('http')) {
        try {
          const urlObj = new URL(url);
          const base = `${urlObj.protocol}//${urlObj.host}`;
          imageUrl = imageUrl.startsWith('/') 
            ? `${base}${imageUrl}` 
            : `${base}/${imageUrl}`;
        } catch (e) {
          console.error('Error parsing image URL:', e);
        }
      }
      
      break;
    }
  }

  // If we couldn't find any information, provide default values
  if (!name) {
    // Try to get the product name from the URL
    try {
      const urlObj = new URL(url);
      const host = urlObj.hostname;
      if (host.includes('amazon')) {
        // For Amazon URLs, try to extract the product ID
        const match = url.match(/\/dp\/([A-Z0-9]+)/);
        if (match && match[1]) {
          name = `Amazon Product (${match[1]})`;
        } else {
          name = 'Amazon Product';
        }
      } else {
        name = `Product from ${host}`;
      }
    } catch {
      name = 'Unknown Product';
    }
  }
  
  if (price === 0) price = 0.00;

  return {
    name,
    price,
    currency,
    imageUrl
  };
}

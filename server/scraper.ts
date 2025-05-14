import fetch from "node-fetch";
import { JSDOM } from "jsdom";

// Basic scraper to extract product data from URLs
export interface ScrapedProduct {
  name: string;
  price: number;
  currency: string;
  imageUrl?: string;
}

// Handle shortened Amazon URLs
function expandAmazonUrl(url: string): string {
  // Handle shortened Amazon URLs like amzn.in
  if (url.includes('amzn.in') || url.includes('amzn.to')) {
    // For Amazon shortened URLs, we'll need to construct a fallback URL
    if (url.includes('/d/')) {
      const parts = url.split('/d/');
      if (parts.length > 1) {
        const productId = parts[1].split('?')[0].split('/')[0];
        // Return a full Amazon URL based on the product ID
        return `https://www.amazon.com/dp/${productId}`;
      }
    }
  }
  return url;
}

// Simple scraper that attempts to extract data from common e-commerce sites
export async function scrapeProduct(url: string): Promise<ScrapedProduct> {
  try {
    // Expand shortened URLs if necessary
    const expandedUrl = expandAmazonUrl(url);
    console.log(`Attempting to scrape: ${expandedUrl}`);
    
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

    if (!response.ok) {
      console.error(`Failed to fetch: ${response.status} ${response.statusText}`);
      
      // If we can't scrape, return fallback data with the URL information
      return {
        name: `Product from ${new URL(url).hostname}`,
        price: 0,
        currency: 'USD',
        imageUrl: undefined
      };
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const extractedInfo = extractProductInfo(document, expandedUrl);
    console.log("Extracted product info:", extractedInfo);
    return extractedInfo;
  } catch (error) {
    console.error(`Error scraping product: ${error}`);
    
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

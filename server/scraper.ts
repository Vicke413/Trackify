import fetch from "node-fetch";
import { JSDOM } from "jsdom";

// Basic scraper to extract product data from URLs
export interface ScrapedProduct {
  name: string;
  price: number;
  currency: string;
  imageUrl?: string;
}

// Simple scraper that attempts to extract data from common e-commerce sites
export async function scrapeProduct(url: string): Promise<ScrapedProduct> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product page: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    return extractProductInfo(document, url);
  } catch (error) {
    console.error(`Error scraping product: ${error}`);
    throw new Error(`Failed to scrape product information: ${error}`);
  }
}

function extractProductInfo(document: Document, url: string): ScrapedProduct {
  let name = '';
  let price = 0;
  let currency = 'USD';
  let imageUrl: string | undefined;

  // Try to extract product name
  // Common selectors for product names
  const nameSelectors = [
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
    'span.price',
    'div.price',
    'span.product-price',
    'span#priceblock_ourprice',
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

  // Try to extract currency
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

  // Try to extract product image
  const imageSelectors = [
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
        imageUrl = element.getAttribute('src') || undefined;
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
  if (!name) name = 'Unknown Product';
  if (price === 0) price = 0.00;

  return {
    name,
    price,
    currency,
    imageUrl
  };
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function to merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency based on code
export function formatCurrency(amount: number, currencyCode = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Calculate percentage difference between two prices
export function calculatePriceDifference(currentPrice: number, previousPrice: number) {
  if (previousPrice === 0) return 0;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
}

// Format percentage for display
export function formatPercentage(percentage: number) {
  return `${percentage > 0 ? "+" : ""}${percentage.toFixed(1)}%`;
}

// Format date for display
export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format date and time for display
export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Extract domain from URL
export function extractDomain(url: string) {
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    return domain;
  } catch (error) {
    return url;
  }
}

// Get time elapsed since date
export function getTimeElapsed(date: Date | string) {
  const seconds = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / 1000
  );

  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + " years ago";
  }

  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months ago";
  }

  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " days ago";
  }

  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hours ago";
  }

  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutes ago";
  }

  return Math.floor(seconds) + " seconds ago";
}

// Generate a list of timestamps for demo price history
export function generateTimeLabels(count: number) {
  const now = new Date();
  const labels = [];
  
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
  }
  
  return labels;
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// Get color styling for price change (positive=green, negative=red)
export function getPriceChangeColor(change: number) {
  if (change < 0) return "price-decrease";
  if (change > 0) return "price-increase";
  return "price-unchanged";
}

// Get icon name for price change
export function getPriceChangeIcon(change: number) {
  if (change < 0) return "trending-down";
  if (change > 0) return "trending-up";
  return "minus";
}

// Simple sentiment analysis utility
export function analyzeSentiment(text: string): {
  sentiment: "positive" | "neutral" | "negative";
  positiveScore: number;
  negativeScore: number;
} {
  const textLower = text.toLowerCase();
  
  const positiveWords = [
    "good", "great", "excellent", "awesome", "amazing", 
    "love", "like", "easy", "intuitive", "helpful", 
    "useful", "beautiful", "clean", "nice", "best", 
    "perfect", "improved", "impressive"
  ];
  
  const negativeWords = [
    "bad", "terrible", "awful", "horrible", "hate", 
    "dislike", "difficult", "confusing", "complicated", 
    "ugly", "poor", "worst", "hard", "impossible", 
    "bug", "error", "issue", "problem"
  ];
  
  let positiveScore = 0;
  let negativeScore = 0;
  
  // Count occurrences of positive and negative words
  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = textLower.match(regex);
    if (matches) {
      positiveScore += matches.length;
    }
  });
  
  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = textLower.match(regex);
    if (matches) {
      negativeScore += matches.length;
    }
  });
  
  // Determine sentiment based on scores
  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  
  if (positiveScore > negativeScore) {
    sentiment = "positive";
  } else if (negativeScore > positiveScore) {
    sentiment = "negative";
  }
  
  return { sentiment, positiveScore, negativeScore };
}

// This is a client-side alternative to the server-side API call
// Users can choose to use this or make the API call for sentiment analysis
export async function analyzeSentimentAPI(text: string) {
  try {
    const response = await fetch('/api/analyze-sentiment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to analyze sentiment');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    // Fallback to client-side analysis
    return analyzeSentiment(text);
  }
}

import OpenAI from "openai";
import rateLimiter from './rateLimit.js';
const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
});

const form = document.querySelector("#posterForm");
const movieTitle = document.querySelector("#movie-title");
const artStyles = document.querySelector("#art-styles");
const posterOutput = document.querySelector("#poster-output");

/* 
  Image generation project requirements:
    - Create a prompt from the movie title and art style submitted by the user
    - Use the image generations endpoint to provide `dall-e-3`
      or `dall-e-2` the prompt created by the form submission
    - Display the final poster image within the `posterOutput` div

  Stretch goals: 
    - On submit, display text describing the image being generated 
    - Provide user feedback when any errors occur
*/

form.addEventListener("submit", function (event) {
  event.preventDefault();
  const prompt = `An imaginative poster inspired by ${movieTitle.value} in the style of ${artStyles.value}`;
  console.log(prompt);
  generatePoster(prompt);
  form.reset();
});

async function generatePoster(prompt) {
  try {
    // Show initial loading state
    posterOutput.innerHTML = '<p>Preparing to generate poster...</p>';
    
    // Wait for rate limiter before making the API call
    await rateLimiter.waitForToken();
    
    // Update status to generating
    posterOutput.innerHTML = '<p>Generating poster with DALL-E...</p>';
    
    const image = await openai.images.generate({
      model: "dall-e-2",
      prompt: prompt,
      size: "1024x1024",  // Explicitly set size
      quality: "standard", // Explicitly set quality
    });

    if (!image.data?.[0]?.url) {
      throw new Error('No image URL received from API');
    }

    const imgUrl = image.data[0].url;
    
    // Create new image element with loading handler
    const img = new Image();
    img.onload = () => {
      posterOutput.innerHTML = ''; // Clear loading message
      posterOutput.appendChild(img);
    };
    img.onerror = () => {
      throw new Error('Failed to load generated image');
    };
    img.src = imgUrl;
    img.alt = "Generated movie poster";
    img.className = "generated-poster";

  } catch (error) {
    console.error('Error generating poster:', error);
    
    let errorMessage = 'Error generating poster. Please try again later.';
    
    if (error.message.includes('Rate limit exceeded')) {
      errorMessage = 'Rate limit reached. Please wait a minute before trying again.';
    } else if (error.message.includes('Queue cleared')) {
      errorMessage = 'Request cancelled. Please try again.';
    } else if (error.message.includes('Failed to load generated image')) {
      errorMessage = 'Failed to load the generated image. Please try again.';
    }
    
    posterOutput.innerHTML = `<p class="error">${errorMessage}</p>`;
  }
}

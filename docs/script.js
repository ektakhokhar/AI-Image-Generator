const themeToggle = document.querySelector(".theme-toggle");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");
const generateBtn = document.querySelector(".generate-btn");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const gridGallery = document.querySelector(".gallery-grid");
const promptBtn = document.querySelector(".prompt-btn");


const examplePrompts = [
  "A magic forest with glowing plants and fairy homes among giant mushrooms",
  "An old steampunk airship floating through golden clouds at sunset",
  "A future Mars colony with glass domes and gardens against red mountains",
  "A dragon sleeping on gold coins in a crystal cave",
  "An underwater kingdom with merpeople and glowing coral buildings",
  "A floating island with waterfalls pouring into clouds below",
  "A witch's cottage in fall with magic herbs in the garden",
  "A robot painting in a sunny studio with art supplies around it",
  "A magical library with floating glowing books and spiral staircases",
  "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
  "A cosmic beach with glowing sand and an aurora in the night sky",
  "A medieval marketplace with colorful tents and street performers",
  "A cyberpunk city with neon signs and flying cars at night",
  "A peaceful bamboo forest with a hidden ancient temple",
  "A giant turtle carrying a village on its back in the ocean",
];

// Set theme based on saved preference or system default
(() => {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
  document.body.classList.toggle("dark-theme", isDarkTheme);
  themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();

// Switch between light and dark themes
const toggleTheme = () => {
  const isDarkTheme = document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
  themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
};

// Calculate width/height based on chosen ratio
const getImageDimensions = (aspectRatio, baseSize = 512) => {
  const [width, height] = aspectRatio.split("/").map(Number);
  const scaleFactor = baseSize / Math.sqrt(width * height);

  let calculatedWidth = Math.round(width * scaleFactor);
  let calculatedHeight = Math.round(height * scaleFactor);

  // Ensure dimensions are multiples of 16 (API model requirements)
  calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
  calculatedHeight = Math.floor(calculatedHeight / 16) * 16;

  return { width: calculatedWidth, height: calculatedHeight };
};

// Replace Loading spinner with the actual image
const updateImageCard = (imgIndex, imgUrl) => {
  const imgCard = document.getElementById(`img-card-${imgIndex}`);
  if (!imgCard) return;

  imgCard.classList.remove("loading");
  imgCard.classList.remove("error");
  imgCard.innerHTML = `<img src="${imgUrl}" alt="Generated Image" class="result-img">
            <div class="img-overlay">
              <a href="${imgUrl}" class="img-download-btn" download="${Date.now()}.png">
                <i class="fa-solid fa-download"></i>
              </a>
            </div>`;
};

const generateImages = async (selectedModel, imageCount, aspectRatio, promptText) => {
  const { width, height } = getImageDimensions(aspectRatio);
  generateBtn.setAttribute("disabled", "true");

  try {
    const response = await fetch('https://ai-image-generator-1zgx.onrender.com/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: selectedModel,
        prompt: promptText,
        width,
        height,
        count: imageCount,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to generate images");
    }

    const data = await response.json();

    data.images.forEach((base64Image, i) => {
      // Prepend base64 prefix if not present
      const imgSrc = base64Image.startsWith("data:image")
        ? base64Image
        : `data:image/png;base64,${base64Image}`;
      updateImageCard(i, imgSrc);
    });

  } catch (error) {
    console.error(error);
    for (let i = 0; i < imageCount; i++) {
      const imgCard = document.getElementById(`img-card-${i}`);
      if (!imgCard) continue;
      imgCard.classList.replace("loading", "error");
      const statusText = imgCard.querySelector(".status-text");
      if (statusText) {
        statusText.textContent = "Generation failed! Check console for details.";
      }
    }
  } finally {
    generateBtn.removeAttribute("disabled");
  }
};

// Create placeholder cards with loading spinner
const createImageCards = (selectedModel, imageCount, aspectRatio, promptText) => {
  gridGallery.innerHTML = "";

  for (let i = 0; i < imageCount; i++) {
    gridGallery.innerHTML += `<div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${aspectRatio}">
        <div class="status-container">
          <div class="spinner"></div>
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p class="status-text">Generating...</p>
        </div>
      </div>`;
  }

  generateImages(selectedModel, imageCount, aspectRatio, promptText);
};

// Handle form submission
const handleFormSubmit = (e) => {
  e.preventDefault();

  // Get form value
  const selectedModel = modelSelect.value;
  const imageCount = parseInt(countSelect.value) || 1;
  const aspectRatio = ratioSelect.value || "1/1";
  const promptText = promptInput.value.trim();

  if (!promptText) {
    alert("Please enter a prompt to generate images.");
    return;
  }

  createImageCards(selectedModel, imageCount, aspectRatio, promptText);
};

// Fill prompt input with random example
promptBtn.addEventListener("click", () => {
  const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
  promptInput.value = prompt;
  promptInput.focus();
});

promptForm.addEventListener("submit", handleFormSubmit);
themeToggle.addEventListener("click", toggleTheme);

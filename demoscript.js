const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessage = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = fileUploadWrapper.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

const API_KEY = "AIzaSyCGYKS6G7gmVlKIAif38GaXT_lpysyz73E";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const userData = { message:null, file:{ data:null, mime_type:null }};
const chatHistory = [];
const initialInputHeight = messageInput.scrollHeight;

// Keywords related to home gardening
const gardeningKeywords = [
  "plant", "garden", "flowers", "vegetables", "herbs", "compost", "seeds", 
  "soil", "watering", "garden tools", "plant care", "indoor plants", "outdoor garden","balcony garden","terrace garden","vertical garden","hi","hello","hey","weather","summer","winter","rainy"
];

// Function to check if the message is related to home gardening
const isGardeningRelated = (message) => {
  const lowerCaseMessage = message.toLowerCase();
  return gardeningKeywords.some(keyword => lowerCaseMessage.includes(keyword));
};

const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
}

const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");

  // Check if the message is gardening-related
  if (!isGardeningRelated(userData.message)) {
    messageElement.innerText = "Oops! The content is not related to Ecovana chatbot. Please try again with relevant content.";
    messageElement.style.color = "#ff0000";
    const avatarImg = incomingMessageDiv.querySelector('.bot-avatar img');
    if (avatarImg) avatarImg.src = "./aiimg2.png";
    return;
  }

  chatHistory.push({
    role: "user",
    parts: [{ text: userData.message }, ...(userData.file.data ? [{ inline_data: userData.file }] : [])]
  });

  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: chatHistory })
  };

  try {
    const response = await fetch(API_URL, requestOptions);
    const data = await response.json();

    if (!response.ok || !data.candidates) {
      // Check for overload or general error
      const errorMsg = data.error?.message || "Something went wrong. Please try again shortly.";
      throw new Error(errorMsg);
    }

    const apiText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
    messageElement.innerText = apiText;
    chatHistory.push({ role: "model", parts: [{ text: apiText }] });

    const avatarImg = incomingMessageDiv.querySelector('.bot-avatar img');
    if (avatarImg) avatarImg.src = "./aiimg2.png";

  } catch (err) {
    let userFriendlyError = err.message;

    // Handle specific overload error from Gemini
    if (userFriendlyError.toLowerCase().includes("model is overloaded")) {
      userFriendlyError = "🌱 Sorry! Our gardening assistant is experiencing high traffic. Please try again in a few moments.";
    }

    messageElement.innerText = userFriendlyError;
    messageElement.style.color = "#ff0000";

    const avatarImg = incomingMessageDiv.querySelector('.bot-avatar img');
    if (avatarImg) avatarImg.src = "./aiimg2.png";
  } finally {
    userData.file = {};
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  }
};


const handleOutgoingMessage = (e) => {
  e.preventDefault();
  userData.message = messageInput.value.trim();
  if (!userData.message && !userData.file.data) return;

  messageInput.value = "";
  messageInput.dispatchEvent(new Event("input"));
  fileUploadWrapper.classList.remove("file-uploaded");

  const content = `<div class="message-text"></div>`;
  const userMsgDiv = createMessageElement(content, "user-message");
  const messageTextDiv = userMsgDiv.querySelector(".message-text");

  messageTextDiv.innerText = userData.message;

  if (userData.file.data) {
    const imgContainer = document.createElement('div');
    const img = document.createElement('img');
    img.src = `data:${userData.file.mime_type};base64,${userData.file.data}`;
    img.className = 'attachment';
    imgContainer.appendChild(img);
    messageTextDiv.appendChild(imgContainer);
  }

  chatBody.appendChild(userMsgDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

  setTimeout(() => {
    const thinkingContent = `<div class="bot-avatar"><img src="./aiimg2.png" alt="..."></div><div class="message-text"></div>`;
    const botMsgDiv = createMessageElement(thinkingContent, "bot-message", "thinking");
    chatBody.appendChild(botMsgDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    generateBotResponse(botMsgDiv);
  }, 600);
};

// Input auto-resize
messageInput.addEventListener("input", () => {
  messageInput.style.height = `${initialInputHeight}px`;
  messageInput.style.height = `${messageInput.scrollHeight}px`;
  document.querySelector(".chat-form").style.borderRadius = messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});

// Enter key sends
messageInput.addEventListener("keydown", (e) => {
  const txt = e.target.value.trim();
  if (e.key === "Enter" && !e.shiftKey && txt && window.innerWidth > 768) {
    handleOutgoingMessage(e);
  }
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    fileInput.value = "";
    fileUploadWrapper.querySelector("img").src = e.target.result;
    fileUploadWrapper.classList.add("file-uploaded");
    userData.file = { data: e.target.result.split(",")[1], mime_type: file.type };
  };
  reader.readAsDataURL(file);
});

fileCancelButton.addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("file-uploaded");
});

// UI toggles
sendMessage.addEventListener("click", handleOutgoingMessage);
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());
closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));

// form submission

const gardenForm = document.getElementById('gardenForm');

if (gardenForm) {
  gardenForm.addEventListener('submit', function(event) {
    event.preventDefault();

    // Collect all values from the form.
    const formValues = {
      gardenType: document.querySelector('input[name="gardenType"]').value,
      sunlight: document.querySelector('input[name="sunlight"]').value,
      weather: document.querySelector('input[name="weather"]').value,
      plantList: document.querySelector('input[name="plantList"]').value,
      soilType: document.querySelector('input[name="soilType"]').value,
      fertilizer: document.querySelector('input[name="fertilizer"]:checked')?.value || 'Not selected',
      userQuery: document.querySelector('input[name="userQuery"]').value,
      imageFile: document.querySelector('input[name="image"]').files[0] || null
    };

    const prompt = generateGardenPrompt(formValues);

    // If an image was uploaded, read it as a Data URL before sending it to the chatbot.
    if (formValues.imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileInfo = { data: e.target.result.split(",")[1], mime_type: formValues.imageFile.type, raw_src: e.target.result };
        triggerChatbotWithPrompt(prompt, fileInfo);
      };
      reader.readAsDataURL(formValues.imageFile);
    } else {
      // If no image, send the prompt to the chatbot immediately.
      triggerChatbotWithPrompt(prompt, null);
    }
  });
}


function generateGardenPrompt(formValues) {
  let prompt = "I need expert gardening advice for my specific situation. Here are the details:\n\n";

  prompt += `Garden Type: ${formValues.gardenType || 'Not specified'}\n`;
  prompt += `Daily Sunlight: ${formValues.sunlight || 'Not specified'}\n`;
  prompt += `Local Weather: ${formValues.weather || 'Not specified'}\n`;
  prompt += `Desired Plants: ${formValues.plantList || 'Not specified'}\n`;
  prompt += `Soil Type: ${formValues.soilType || 'Not specified'}\n`;

  // Handle the maintenance array

  prompt += `Fertilizer Preference: ${formValues.fertilizer || 'Not specified'}\n`;

  // Add the user's custom query if it exists
  if (formValues.userQuery) {
    prompt += `\n**My specific question or problem is:**\n"${formValues.userQuery}"\n`;
  }

  prompt += "\nBased on all this information, please provide a detailed step-by-step plan. Include tips on watering schedules, soil preparation, potential challenges to watch out for, and a description of what a thriving garden under these conditions would look like.";
  return prompt;
}


function triggerChatbotWithPrompt(promptText, fileInfo = null) {
  document.body.classList.add("show-chatbot");
  // 2. Set the global user data for the API call.
  userData.message = promptText;
  userData.file = fileInfo ? { data: fileInfo.data, mime_type: fileInfo.mime_type } : { data: null, mime_type: null };

  // 3. Update the chatbot's file preview UI if a file was passed.
  if (fileInfo && fileInfo.data) {
    fileUploadWrapper.querySelector("img").src = fileInfo.raw_src;
    fileUploadWrapper.classList.add("file-uploaded");
  }

  // 4. Create and display the user's message in the chat, mimicking demoscript.js logic.
  const content = `<div class="message-text"></div>`;
  const userMsgDiv = createMessageElement(content, "user-message");
  const messageTextDiv = userMsgDiv.querySelector(".message-text");

  messageTextDiv.innerText = promptText;

  if (userData.file.data) {
    const imgContainer = document.createElement('div');
    const img = document.createElement('img');
    img.src = `data:${userData.file.mime_type};base64,${userData.file.data}`;
    img.className = 'attachment';
    imgContainer.appendChild(img);
    messageTextDiv.appendChild(imgContainer);
  }

  chatBody.appendChild(userMsgDiv);

  // 5. Show bot "thinking" indicator and then generate the actual response.
  setTimeout(() => {
    const thinkingContent = `<div class="bot-avatar"><img src="./aiimg2.png" alt="Bot thinking..."></div><div class="message-text"></div>`;
    const botMsgDiv = createMessageElement(thinkingContent, "bot-message", "thinking");
    chatBody.appendChild(botMsgDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    generateBotResponse(botMsgDiv);
  }, 600);
}

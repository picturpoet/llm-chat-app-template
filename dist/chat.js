/**
 * AutoRAG Chat App Frontend
 *
 * Handles the chat UI interactions and communication with the AutoRAG API.
 */

// DOM elements
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");

// Chat state
let chatHistory = [
  {
    role: "assistant",
    content:
      "Hello! I'm an AutoRAG-powered assistant that can help you find information from your knowledge base. What would you like to know?",
  },
];
let isProcessing = false;

// Auto-resize textarea as user types
userInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});

// Send message on Enter (without Shift)
userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Send button click handler
sendButton.addEventListener("click", sendMessage);

/**
 * Sends a message to the AutoRAG API and processes the response
 */
async function sendMessage() {
  const message = userInput.value.trim();

  // Don't send empty messages
  if (message === "" || isProcessing) return;

  // Disable input while processing
  isProcessing = true;
  userInput.disabled = true;
  sendButton.disabled = true;

  // Add user message to chat
  addMessageToChat("user", message);

  // Clear input
  userInput.value = "";
  userInput.style.height = "auto";

  // Show typing indicator
  typingIndicator.classList.add("visible");

  // Add message to history
  chatHistory.push({ role: "user", content: message });

  try {
    // Create new assistant response element
    const assistantMessageEl = document.createElement("div");
    assistantMessageEl.className = "message assistant-message";
    assistantMessageEl.innerHTML = "<p></p>";
    chatMessages.appendChild(assistantMessageEl);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Call AutoRAG API directly
    const response = await fetch("https://api.cloudflare.com/client/v4/accounts/718cffdc8670cff4c3d9b45b84ef88f9/autorag/rags/aeroarmour-brandbox/ai-search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer kDFUMalyWWXP0g_EiutMz6EMIzdB-LPjZWVsDpgC",
      },
      body: JSON.stringify({
        query: message,
      }),
    });

    // Handle errors
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    let responseText = "";
    
    if (data.success && data.result && data.result.answer) {
      responseText = data.result.answer;
    } else {
      responseText = "Sorry, I could not find a relevant answer to your question.";
    }

    // Simulate streaming by displaying the response word by word
    const words = responseText.split(' ');
    let currentText = "";
    
    for (let i = 0; i < words.length; i++) {
      currentText += words[i] + (i < words.length - 1 ? ' ' : '');
      assistantMessageEl.querySelector("p").textContent = currentText;
      
      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
      // Add a small delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Add completed response to chat history
    chatHistory.push({ role: "assistant", content: responseText });
  } catch (error) {
    console.error("Error:", error);
    addMessageToChat(
      "assistant",
      "Sorry, there was an error processing your request. Please try again.",
    );
  } finally {
    // Hide typing indicator
    typingIndicator.classList.remove("visible");

    // Re-enable input
    isProcessing = false;
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
  }
}

/**
 * Helper function to add message to chat
 */
function addMessageToChat(role, content) {
  const messageEl = document.createElement("div");
  messageEl.className = `message ${role}-message`;
  messageEl.innerHTML = `<p>${content}</p>`;
  chatMessages.appendChild(messageEl);

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
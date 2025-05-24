const API_KEY = "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";
const ASSISTANT_ID = "asst_6Hqump2srzaNJcu2JebffTgW"; // Ton assistant ID

const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatMessages = document.getElementById("chatMessages");

async function sendMessageToAssistant(message) {
  const loading = createMessageElement("⌛ L’assistant réfléchit...", "assistant", true);
  const threadId = localStorage.getItem("thread_id") || (await createThread());

  try {
    await postMessage(threadId, message);
    const run = await createRun(threadId);

    const response = await waitForRun(threadId, run.id);
    const assistantReply = response?.[0]?.content?.[0]?.text?.value || "(Aucune réponse reçue)";

    loading.remove();
    displayMessage(assistantReply, "assistant");
  } catch (error) {
    loading.remove();
    displayMessage("❌ Erreur : " + error.message, "assistant");
  }
}

function createMessageElement(text, sender, isLoading = false) {
  const div = document.createElement("div");
  div.className = `message ${sender}${isLoading ? " loading" : ""}`;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function displayMessage(message, sender) {
  createMessageElement(message, sender);
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (message === "") return;

  displayMessage(message, "user");
  userInput.value = "";
  await sendMessageToAssistant(message);
});

async function createThread() {
  const response = await fetch("https://api.openai.com/v1/threads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  localStorage.setItem("thread_id", data.id);
  return data.id;
}

async function postMessage(threadId, message) {
  await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role: "user",
      content: message,
    }),
  });
}

async function createRun(threadId) {
  const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assistant_id: ASSISTANT_ID,
    }),
  });
  return await response.json();
}

async function waitForRun(threadId, runId) {
  let runStatus = "queued";
  while (runStatus !== "completed") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const runCheck = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });
    const statusData = await runCheck.json();
    runStatus = statusData.status;
    if (runStatus === "failed") throw new Error("Échec de l'exécution de l'assistant");
  }

  const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  });
  const messages = await response.json();
  return messages.data.reverse().filter((msg) => msg.role === "assistant");
}

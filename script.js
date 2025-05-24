const API_KEY = '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';
const ASSISTANT_ID = 'asst_6Hqump2srzaNJcu2JebffTgW';
let threadId = null;

document.getElementById('send-btn').addEventListener('click', handleSend);

async function handleSend() {
  const input = document.getElementById('user-input');
  const message = input.value.trim();
  if (!message) return;

  // Affiche immédiatement le message utilisateur
  appendMessage("Vous", message, "user");
  input.value = '';

  try {
    // Crée le thread une seule fois
    if (!threadId) {
      const threadRes = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        }
      });
      const threadData = await threadRes.json();
      threadId = threadData.id;
    }

    // Envoie le message à l'assistant
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        role: "user",
        content: message
      })
    });

    // Lancer le run (demande à l'assistant de répondre)
    const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ assistant_id: ASSISTANT_ID })
    });

    const runData = await runRes.json();
    const runId = runData.id;

    // Affiche le ⏳ pendant l’attente
    const loadingMsg = appendMessage("Assistant", "⌛ Assistant est en train de répondre...", "bot");

    // Attente de la fin du traitement
    let status = "queued";
    while (status !== "completed" && status !== "failed") {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const runStatusRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: { "Authorization": `Bearer ${API_KEY}` }
      });
      const runStatusData = await runStatusRes.json();
      status = runStatusData.status;
    }

    // Si terminé, récupère les messages
    if (status === "completed") {
      const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: { "Authorization": `Bearer ${API_KEY}` }
      });
      const messagesData = await messagesRes.json();
      const lastAssistantMessage = messagesData.data.find(m => m.role === "assistant");

      const reply = lastAssistantMessage?.content?.[0]?.text?.value || "🤖 (Réponse vide)";
      loadingMsg.innerHTML = `<strong>Assistant :</strong> ${reply}`;
    } else {
      loadingMsg.innerHTML = "❌ L'assistant n'a pas pu répondre.";
    }

  } catch (error) {
    console.error("Erreur assistant :", error);
    appendMessage("Assistant", "❌ Une erreur s’est produite.", "bot");
  }
}

function appendMessage(sender, text, cssClass) {
  const chatBox = document.getElementById("chat-box");
  const msg = document.createElement("div");
  msg.className = `message ${cssClass}`;
  msg.innerHTML = `<strong>${sender} :</strong> ${text}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

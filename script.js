const API_KEY = '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'; // ← Mets ta vraie clé ici
const ASSISTANT_ID = 'asst_6Hqump2srzaNJcu2JebffTgW';
let threadId = null;

document.getElementById('send-btn').addEventListener('click', async () => {
  const inputField = document.getElementById('user-input');
  const userMessage = inputField.value.trim();
  if (!userMessage) return;

  appendMessage('Vous', userMessage, 'user');
  inputField.value = '';

  try {
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

    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        role: "user",
        content: userMessage
      })
    });

    const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID
      })
    });

    const runData = await runRes.json();
    const runId = runData.id;

    // Animation "Assistant est en train de répondre..."
    const loadingMsg = appendMessage('Assistant', '⏳...', 'bot');

    let status = 'queued';
    while (status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const statusRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          "Authorization": `Bearer ${API_KEY}`
        }
      });
      const statusData = await statusRes.json();
      status = statusData.status;
    }

    if (status === 'completed') {
      const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          "Authorization": `Bearer ${API_KEY}`
        }
      });
      const messagesData = await messagesRes.json();
      const lastMsg = messagesData.data.find(msg => msg.role === 'assistant');
      const botReply = lastMsg?.content?.[0]?.text?.value || "(Réponse vide)";
      loadingMsg.innerHTML = `<strong>Assistant :</strong> ${botReply}`;
    } else {
      loadingMsg.innerHTML = "<strong>Assistant :</strong> ❌ Erreur de génération.";
    }

  } catch (err) {
    console.error(err);
    appendMessage('Assistant', "⚠️ Une erreur est survenue.", 'bot');
  }
});

function appendMessage(sender, text, cssClass) {
  const chatBox = document.getElementById('chat-box');
  const msg = document.createElement('div');
  msg.className = `message ${cssClass}`;
  msg.innerHTML = `<strong>${sender} :</strong> ${text}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

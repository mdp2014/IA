// Remplace ceci par ta vraie clé API OpenAI
const API_KEY = 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; 
const ASSISTANT_ID = 'asst_6Hqump2srzaNJcu2JebffTgW';

let threadId = null;

document.getElementById('send-btn').addEventListener('click', async () => {
  const input = document.getElementById('user-input').value.trim();
  if (!input) return;

  appendMessage('Vous', input, 'user');
  document.getElementById('user-input').value = '';

  try {
    // 1. Créer un thread une seule fois
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

    // 2. Envoyer le message utilisateur au thread
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        role: "user",
        content: input
      })
    });

    // 3. Lancer un "run" avec ton assistant
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

    // 4. Attendre que le run soit terminé
    let status = 'queued';
    while (status !== 'completed' && status !== 'failed' && status !== 'cancelled') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const statusRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          "Authorization": `Bearer ${API_KEY}`
        }
      });
      const statusData = await statusRes.json();
      status = statusData.status;
    }

    // 5. Si réussi, récupérer le dernier message
    if (status === 'completed') {
      const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          "Authorization": `Bearer ${API_KEY}`
        }
      });
      const messagesData = await messagesRes.json();
      const lastMsg = messagesData.data.find(msg => msg.role === 'assistant');
      const botReply = lastMsg?.content?.[0]?.text?.value || "(Réponse vide)";
      appendMessage('Assistant', botReply, 'bot');
    } else {
      appendMessage('Assistant', "❌ L'assistant n'a pas pu répondre (erreur de run).", 'bot');
    }

  } catch (err) {
    console.error(err);
    appendMessage('Assistant', "⚠️ Une erreur est survenue lors de la communication avec l'API.", 'bot');
  }
});

function appendMessage(sender, text, cssClass) {
  const chatBox = document.getElementById('chat-box');
  const msg = document.createElement('div');
  msg.className = `message ${cssClass}`;
  msg.innerHTML = `<strong>${sender} :</strong> ${text}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

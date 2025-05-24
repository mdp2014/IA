const API_KEY = 'sk-xxxxxx'; // Remplace par ta clé secrète OpenAI

const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

sendBtn.addEventListener('click', sendMessage);

async function sendMessage() {
  const message = userInput.value.trim();
  if (message === '') return;

  appendMessage('Vous', message, 'user');
  userInput.value = '';

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await response.json();
    const reply = data.choices[0].message.content.trim();
    appendMessage('IA', reply, 'bot');

  } catch (error) {
    appendMessage('IA', "Erreur lors de la communication avec l'IA.", 'bot');
    console.error(error);
  }
}

function appendMessage(sender, text, cssClass) {
  const msg = document.createElement('div');
  msg.className = `message ${cssClass}`;
  msg.innerHTML = `<strong>${sender} :</strong> ${text}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

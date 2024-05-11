document.addEventListener('DOMContentLoaded', () => {
  const userMessage = document.getElementById('user-message');
  const sendButton = document.getElementById('send-button');
  const chatHistory = document.getElementById('chat-history');

  sendButton.addEventListener('click', sendMessage);
  userMessage.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  });

  function sendMessage() {
    const message = userMessage.value.trim();
    if (message !== '') {
      displayMessage('user', message);
      userMessage.value = '';

      axios.post('/chat', {
        query: message,
        model: 'gpt-3.5-turbo',
      })
        .then(response => {
          const botResponse = response.data.response;
          displayMessage('bot', botResponse);
        })
        .catch(error => {
          console.error('Error:', error);
          displayMessage('bot', 'Oops! Something went wrong. Please try again later.');
        });
    }
  }

  function displayMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    messageElement.textContent = message;
    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
});
(function() {
 document.addEventListener('DOMContentLoaded', function() {

 // Dummy data for groups and messages
 const dummyGroups = [
 { id: 1, name: 'Module A Study Group', messages: [
 { id: 1, text: 'Hi everyone!', sender: 'User 1' },
 { id: 2, text: 'Hello!', sender: 'User 2' },
 { id: 3, text: 'What are we studying today?', sender: 'User 1' },
 ] },
 { id: 2, name: 'Degree X Cohort', messages: [
 { id: 1, text: 'Anyone else working on the assignment?', sender: 'User 3' },
 { id: 2, text: 'Yes, it\'s tricky!', sender: 'User 4' },
 ] },
 { id: 3, name: 'Tutor Y Help Session', messages: [
 { id: 1, text: 'Reminder about tomorrow\'s session.', sender: 'Tutor Y' },
 ] },
 ];

 const groupList = document.getElementById('group-list');
 const messageList = document.getElementById('message-list');
 const messageInput = document.getElementById('message-input');
 const sendMessageButton = document.getElementById('send-message-button');

 // Function to display groups
 function displayGroups() {
 groupList.innerHTML = '';
 dummyGroups.forEach(group => {
 const groupElement = document.createElement('div');
 groupElement.classList.add('group-item');
 groupElement.textContent = group.name;
 groupElement.dataset.groupId = group.id;
 groupList.appendChild(groupElement);
 });
 }

 // Function to display messages for a group
 function displayMessages(groupId) {
 messageList.innerHTML = '';
 const group = dummyGroups.find(g => g.id === groupId);
 if (group) {
 group.messages.forEach(message => {
 const messageElement = document.createElement('div');
 messageElement.classList.add('message-item');
 messageElement.innerHTML = `<strong>${message.sender}:</strong> ${message.text}`;
 messageList.appendChild(messageElement);
 });
 }
 }

 // Function to handle sending a message
 function sendMessage() {
 const messageText = messageInput.value.trim();
 if (messageText) {
 console.log('Sending message:', messageText);
 // In a real application, you would send this message to the backend
 // For now, clear the input field
 messageInput.value = '';
 }
 }

 // Event listeners
 groupList.addEventListener('click', (event) => {
 const groupItem = event.target.closest('.group-item');
 if (groupItem) {
 const groupId = parseInt(groupItem.dataset.groupId);
 displayMessages(groupId);
 }
 });

 sendMessageButton.addEventListener('click', sendMessage);

 messageInput.addEventListener('keypress', (event) => {
 if (event.key === 'Enter') {
 sendMessage();
 }
 });

 // Initial display of groups
 displayGroups();

 });
})();
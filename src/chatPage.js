import React, { useState, useRef, useEffect } from 'react';
import './chatPage.css';


const ChatPage = () => {
 const [messages, setMessages] = useState([]);
 const [input, setInput] = useState('');
 const [loading, setLoading] = useState(false);
 const messagesEndRef = useRef(null);


 const OPENAI_API_KEY = "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";


 const scrollToBottom = () => {
   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
 };


 useEffect(() => {
   scrollToBottom();
 }, [messages]);


 const handleSubmit = async (e) => {
   e.preventDefault();
   if (!input.trim() || loading) return;


   const userMessage = { role: 'user', content: input };
   setMessages(prev => [...prev, userMessage]);
   setInput('');
   setLoading(true);


   try {
     const response = await fetch('https://api.openai.com/v1/chat/completions', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${OPENAI_API_KEY}`
       },
       body: JSON.stringify({
         model: 'gpt-3.5-turbo',
         messages: [
           {
             role: 'system',
             content: 'You are an AI assistant specializing in biochar and soil management. Provide helpful, accurate information about these topics.'
           },
           ...messages.map(msg => ({
             role: msg.role,
             content: msg.content
           })),
           userMessage
         ]
       })
     });


     if (!response.ok) {
       throw new Error(`HTTP error! status: ${response.status}`);
     }


     const data = await response.json();
     setMessages(prev => [...prev, {
       role: 'assistant',
       content: data.choices[0].message.content
     }]);
   } catch (error) {
     console.error('Error:', error);
     setMessages(prev => [...prev, {
       role: 'assistant',
       content: 'Sorry, there was an error processing your request. Please make sure you have set up your API key correctly.'
     }]);
   } finally {
     setLoading(false);
   }
 };


 return (
   <div className="chat-container">
     <div className="chat-header">
       <h1>Any Questions?</h1>
       <p>Chat with our AI assistant to learn more about biochar and soil management</p>
     </div>
     <div className="chat-messages">
       {messages.map((m, index) => (
         <div
           key={index}
           className={`message ${m.role === "user" ? "user-message" : "ai-message"}`}
         >
           <div className="message-header">
             {m.role === "user" ? "You" : "AI Assistant"}
           </div>
           <div className="message-content">
             {m.content}
           </div>
         </div>
       ))}
       {loading && (
         <div className="message ai-message">
           <div className="message-header">AI Assistant</div>
           <div className="message-content">Thinking...</div>
         </div>
       )}
       <div ref={messagesEndRef} />
     </div>
     <form onSubmit={handleSubmit} className="chat-input-form">
       <input
         type="text"
         value={input}
         onChange={(e) => setInput(e.target.value)}
         placeholder="Ask about biochar, soil health, or farming practices..."
         className="chat-input"
         disabled={loading}
       />
       <button
         type="submit"
         className="chat-submit"
         disabled={loading || !input.trim()}
       >
         {loading ? 'Sending...' : 'Send'}
       </button>
     </form>
   </div>
 );
};


export default ChatPage;
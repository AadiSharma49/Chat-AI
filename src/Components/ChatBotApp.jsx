/* eslint-disable react/prop-types */
import React, { useEffect, useRef, useState } from "react";
import './ChatBotApp.css';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import image from '../assets/ai img.jpg';

function ChatBotApp({ onGoBack, chats, setChats, activeChat, setActiveChat, onNewChat }) {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showChatList, setShowChatList] = useState(false);

  useEffect(() => {
    if (activeChat) {
      const storedMessages = JSON.parse(localStorage.getItem(activeChat)) || [];
      setMessages(storedMessages);
    }
  }, [activeChat]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleEmojiSelect = (emoji) => {
    setInputValue((prevInput) => prevInput + emoji.native);
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const newMessage = {
      type: "prompt",
      text: inputValue,
      timestamp: new Date().toLocaleTimeString(),
    };

    let updatedMessages = [...messages, newMessage];

    if (!activeChat) {
      onNewChat(inputValue);
    } else {
      setMessages(updatedMessages);
      localStorage.setItem(activeChat, JSON.stringify(updatedMessages));

      const updatedChats = chats.map((chat) =>
        chat.id === activeChat ? { ...chat, messages: updatedMessages } : chat
      );
      setChats(updatedChats);
      localStorage.setItem("chats", JSON.stringify(updatedChats));
      setInputValue("");
      setIsTyping(true);

      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer sk-5af5fa9f7177471a916ee43684061730`, // Use environment variable
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: 'user', content: inputValue }],
            max_tokens: 500,
          }),
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0) {
          const ChatResponse = data.choices[0].message.content.trim();
          const newResponse = {
            type: "response",
            text: ChatResponse,
            timestamp: new Date().toLocaleTimeString(),
          };

          updatedMessages = [...updatedMessages, newResponse];
          setMessages(updatedMessages);
          localStorage.setItem(activeChat, JSON.stringify(updatedMessages));

          const updatedChatsWithResponse = chats.map((chat) =>
            chat.id === activeChat ? { ...chat, messages: updatedMessages } : chat
          );
          setChats(updatedChatsWithResponse);
          localStorage.setItem("chats", JSON.stringify(updatedChatsWithResponse));
        }
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSelectChat = (id) => {
    setActiveChat(id);
  };

  const handleDeleteChat = (id) => {
    const updatedChats = chats.filter(chat => chat.id !== id);
    setChats(updatedChats);
    localStorage.setItem("chats", JSON.stringify(updatedChats));
    localStorage.removeItem(id);

    if (id === activeChat) {
      setActiveChat(updatedChats.length > 0 ? updatedChats[0].id : null);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-app">
      <div className={`chat-list ${showChatList ? 'show' : ""}`}>
        <div className="chat-list-header">
          <h2>Chat List</h2>
          <i className="bx bx-edit-alt new-chat" onClick={onNewChat}></i>
          <i className="bx bx-x-circle close-list" onClick={() => setShowChatList(false)}></i>
        </div>
        {chats.map((chat) => (
          <div key={chat.id} className={`chat-list-item ${chat.id === activeChat ? 'active' : ''}`} onClick={() => handleSelectChat(chat.id)}>
            <h4>{chat.displayId}</h4>
            <i className="bx bx-x-circle" onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id); }}></i>
          </div>
        ))}
      </div>
      <div className="chat-window">
        <div className="chat-title">
          <i className="profile-pic">
            <img src={image} alt="Profile Pic" />
          </i>
          <h3>Chat With AI</h3>
          <i className="bx bx-menu" onClick={() => setShowChatList(true)}></i>
          <i className="bx bx-arrow-back arrow" onClick={onGoBack} title="Exit"></i>
        </div>
        <div className="chat">
          {messages.map((msg, index) => (
            <div key={index} className={msg.type === "prompt" ? "prompt" : "response"}>
              {msg.text}<span>{msg.timestamp}</span>
            </div>
          ))}
          {isTyping && <div className="typing">Typing...</div>}
          <div ref={chatEndRef}></div>
        </div>
        <form className="msg-form" onSubmit={(e) => e.preventDefault()}>
          <i className="fa-solid fa-face-smile emoji" onClick={() => setShowEmojiPicker((prev) => !prev)}></i>
          {showEmojiPicker && (
            <div className="picker">
              <Picker data={data} onEmojiSelect={handleEmojiSelect} />
            </div>
          )}
          <input
            type="text"
            className="msg-input"
            placeholder="Type a Message..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowEmojiPicker(false)}
          />
          <i className="fa-solid fa-paper-plane" onClick={sendMessage}></i>
        </form>
      </div>
    </div>
  );
}

export default ChatBotApp;

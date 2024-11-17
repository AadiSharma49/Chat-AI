// eslint-disable-next-line no-unused-vars
import React from 'react'
import './ChatBotStart.css'

// eslint-disable-next-line react/prop-types
function ChatBotStart({onStartChat}){
    return (
        <div className='Start-Page'>
            <button className='Start-Page-btn' title='Start' onClick={onStartChat}>CHAT AI</button>
        </div>
    );
}
export default ChatBotStart;
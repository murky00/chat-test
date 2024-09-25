const chatMessages = document.getElementById('chat-messages');
const userMessage = document.getElementById('user-message');
const sendButton = document.getElementById('send-button');

const minecraftKnowledge = {
    // ... 保持原有的知识库不变 ...
};

const minecraftEncyclopedia = {
    // ... 保持原有的百科知识不变 ...
};

sendButton.addEventListener('click', sendMessage);
userMessage.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

async function getAIResponse(message) {
    message = message.toLowerCase();
    
    // 首先检查是否匹配到趣味回答
    for (const [topic, responses] of Object.entries(minecraftKnowledge)) {
        if (message.includes(topic)) {
            return responses[Math.floor(Math.random() * responses.length)];
        }
    }
    
    // 然后检查是否匹配到百科知识
    for (const [category, items] of Object.entries(minecraftEncyclopedia)) {
        for (const [item, description] of Object.entries(items)) {
            if (message.includes(item)) {
                return `${item}：${description}`;
            }
        }
    }
    
    // 如果本地知识库没有匹配，使用外部API
    try {
        const response = await fetch('https://your-api-endpoint.com/get_ai_response', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({message: message}),
        });
        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error:', error);
        return "抱歉，我遇到了一些问题。能请你再说一遍吗？";
    }
}

async function sendMessage() {
    const message = userMessage.value.trim();
    if (message) {
        addMessage('玩家', message);
        userMessage.value = '';
        const response = await getAIResponse(message);
        addMessage('AI', response);
    }
}

function addMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 随机事件函数
function randomEvent() {
    const events = [
        "哎呀！一只爬行者刚刚从你背后经过，还好它今天心情不错。",
        "看！天上飞过一群鹦鹉。等等，Minecraft里有鹦鹉吗？",
        "你听到了吗？好像有人在唱'Diggy Diggy Hole'...",
        "哇，一只绵羊刚刚用彩虹色染料给自己染了毛！",
        "小心！你的背包里的TNT看起来有点不安分..."
    ];
    return events[Math.floor(Math.random() * events.length)];
}

// 每隔一段时间触发随机事件
setInterval(() => {
    if (Math.random() < 0.3) { // 30%的概率触发
        addMessage('系统', randomEvent());
    }
}, 30000); // 每30秒检查一次

// 添加初始消息
addMessage('AI', '嘿，欢迎来到Minecraft的方块世界！我是你的AI助手，既幽默又博学。你想了解关于Minecraft的什么呢？');
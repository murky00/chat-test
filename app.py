from flask import Flask, request, jsonify, send_from_directory
import google.generativeai as genai
import os

app = Flask(__name__)

# 设置Gemini API密钥
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))

# 创建一个Gemini模型实例
model = genai.GenerativeModel('gemini-pro')

@app.route('/')
def home():
    return send_from_directory('static', 'index.html')

@app.route('/get_ai_response', methods=['POST'])
def get_ai_response():
    user_message = request.json['message']
    
    # 创建一个聊天会话
    chat = model.start_chat(history=[])
    
    # 设置Minecraft专家AI助手的角色
    system_prompt = "你是一个Minecraft专家AI助手，既幽默又博学。请用简洁幽默的方式回答问题。"
    chat.send_message(system_prompt)
    
    # 发送用户消息并获取响应
    response = chat.send_message(user_message)
    
    ai_response = response.text
    return jsonify({'response': ai_response})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
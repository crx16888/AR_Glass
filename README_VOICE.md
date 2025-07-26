# AR眼镜语音情感分析系统

这是一个基于语音识别和AI情感分析的实时好感度监测系统。用户可以通过麦克风录音，系统会自动识别语音内容并分析说话者的情感状态。

## 功能特性

- 🎤 **实时语音录音**：支持浏览器麦克风录音
- 🔊 **语音转文字**：使用OpenAI Whisper API进行语音识别
- 🧠 **情感分析**：使用GPT模型分析语音内容的情感倾向
- 📊 **可视化显示**：实时更新好感度数值和进度条
- 💡 **智能建议**：根据分析结果提供交流建议

## 系统架构

```
前端 (HTML/CSS/JS)
    ↓ 录音数据
后端 (Node.js/Express)
    ↓ 语音文件
OpenAI Whisper API (语音转文字)
    ↓ 文字内容
OpenAI GPT API (情感分析)
    ↓ 分析结果
前端显示更新
```

## 安装和使用

### 1. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖（如果需要）
cd ../frontend
npm install
```

### 2. 配置API密钥

1. 在 `backend` 目录下复制 `.env.example` 为 `.env`
2. 在 `.env` 文件中填入你的 OpenAI API 密钥：

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
PORT=3001
```

### 3. 启动服务

```bash
# 启动后端服务
cd backend
npm start

# 在另一个终端启动前端服务
cd frontend
# 使用任意HTTP服务器，例如：
python -m http.server 3000
# 或者
npx http-server -p 3000
```

### 4. 访问应用

打开浏览器访问：`http://localhost:3000`

## 使用说明

1. **授权麦克风**：首次使用时浏览器会请求麦克风权限，请点击允许
2. **开始录音**：点击"开始录音"按钮开始录制语音
3. **停止录音**：再次点击按钮停止录音，系统会自动处理
4. **查看结果**：
   - 好感度数值和进度条会实时更新
   - 右侧面板显示详细的分析结果
   - 包括识别的文字、当前状态、建议行动等

## API接口

### POST /api/analyze-voice

上传音频文件进行语音识别和情感分析

**请求参数：**
- `audio`: 音频文件 (multipart/form-data)

**响应格式：**
```json
{
  "text": "识别的文字内容",
  "emotion": {
    "happiness": 85,
    "emotion": "积极愉快",
    "status": "友好交流",
    "suggestion": "继续保持当前交流方式"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### GET /api/health

检查服务器健康状态

## 技术栈

**前端：**
- HTML5 (MediaRecorder API)
- CSS3 (渐变、动画效果)
- Vanilla JavaScript (ES6+)

**后端：**
- Node.js
- Express.js
- Multer (文件上传)
- OpenAI API

**AI服务：**
- OpenAI Whisper (语音转文字)
- OpenAI GPT-3.5-turbo (情感分析)

## 注意事项

1. **API费用**：使用OpenAI API会产生费用，请注意控制使用量
2. **浏览器兼容性**：需要支持MediaRecorder API的现代浏览器
3. **HTTPS要求**：在生产环境中，麦克风访问需要HTTPS协议
4. **网络连接**：需要稳定的网络连接以访问OpenAI API

## 故障排除

**问题：麦克风访问失败**
- 检查浏览器权限设置
- 确保使用HTTPS或localhost

**问题：后端服务连接失败**
- 确认后端服务已启动
- 检查端口3001是否被占用
- 验证API密钥是否正确配置

**问题：语音识别失败**
- 检查网络连接
- 验证OpenAI API密钥
- 确认音频格式支持

## 扩展功能

可以考虑添加的功能：
- 支持多种语言识别
- 历史记录保存
- 情感趋势分析
- 实时语音流处理
- 自定义情感分析模型
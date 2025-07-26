require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');
const http = require('http');
const https = require('https');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态托管 frontend 目录
app.use(express.static(path.join(__dirname, '../frontend')));

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `audio_${Date.now()}.wav`);
  }
});

const upload = multer({ storage });

// 语音转文字函数 - 已废弃，现在使用前端Web Speech API
async function speechToText(audioFilePath) {
    try {
        console.log('收到音频文件，但语音识别已在前端完成，此接口已废弃:', audioFilePath);
        return '';
    } catch (error) {
        console.error('语音转文字处理错误:', error);
        return '';
    }
}

// 情感分析函数（使用KIMI API）
async function analyzeEmotion(text) {
  try {
    const baseUrl = process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1';
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.KIMI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的情感分析师。请分析用户说话的内容，判断说话者的心情和情感状态。请返回一个JSON格式的结果，包含：happiness（好感度，0-100的数字），emotion（情感描述），status（当前状态），suggestion（建议行动）。'
          },
          {
            role: 'user',
            content: `请分析这段话的情感："${text}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    const result = await response.json();
    
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      console.error('KIMI API响应格式错误:', result);
      return {
        happiness: 0,
        emotion: '分析失败',
        status: 'API响应错误',
        suggestion: '请稍后重试'
      };
    }
    
    const content = result.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch {
      return {
        happiness: 75,
        emotion: '中性',
        status: '正常交流',
        suggestion: '继续保持友好交流'
      };
    }
  } catch (error) {
    console.error('情感分析错误:', error);
    return {
      happiness: 70,
      emotion: '无法分析',
      status: '分析失败',
      suggestion: '请重新尝试'
    };
  }
}

// API 路由
app.post('/api/analyze-text', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: '没有接收到文本内容' });
    }

    console.log('接收到文本:', text);
    const emotionResult = await analyzeEmotion(text);
    console.log('情感分析结果:', emotionResult);

    res.json({
      text: text,
      emotion: emotionResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('处理文本分析时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 健康检查路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '语音情感分析服务运行正常' });
});

// 根路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// HTTP 服务器（重定向到 HTTPS）
const httpServer = http.createServer((req, res) => {
  res.writeHead(301, { 'Location': 'https://' + req.headers.host + req.url });
  res.end();
});

// HTTPS 服务器
const httpsOptions = {
  key: fs.readFileSync('/root/cert/kehanluqi.fun.key'),
  cert: fs.readFileSync('/root/cert/kehanluqi.fun.pem'),
  minVersion: "TLSv1.2",
  maxVersion: "TLSv1.3",
  ciphers: [
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-ECDSA-CHACHA20-POLY1305',
    'ECDHE-RSA-CHACHA20-POLY1305',
    'DHE-RSA-AES128-GCM-SHA256',
    'DHE-RSA-AES256-GCM-SHA384'
  ].join(':'),
  honorCipherOrder: true,
  requestCert: false
};

// 启动服务器
httpServer.listen(80, () => {
  console.log('HTTP 重定向服务已启动，端口 80');
});

https.createServer(httpsOptions, app).listen(443, () => {
  console.log('HTTPS 服务已启动，端口 443');
});

// 同时在3000端口启动HTTP服务（用于测试）
app.listen(3000, () => {
  console.log('HTTP 测试服务已启动，端口 3000');
});

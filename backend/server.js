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
const helmet = require('helmet');

const app = express();
const PORT = 3001;

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.moonshot.cn"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// 基础中间件
app.use(cors({
  origin: ['https://kehanluqi.fun', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// HTTP 服务器配置
const createRedirectServer = () => {
  return http.createServer((req, res) => {
    res.writeHead(301, { 
      'Location': 'https://' + req.headers.host + req.url,
      'Cache-Control': 'no-cache'
    });
    res.end();
  });
};

// HTTPS 服务器配置
const httpsOptions = {
  // 基础证书配置
  key: fs.readFileSync('/root/cert/kehanluqi.fun.key'),
  cert: fs.readFileSync('/root/cert/kehanluqi.fun.pem'),
        
  // SSL/TLS 配置 - 增加兼容性
  minVersion: 'TLSv1',    // 支持 TLSv1 及以上版本以增加兼容性
  maxVersion: 'TLSv1.3',
  secureOptions: 
    require('constants').SSL_OP_NO_SSLv2 | 
    require('constants').SSL_OP_NO_SSLv3 |
    require('constants').SSL_OP_CIPHER_SERVER_PREFERENCE,
  
  // 优化的密码套件（按优先级排序）
  ciphers: [
    // TLS 1.3 密码套件
    'TLS_AES_256_GCM_SHA384',
    'TLS_AES_128_GCM_SHA256',
    'TLS_CHACHA20_POLY1305_SHA256',
    
    // TLS 1.2 推荐密码套件
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-CHACHA20-POLY1305',
    'ECDHE-RSA-CHACHA20-POLY1305',
    
    // 向后兼容的密码套件
    'DHE-RSA-AES256-GCM-SHA384',
    'DHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-SHA384',
    'ECDHE-RSA-AES128-SHA256'
  ].join(':'),
  honorCipherOrder: true,
  
  // 性能和安全优化
  sessionTimeout: 3600,
  ticketKeys: require('crypto').randomBytes(48), // 使用随机生成的会话票据密钥
  
  // 其他安全选项
  handshakeTimeout: 120000, // 2分钟
  requestCert: false,
  rejectUnauthorized: false, // 临时禁用证书验证以便调试
  
  // HSTS 和其他安全头部将通过 Express 中间件设置
};

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动HTTP重定向服务器
const redirectServer = http.createServer((req, res) => {
  res.writeHead(301, { 
    'Location': 'https://' + req.headers.host + req.url,
    'Cache-Control': 'no-cache',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  });
  res.end();
});

redirectServer.listen(80, () => {
  console.log('HTTP 重定向服务已启动，端口 80');
});

// 创建HTTPS服务器
const httpsServer = https.createServer(httpsOptions, app);

// 添加TLS错误处理
httpsServer.on('tlsClientError', (err, tlsSocket) => {
  console.error('TLS错误:', err);
});

httpsServer.on('error', (err) => {
  console.error('HTTPS服务器错误:', err);
});

// 启动HTTPS服务器
httpsServer.listen(443, () => {
  console.log('HTTPS 服务已启动，端口 443');
  console.log('SSL/TLS配置已加载');
});

// 开发环境HTTP服务
if (process.env.NODE_ENV === 'development') {
  app.listen(3000, () => {
    console.log('HTTP 开发服务已启动，端口 3000');
  });
}

## 运行
内网运行：
启动前端服务：http-server frontend -p 3000
启动后端服务：cd backend && node server.js 
http://localhost:3000/
外部运行（我们部署的阿里云服务器）：
http://47.97.183.238:3000
https://kehanluqi.fun/ 

https://github.com/crx16888/AR_Glass

## 前后端
浏览器调用麦克风获取语音，等收集完直接web前端语音转文本识别，然后发送给服务器后端（服务器一直运行着后端就一直在着，前端是对外展示的那一面），后端调用大模型处理文本输出再发给前端更新

## 后续改进
1. 调用眼镜麦克风成功
2. 声音数据实时压缩成小片段（200ms左右），通过 WebSocket 或 WebRTC 推送给电脑/服务器；而非等传完再送给服务器后端
3. 服务器处理结果通过 WebSocket 回传给网页，显示在眼镜浮窗。
   
4. AI眼镜通过内置浏览器访问一个网页，即我们前端部署的http://47.97.183.238:3000
5. 网页通过 Web Audio API 获取麦克风声音流。
6. 
7. 服务器接收到音频片段后处理（语音识别/情绪分析等）。


https://kehanluqi.fun（主要访问地址）
http://47.97.183.238:3000（测试地址）
http://kehanluqi.fun（会自动重定向到 HTTPS）

Rokid 眼镜对 TLS/SSL 的支持版本与服务器不匹配。让我们尝试调整服务器的 SSL/TLS 配置，使其更兼容：
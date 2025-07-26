// 全局变量
let isRecording = false;
let recognition;
const API_BASE_URL = 'https://kehanluqi.fun/api';

// DOM元素，把 HTML 页面中的标签“抓”出来，这样我们才能用 JS 修改它们。
const recordBtn = document.getElementById('recordBtn');
const recordingStatus = document.getElementById('recordingStatus');
const happinessValue = document.getElementById('happinessValue');
const progressFill = document.getElementById('progressFill');   
const updateTime = document.getElementById('updateTime');
const happinessText = document.getElementById('happinessText');
const currentStatus = document.getElementById('currentStatus');
const suggestion = document.getElementById('suggestion');
const recognizedText = document.getElementById('recognizedText');
const recordText = recordBtn.querySelector('.record-text');

// 初始化Web Speech API
function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
        recognition = new SpeechRecognition();
    } else {
        console.error('浏览器不支持语音识别');
        recordingStatus.textContent = '浏览器不支持语音识别';
        return false;
    }
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'zh-CN';
    
    recognition.onstart = function() {
        console.log('语音识别开始');
        recordingStatus.textContent = '正在监听...';
    };
    
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        console.log('Web Speech API识别结果:', transcript);
        console.log('正在调用analyze-text接口');
        analyzeText(transcript);
    };
    
    recognition.onerror = function(event) {
        console.error('语音识别错误:', event.error);
        recordingStatus.textContent = '语音识别失败: ' + event.error;
        recordText.textContent = '开始录音';
        recordBtn.classList.remove('recording');
        isRecording = false;
    };
    
    recognition.onend = function() {
        console.log('语音识别结束');
        recordText.textContent = '开始录音';
        recordBtn.classList.remove('recording');
        isRecording = false;
    };
    
    return true;
}

// 初始化录音功能
async function initializeRecording() {
    const speechSupported = initSpeechRecognition();
    if (speechSupported) {
        recordingStatus.textContent = '准备录音';
    }
}

// 开始/停止录音
function toggleRecording() {
    if (!recognition) {
        alert('语音识别功能未初始化，请刷新页面重试');
        return;
    }
    
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

// 开始录音
function startRecording() {
    recognition.start();
    isRecording = true;
    
    recordBtn.classList.add('recording');
    recordText.textContent = '停止录音';
    recordingStatus.textContent = '正在录音...';
}

// 停止录音
function stopRecording() {
    recognition.stop();
    isRecording = false;
    
    recordBtn.classList.remove('recording');
    recordText.textContent = '开始录音';
    recordingStatus.textContent = '处理中...';
}

// 分析文本
async function analyzeText(text) {
    try {
        console.log('analyzeText函数被调用，文本:', text);
        console.log('API端点:', `${API_BASE_URL}/analyze-text`);
        
        recognizedText.textContent = text;
        recordingStatus.textContent = '分析中...';
        
        const response = await fetch(`${API_BASE_URL}/analyze-text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({ text: text })
        });
        
        console.log('API响应状态:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        updateUI(result);
        recordingStatus.textContent = '分析完成';
        
    } catch (error) {
        console.error('分析文本失败:', error);
        recordingStatus.textContent = '分析失败，请重试';
        
        // 显示错误信息
        currentStatus.textContent = '连接失败';
        suggestion.textContent = '请检查后端服务是否运行';
    }
}

// 更新UI显示
function updateUI(result) {
    const { text, emotion, timestamp } = result;
    
    // 更新识别的文字
    recognizedText.textContent = text || '无法识别';
    
    // 更新情感分析结果
    if (emotion) {
        const happiness = emotion.happiness || 70;
        
        // 更新好感度数值和进度条
        happinessValue.textContent = happiness;
        progressFill.style.width = happiness + '%';
        
        // 更新文字描述
        happinessText.textContent = `${happiness}% (${emotion.emotion || '中性'})`;
        currentStatus.textContent = emotion.status || '正常交流';
        suggestion.textContent = emotion.suggestion || '继续保持友好交流';
        
        // 根据好感度值改变颜色
        updateColors(happiness);
    }
    
    // 更新时间
    const now = new Date();
    updateTime.textContent = now.toLocaleTimeString();
}

// 根据好感度更新颜色
function updateColors(happiness) {
    if (happiness >= 80) {
        happinessValue.style.color = '#28a745';
        progressFill.style.background = 'linear-gradient(90deg, #28a745, #20c997)';
    } else if (happiness >= 70) {
        happinessValue.style.color = '#4a90e2';
        progressFill.style.background = 'linear-gradient(90deg, #4a90e2, #357abd)';
    } else if (happiness >= 50) {
        happinessValue.style.color = '#ffc107';
        progressFill.style.background = 'linear-gradient(90deg, #ffc107, #e0a800)';
    } else {
        happinessValue.style.color = '#dc3545';
        progressFill.style.background = 'linear-gradient(90deg, #dc3545, #c82333)';
    }
}

// 检查后端服务状态
async function checkBackendStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            recordingStatus.textContent = '后端服务已连接';
            // 清除可能的错误状态
            currentStatus.textContent = '准备就绪';
            suggestion.textContent = '点击开始录音按钮进行语音识别';
            recognizedText.textContent = '暂无';
            return true;
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('后端连接检查失败:', error);
        recordingStatus.textContent = '后端服务未启动';
        currentStatus.textContent = '连接失败';
        suggestion.textContent = '请检查后端服务是否运行';
        recognizedText.textContent = '网络错误或服务器未启动';
        return false;
    }
}

// 事件监听器
recordBtn.addEventListener('click', toggleRecording);

// 页面加载时初始化
window.addEventListener('load', async () => {
    await initializeRecording();
    await checkBackendStatus();
    
    // 初始化显示
    const now = new Date();
    updateTime.textContent = now.toLocaleTimeString();
});

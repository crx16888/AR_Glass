// 模拟实时更新好感度
function updateHappiness() {
    const happinessValue = document.getElementById('happinessValue'); //获取id对应元素，数值更新逻辑在js下面
    const progressFill = document.getElementById('progressFill');
    const updateTime = document.getElementById('updateTime');
    
    // 生成随机好感度值 (60-90之间)
    const newValue = Math.floor(Math.random() * 31) + 60; //随机生成一个数值，happinessValue更新
    
    // 更新显示
    happinessValue.textContent = newValue; //textcontent是js内部的属性，id对应元素的数值被更新；其用于安全地读取或修改网页元素中的纯文字内容
    progressFill.style.width = newValue + '%';
    
    // 更新时间，创建更新时间的对象
    const now = new Date();
    updateTime.textContent = now.toLocaleTimeString(); //更新updateTime中的数值
    
    // 根据好感度值改变颜色
    if (newValue >= 80) {
        happinessValue.style.color = '#28a745';
        progressFill.style.background = 'linear-gradient(90deg, #28a745, #20c997)';
    } else if (newValue >= 70) {
        happinessValue.style.color = '#4a90e2';
        progressFill.style.background = 'linear-gradient(90deg, #4a90e2, #357abd)';
    } else {
        happinessValue.style.color = '#ffc107';
        progressFill.style.background = 'linear-gradient(90deg, #ffc107, #e0a800)';
    }
}

// 定时刷新机制，每5秒更新一次
setInterval(updateHappiness, 5000);

// 页面加载时初始化
updateHappiness();
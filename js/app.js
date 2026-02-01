// 全局变量
let vocabularyData = [];
let examplesData = [];
let currentQuestion = null;
let currentMode = '';
let progressData = {
    total: 0,
    correct: 0,
    incorrect: 0,
    score: 0,
    masteredWords: new Set(),
    learningWords: new Set(),
    unmasteredWords: new Set()
};
let settings = {
    questionsPerSession: 10,
    autoPlayAudio: false,
    minWordId: 1,
    maxWordId: 1000
};
let currentLevel = 1;
let maxLevel = 10;

// DOM 元素
const navExercise = document.getElementById('nav-exercise');
const navProgress = document.getElementById('nav-progress');
const navSettings = document.getElementById('nav-settings');
const exerciseSection = document.getElementById('exercise-section');
const progressSection = document.getElementById('progress-section');
const settingsSection = document.getElementById('settings-section');
const modeFillBlank = document.getElementById('mode-fill-blank');
const fillBlankMode = document.getElementById('fill-blank-mode');
const loading = document.getElementById('loading');
const exampleSentence = document.getElementById('example-sentence');
const checkAnswer = document.getElementById('check-answer');
const feedback = document.getElementById('feedback');
const feedbackContent = document.getElementById('feedback-content');
const nextQuestion = document.getElementById('next-question');
const difficulty = document.getElementById('difficulty');
const saveSettings = document.getElementById('save-settings');
const questionsPerSession = document.getElementById('questions-per-session');
const autoPlayAudio = document.getElementById('auto-play-audio');
const minWordId = document.getElementById('min-word-id');
const maxWordId = document.getElementById('max-word-id');
const masteredCount = document.getElementById('mastered-count');
const learningCount = document.getElementById('learning-count');
const unmasteredCount = document.getElementById('unmastered-count');
const masteredProgress = document.getElementById('mastered-progress');
const learningProgress = document.getElementById('learning-progress');
const unmasteredProgress = document.getElementById('unmastered-progress');
const scoreDisplay = document.getElementById('score-display');
const levelDisplay = document.getElementById('level-display');
const levelProgress = document.getElementById('level-progress');
const levelProgressText = document.getElementById('level-progress-text');
const challengeMode = document.getElementById('challenge-mode');
const challengeSection = document.getElementById('challenge-section');
const challengeQuestion = document.getElementById('challenge-question');
const challengeExample = document.getElementById('challenge-example');
const challengeOptions = document.getElementById('challenge-options');
const checkChallenge = document.getElementById('check-challenge');
const challengeFeedback = document.getElementById('challenge-feedback');
const challengeFeedbackContent = document.getElementById('challenge-feedback-content');
const nextChallenge = document.getElementById('next-challenge');
const challengeScore = document.getElementById('challenge-score');
const challengeLevel = document.getElementById('challenge-level');

// 初始化函数
async function init() {
    try {
        // 显示初始加载提示
        updateLoadingText('准备加载数据...');

        // 加载数据
        await loadData();

        // 初始化练习
        initExercise();

        // 初始化导航
        initNavigation();

        // 初始化设置
        initSettings();

        // 初始化进度
        updateProgressDisplay();
    } catch (error) {
        console.error('初始化失败:', error);
        // 错误已在 loadData 中处理显示
    }
}

// 加载数据
async function loadData() {
    try {
        // 更新加载提示
        updateLoadingText('正在加载词汇数据...');

        // 加载词汇数据
        const vocabResponse = await fetch('data/tb_vocabulary.json');
        if (!vocabResponse.ok) {
            throw new Error(`加载词汇数据失败: ${vocabResponse.status}`);
        }
        vocabularyData = await vocabResponse.json();

        // 更新加载提示
        updateLoadingText('正在加载例句数据...');

        // 加载例句数据
        const examplesResponse = await fetch('data/tb_voc_examples.json');
        if (!examplesResponse.ok) {
            throw new Error(`加载例句数据失败: ${examplesResponse.status}`);
        }
        examplesData = await examplesResponse.json();

        // 更新加载提示
        updateLoadingText('正在处理数据...');

        // 隐藏加载状态
        loading.classList.add('hidden');
        
        // 按wordid对例句进行分组
        const groupedExamples = {};
        examplesData.forEach(example => {
            if (!groupedExamples[example.wordid]) {
                groupedExamples[example.wordid] = [];
            }
            groupedExamples[example.wordid].push(example);
        });
        
        // 将例句添加到词汇数据中
        vocabularyData.forEach(word => {
            word.examples = groupedExamples[word.wordid] || [];
        });
        
        // 过滤掉没有例句的单词
        vocabularyData = vocabularyData.filter(word => word.examples.length > 0);
        
        // 更新进度数据
        progressData.total = vocabularyData.length;
        progressData.unmasteredWords = new Set(vocabularyData.map(word => word.wordid));
        
    } catch (error) {
        console.error('加载数据失败:', error);

        // 显示友好的错误提示
        loading.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 px-4">
                <i class="fa fa-exclamation-circle text-red-500 text-5xl mb-4"></i>
                <p class="text-red-600 font-medium mb-2">数据加载失败</p>
                <p class="text-sm text-gray-600 text-center mb-4">${error.message}</p>
                <p class="text-xs text-gray-500 text-center mb-4">
                    可能是网络不稳定或数据文件过大。<br>
                    建议在 Wi-Fi 环境下访问。
                </p>
                <button onclick="location.reload()" class="bg-primary text-white px-6 py-2 rounded-md hover:bg-secondary transition-colors duration-200">
                    重新加载
                </button>
            </div>
        `;
        throw error;
    }
}

// 更新加载文本
function updateLoadingText(text) {
    const loadingText = document.getElementById('loading-text');
    if (loadingText) {
        loadingText.textContent = text;
    }
}

// 初始化练习
function initExercise() {
    // 填空模式（改为选择题）
    modeFillBlank.addEventListener('click', () => {
        currentMode = 'fill-blank';
        showSection(exerciseSection);
        showMode(fillBlankMode);
        generateFillBlankQuestion();
    });
    
    // 闯关模式
    challengeMode.addEventListener('click', () => {
        currentMode = 'challenge';
        showSection(challengeSection);
        currentLevel = 1;
        progressData.score = 0;
        updateChallengeDisplay();
        generateChallengeQuestion();
    });
    
    // 检查答案
    checkAnswer.addEventListener('click', () => {
        const selectedOption = document.querySelector('input[name="options"]:checked');
        
        if (selectedOption) {
            const userInput = selectedOption.value.trim().toLowerCase();
            const correctAnswer = currentQuestion.correctAnswer.toLowerCase();
            
            if (userInput === correctAnswer) {
                // 正确答案
                progressData.correct++;
                progressData.score += 10;
                progressData.masteredWords.add(currentQuestion.word.wordid);
                progressData.unmasteredWords.delete(currentQuestion.word.wordid);
                updateProgressDisplay();
                updateScoreDisplay();
                
                // 显示正确反馈
                feedback.classList.remove('hidden');
                feedbackContent.className = 'p-4 bg-green-100 text-green-700 rounded-md';
                feedbackContent.innerHTML = `
                    <p class="font-medium">回答正确！</p>
                    <p class="mt-2">+10 分</p>
                `;
            } else {
                // 错误答案
                progressData.incorrect++;
                progressData.score = Math.max(0, progressData.score - 5);
                progressData.learningWords.add(currentQuestion.word.wordid);
                progressData.unmasteredWords.delete(currentQuestion.word.wordid);
                updateProgressDisplay();
                updateScoreDisplay();
                
                // 显示错误反馈
                feedback.classList.remove('hidden');
                feedbackContent.className = 'p-4 bg-red-100 text-red-700 rounded-md';
                feedbackContent.innerHTML = `
                    <p class="font-medium">回答错误</p>
                    <p class="mt-2">正确答案：${currentQuestion.correctAnswer}</p>
                    <p>单词：${currentQuestion.word.spelling}</p>
                    <p>释义：${currentQuestion.word.paraphrase}</p>
                    <p class="mt-2">例句：${currentQuestion.example.en}</p>
                    <p>翻译：${currentQuestion.example.cn}</p>
                    <p class="mt-2 text-red-600">-5 分</p>
                `;
            }
        } else {
            // 没有选择答案
            feedback.classList.remove('hidden');
            feedbackContent.className = 'p-4 bg-yellow-100 text-yellow-700 rounded-md';
            feedbackContent.innerHTML = '<p class="font-medium">请选择一个答案！</p>';
        }
    });
    
    // 下一题
    nextQuestion.addEventListener('click', () => {
        if (currentMode === 'fill-blank') {
            // 检查是否有选中的答案
            const selectedOption = document.querySelector('input[name="options"]:checked');
            if (selectedOption) {
                const userInput = selectedOption.value.trim().toLowerCase();
                const correctAnswer = currentQuestion.correctAnswer.toLowerCase();
                
                if (userInput === correctAnswer) {
                    // 正确答案
                    progressData.correct++;
                    progressData.score += 10;
                    progressData.masteredWords.add(currentQuestion.word.wordid);
                    progressData.unmasteredWords.delete(currentQuestion.word.wordid);
                    updateProgressDisplay();
                    updateScoreDisplay();
                    
                    // 直接生成新题目
                    generateFillBlankQuestion();
                    feedback.classList.add('hidden');
                } else {
                    // 错误答案
                    progressData.incorrect++;
                    progressData.score = Math.max(0, progressData.score - 5);
                    progressData.learningWords.add(currentQuestion.word.wordid);
                    progressData.unmasteredWords.delete(currentQuestion.word.wordid);
                    updateProgressDisplay();
                    updateScoreDisplay();
                    
                    // 显示错误反馈
                    feedback.classList.remove('hidden');
                    feedbackContent.className = 'p-4 bg-red-100 text-red-700 rounded-md';
                    feedbackContent.innerHTML = `
                        <p class="font-medium">回答错误</p>
                        <p class="mt-2">正确答案：${currentQuestion.correctAnswer}</p>
                        <p>单词：${currentQuestion.word.spelling}</p>
                        <p>释义：${currentQuestion.word.paraphrase}</p>
                        <p class="mt-2">例句：${currentQuestion.example.en}</p>
                        <p>翻译：${currentQuestion.example.cn}</p>
                        <button id="continue-next" class="mt-4 bg-primary text-white px-6 py-2 rounded-md hover:bg-secondary transition-colors duration-200">
                            继续下一题
                        </button>
                    `;
                    
                    // 添加继续按钮事件
                    document.getElementById('continue-next').addEventListener('click', () => {
                        generateFillBlankQuestion();
                        feedback.classList.add('hidden');
                    });
                }
            } else {
                // 没有选择答案
                feedback.classList.remove('hidden');
                feedbackContent.className = 'p-4 bg-yellow-100 text-yellow-700 rounded-md';
                feedbackContent.innerHTML = '<p class="font-medium">请选择一个答案！</p>';
            }
        }
    });
    
    // 难度变化
    difficulty.addEventListener('change', () => {
        if (currentMode === 'fill-blank') {
            generateFillBlankQuestion();
        }
    });
    
    // 检查挑战答案
    checkChallenge.addEventListener('click', () => {
        const selectedOption = document.querySelector('input[name="challenge-options"]:checked');
        
        if (selectedOption) {
            const userInput = selectedOption.value.trim().toLowerCase();
            const correctAnswer = currentQuestion.correctAnswer.toLowerCase();
            
            if (userInput === correctAnswer) {
                // 正确答案
                progressData.correct++;
                progressData.score += 10;
                progressData.masteredWords.add(currentQuestion.word.wordid);
                progressData.unmasteredWords.delete(currentQuestion.word.wordid);
                updateProgressDisplay();
                updateScoreDisplay();
                updateChallengeDisplay();
                
                // 显示正确反馈
                challengeFeedback.classList.remove('hidden');
                challengeFeedbackContent.className = 'p-4 bg-green-100 text-green-700 rounded-md';
                challengeFeedbackContent.innerHTML = `
                    <p class="font-medium">回答正确！</p>
                    <p class="mt-2">+10 分</p>
                `;
            } else {
                // 错误答案
                progressData.incorrect++;
                progressData.score = Math.max(0, progressData.score - 5);
                progressData.learningWords.add(currentQuestion.word.wordid);
                progressData.unmasteredWords.delete(currentQuestion.word.wordid);
                updateProgressDisplay();
                updateScoreDisplay();
                updateChallengeDisplay();
                
                // 显示错误反馈
                challengeFeedback.classList.remove('hidden');
                challengeFeedbackContent.className = 'p-4 bg-red-100 text-red-700 rounded-md';
                challengeFeedbackContent.innerHTML = `
                    <p class="font-medium">回答错误</p>
                    <p class="mt-2">正确答案：${currentQuestion.correctAnswer}</p>
                    <p>单词：${currentQuestion.word.spelling}</p>
                    <p>释义：${currentQuestion.word.paraphrase}</p>
                    <p class="mt-2">例句：${currentQuestion.example.en}</p>
                    <p>翻译：${currentQuestion.example.cn}</p>
                    <p class="mt-2 text-red-600">-5 分</p>
                `;
            }
        } else {
            // 没有选择答案
            challengeFeedback.classList.remove('hidden');
            challengeFeedbackContent.className = 'p-4 bg-yellow-100 text-yellow-700 rounded-md';
            challengeFeedbackContent.innerHTML = '<p class="font-medium">请选择一个答案！</p>';
        }
    });
    
    // 下一个挑战
    nextChallenge.addEventListener('click', () => {
        // 检查是否有选中的答案
        const selectedOption = document.querySelector('input[name="challenge-options"]:checked');
        
        if (selectedOption) {
            const userInput = selectedOption.value.trim().toLowerCase();
            const correctAnswer = currentQuestion.correctAnswer.toLowerCase();
            
            if (userInput === correctAnswer) {
                // 正确答案
                progressData.correct++;
                progressData.score += 10;
                progressData.masteredWords.add(currentQuestion.word.wordid);
                progressData.unmasteredWords.delete(currentQuestion.word.wordid);
                updateProgressDisplay();
                updateScoreDisplay();
                updateChallengeDisplay();
                
                if (currentLevel < maxLevel) {
                    // 进入下一关
                    currentLevel++;
                    updateChallengeDisplay();
                    generateChallengeQuestion();
                    challengeFeedback.classList.add('hidden');
                } else {
                    // 闯关完成
                    challengeFeedback.classList.remove('hidden');
                    challengeFeedbackContent.className = 'p-4 bg-green-100 text-green-700 rounded-md';
                    challengeFeedbackContent.innerHTML = `
                        <p class="font-medium">恭喜你完成了所有关卡！</p>
                        <p class="mt-2">最终得分：${progressData.score}</p>
                        <button id="restart-challenge" class="mt-4 bg-primary text-white px-6 py-2 rounded-md hover:bg-secondary transition-colors duration-200">
                            重新开始
                        </button>
                    `;
                    
                    // 添加重新开始按钮事件
                    document.getElementById('restart-challenge').addEventListener('click', () => {
                        currentLevel = 1;
                        progressData.score = 0;
                        updateChallengeDisplay();
                        generateChallengeQuestion();
                        challengeFeedback.classList.add('hidden');
                    });
                }
            } else {
                // 错误答案
                progressData.incorrect++;
                progressData.score = Math.max(0, progressData.score - 5);
                progressData.learningWords.add(currentQuestion.word.wordid);
                progressData.unmasteredWords.delete(currentQuestion.word.wordid);
                updateProgressDisplay();
                updateScoreDisplay();
                updateChallengeDisplay();
                
                // 显示错误反馈
                challengeFeedback.classList.remove('hidden');
                challengeFeedbackContent.className = 'p-4 bg-red-100 text-red-700 rounded-md';
                challengeFeedbackContent.innerHTML = `
                    <p class="font-medium">回答错误</p>
                    <p class="mt-2">正确答案：${currentQuestion.correctAnswer}</p>
                    <p>单词：${currentQuestion.word.spelling}</p>
                    <p>释义：${currentQuestion.word.paraphrase}</p>
                    <p class="mt-2">例句：${currentQuestion.example.en}</p>
                    <p>翻译：${currentQuestion.example.cn}</p>
                    <p class="mt-2 text-red-600">-5 分</p>
                    <button id="continue-challenge" class="mt-4 bg-primary text-white px-6 py-2 rounded-md hover:bg-secondary transition-colors duration-200">
                        继续下一关
                    </button>
                `;
                
                // 添加继续按钮事件
                document.getElementById('continue-challenge').addEventListener('click', () => {
                    if (currentLevel < maxLevel) {
                        currentLevel++;
                        updateChallengeDisplay();
                        generateChallengeQuestion();
                        challengeFeedback.classList.add('hidden');
                    } else {
                        // 闯关完成
                        challengeFeedback.classList.remove('hidden');
                        challengeFeedbackContent.className = 'p-4 bg-green-100 text-green-700 rounded-md';
                        challengeFeedbackContent.innerHTML = `
                            <p class="font-medium">恭喜你完成了所有关卡！</p>
                            <p class="mt-2">最终得分：${progressData.score}</p>
                            <button id="restart-challenge" class="mt-4 bg-primary text-white px-6 py-2 rounded-md hover:bg-secondary transition-colors duration-200">
                                重新开始
                            </button>
                        `;
                        
                        // 添加重新开始按钮事件
                        document.getElementById('restart-challenge').addEventListener('click', () => {
                            currentLevel = 1;
                            progressData.score = 0;
                            updateChallengeDisplay();
                            generateChallengeQuestion();
                            challengeFeedback.classList.add('hidden');
                        });
                    }
                });
            }
        } else {
            // 没有选择答案
            challengeFeedback.classList.remove('hidden');
            challengeFeedbackContent.className = 'p-4 bg-yellow-100 text-yellow-700 rounded-md';
            challengeFeedbackContent.innerHTML = '<p class="font-medium">请选择一个答案！</p>';
        }
    });
}

// 初始化导航
function initNavigation() {
    navExercise.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(exerciseSection);
        updateNavActive(navExercise);
    });
    
    navProgress.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(progressSection);
        updateNavActive(navProgress);
        updateProgressChart();
    });
    
    navSettings.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(settingsSection);
        updateNavActive(navSettings);
    });
}

// 初始化设置
function initSettings() {
    // 加载设置
    const savedSettings = localStorage.getItem('word-learning-settings');
    if (savedSettings) {
        settings = { ...settings, ...JSON.parse(savedSettings) };
        questionsPerSession.value = settings.questionsPerSession;
        autoPlayAudio.checked = settings.autoPlayAudio;
        minWordId.value = settings.minWordId;
        maxWordId.value = settings.maxWordId;
    }
    
    // 保存设置
    saveSettings.addEventListener('click', () => {
        settings.questionsPerSession = parseInt(questionsPerSession.value);
        settings.autoPlayAudio = autoPlayAudio.checked;
        settings.minWordId = parseInt(minWordId.value);
        settings.maxWordId = parseInt(maxWordId.value);
        
        localStorage.setItem('word-learning-settings', JSON.stringify(settings));
        
        // 显示保存成功提示
        const saveMessage = document.createElement('div');
        saveMessage.className = 'p-4 bg-green-100 text-green-700 rounded-md mb-4';
        saveMessage.textContent = '设置已保存';
        settingsSection.insertBefore(saveMessage, settingsSection.firstChild);
        
        // 3秒后移除提示
        setTimeout(() => {
            saveMessage.remove();
        }, 3000);
    });
}

// 显示模式
function showMode(modeElement) {
    fillBlankMode.classList.add('hidden');
    modeElement.classList.remove('hidden');
}

// 显示 section
function showSection(sectionElement) {
    exerciseSection.classList.add('hidden');
    progressSection.classList.add('hidden');
    settingsSection.classList.add('hidden');
    challengeSection.classList.add('hidden');
    sectionElement.classList.remove('hidden');
}

// 更新导航激活状态
function updateNavActive(navElement) {
    navExercise.classList.remove('active');
    navProgress.classList.remove('active');
    navSettings.classList.remove('active');
    navElement.classList.add('active');
}

// 生成填空题目（改为选择题）
function generateFillBlankQuestion() {
    // 根据难度选择单词
    let filteredWords = vocabularyData;
    const diff = difficulty.value;
    
    if (diff === 'easy') {
        // 选择频率较高的单词
        filteredWords = vocabularyData.filter(word => word.frequency > 0.5);
    } else if (diff === 'hard') {
        // 选择频率较低的单词
        filteredWords = vocabularyData.filter(word => word.frequency < 0.3);
    }
    
    // 随机选择一个单词
    const randomIndex = Math.floor(Math.random() * filteredWords.length);
    const word = filteredWords[randomIndex];
    
    // 随机选择一个例句
    const randomExampleIndex = Math.floor(Math.random() * word.examples.length);
    const example = word.examples[randomExampleIndex];
    
    // 生成填空句子
    const sentence = example.en;
    const wordSpelling = word.spelling;
    
    // 确保单词在句子中
    if (sentence.toLowerCase().includes(wordSpelling.toLowerCase())) {
        // 替换单词为空格
        const regex = new RegExp(wordSpelling, 'gi');
        const blankSentence = sentence.replace(regex, '<span class="font-bold text-primary">[ _____ ]</span>');
        exampleSentence.innerHTML = blankSentence;
        
        // 生成选项
        const options = generateOptions(wordSpelling, filteredWords);
        
        // 显示选项
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'mt-6 grid grid-cols-2 gap-4';
        optionsContainer.id = 'options-container';
        
        options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'flex items-center p-4 bg-neutral rounded-lg hover:bg-neutral-dark transition-colors duration-200 cursor-pointer';
            optionElement.innerHTML = `
                <input type="radio" id="option-${index}" name="options" value="${option}" class="mr-4 w-6 h-6">
                <label for="option-${index}" class="cursor-pointer text-lg font-medium flex-1">${option}</label>
            `;
            
            // 添加点击事件，点击整个div时选中单选按钮
            optionElement.addEventListener('click', () => {
                const radio = optionElement.querySelector('input[type="radio"]');
                radio.checked = true;
            });
            
            optionsContainer.appendChild(optionElement);
        });
        
        // 移除旧的选项容器
        const oldOptionsContainer = document.getElementById('options-container');
        if (oldOptionsContainer) {
            oldOptionsContainer.remove();
        }
        
        // 添加新的选项容器
        exampleSentence.parentNode.appendChild(optionsContainer);
        
        // 保存当前问题
        currentQuestion = {
            word: word,
            example: example,
            correctAnswer: wordSpelling
        };
        
        // 隐藏反馈
        feedback.classList.add('hidden');
    } else {
        // 如果单词不在句子中，重新生成
        generateFillBlankQuestion();
    }
}

// 生成选项
function generateOptions(correctAnswer, wordList) {
    const options = [correctAnswer];
    
    // 从单词列表中随机选择3个不同的单词作为干扰项
    while (options.length < 4) {
        const randomIndex = Math.floor(Math.random() * wordList.length);
        const randomWord = wordList[randomIndex].spelling;
        
        if (!options.includes(randomWord)) {
            options.push(randomWord);
        }
    }
    
    // 打乱选项顺序
    return shuffleArray(options);
}

// 打乱数组
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 检查填空答案
function checkFillBlankAnswer() {
    const selectedOption = document.querySelector('input[name="options"]:checked');
    
    if (!selectedOption) {
        // 没有选择选项
        feedback.classList.remove('hidden');
        feedbackContent.className = 'p-4 bg-yellow-100 text-yellow-700 rounded-md';
        feedbackContent.innerHTML = '<p class="font-medium">请选择一个选项！</p>';
        return;
    }
    
    const userInput = selectedOption.value.trim().toLowerCase();
    const correctAnswer = currentQuestion.correctAnswer.toLowerCase();
    
    // 显示反馈
    feedback.classList.remove('hidden');
    
    if (userInput === correctAnswer) {
        // 正确答案
        feedbackContent.className = 'p-4 bg-green-100 text-green-700 rounded-md';
        feedbackContent.innerHTML = `
            <p class="font-medium">回答正确！</p>
            <p class="mt-2">单词：${currentQuestion.word.spelling}</p>
            <p>释义：${currentQuestion.word.paraphrase}</p>
            <p class="mt-2">例句：${currentQuestion.example.en}</p>
            <p>翻译：${currentQuestion.example.cn}</p>
        `;
        
        // 更新进度和分数
        progressData.correct++;
        progressData.score += 10;
        progressData.masteredWords.add(currentQuestion.word.wordid);
        progressData.unmasteredWords.delete(currentQuestion.word.wordid);
    } else {
        // 错误答案
        feedbackContent.className = 'p-4 bg-red-100 text-red-700 rounded-md';
        feedbackContent.innerHTML = `
            <p class="font-medium">回答错误</p>
            <p class="mt-2">正确答案：${currentQuestion.correctAnswer}</p>
            <p>单词：${currentQuestion.word.spelling}</p>
            <p>释义：${currentQuestion.word.paraphrase}</p>
            <p class="mt-2">例句：${currentQuestion.example.en}</p>
            <p>翻译：${currentQuestion.example.cn}</p>
        `;
        
        // 更新进度和分数
        progressData.incorrect++;
        progressData.score = Math.max(0, progressData.score - 5); // 最少扣到0分
        progressData.learningWords.add(currentQuestion.word.wordid);
        progressData.unmasteredWords.delete(currentQuestion.word.wordid);
    }
    
    // 更新进度显示
    updateProgressDisplay();
    updateScoreDisplay();
}

// 生成挑战题目
function generateChallengeQuestion() {
    // 随机选择一个单词
    const randomIndex = Math.floor(Math.random() * vocabularyData.length);
    const word = vocabularyData[randomIndex];
    
    // 随机选择一个例句
    const randomExampleIndex = Math.floor(Math.random() * word.examples.length);
    const example = word.examples[randomExampleIndex];
    
    // 生成填空句子
    const sentence = example.en;
    const wordSpelling = word.spelling;
    
    // 确保单词在句子中
    if (sentence.toLowerCase().includes(wordSpelling.toLowerCase())) {
        // 替换单词为空格
        const regex = new RegExp(wordSpelling, 'gi');
        const blankSentence = sentence.replace(regex, '<span class="font-bold text-primary">[ _____ ]</span>');
        challengeExample.innerHTML = blankSentence;
        
        // 生成选项
        const options = generateOptions(wordSpelling, vocabularyData);
        
        // 显示选项
        challengeOptions.innerHTML = '';
        challengeOptions.className = 'grid grid-cols-2 gap-4';
        
        options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'flex items-center p-4 bg-neutral rounded-lg hover:bg-neutral-dark transition-colors duration-200 cursor-pointer';
            optionElement.innerHTML = `
                <input type="radio" id="challenge-option-${index}" name="challenge-options" value="${option}" class="mr-4 w-6 h-6">
                <label for="challenge-option-${index}" class="cursor-pointer text-lg font-medium flex-1">${option}</label>
            `;
            
            // 添加点击事件，点击整个div时选中单选按钮
            optionElement.addEventListener('click', () => {
                const radio = optionElement.querySelector('input[type="radio"]');
                radio.checked = true;
            });
            
            challengeOptions.appendChild(optionElement);
        });
        
        // 保存当前问题
        currentQuestion = {
            word: word,
            example: example,
            correctAnswer: wordSpelling
        };
        
        // 隐藏反馈
        challengeFeedback.classList.add('hidden');
    } else {
        // 如果单词不在句子中，重新生成
        generateChallengeQuestion();
    }
}

// 检查挑战答案
function checkChallengeAnswer() {
    const selectedOption = document.querySelector('input[name="challenge-options"]:checked');
    
    if (!selectedOption) {
        // 没有选择选项
        challengeFeedback.classList.remove('hidden');
        challengeFeedbackContent.className = 'p-4 bg-yellow-100 text-yellow-700 rounded-md';
        challengeFeedbackContent.innerHTML = '<p class="font-medium">请选择一个选项！</p>';
        return;
    }
    
    const userInput = selectedOption.value.trim().toLowerCase();
    const correctAnswer = currentQuestion.correctAnswer.toLowerCase();
    
    // 显示反馈
    challengeFeedback.classList.remove('hidden');
    
    if (userInput === correctAnswer) {
        // 正确答案
        challengeFeedbackContent.className = 'p-4 bg-green-100 text-green-700 rounded-md';
        challengeFeedbackContent.innerHTML = `
            <p class="font-medium">回答正确！</p>
            <p class="mt-2">单词：${currentQuestion.word.spelling}</p>
            <p>释义：${currentQuestion.word.paraphrase}</p>
            <p class="mt-2">例句：${currentQuestion.example.en}</p>
            <p>翻译：${currentQuestion.example.cn}</p>
            <p class="mt-2 text-green-600">+10 分</p>
        `;
        
        // 更新进度和分数
        progressData.correct++;
        progressData.score += 10;
        progressData.masteredWords.add(currentQuestion.word.wordid);
        progressData.unmasteredWords.delete(currentQuestion.word.wordid);
    } else {
        // 错误答案
        challengeFeedbackContent.className = 'p-4 bg-red-100 text-red-700 rounded-md';
        challengeFeedbackContent.innerHTML = `
            <p class="font-medium">回答错误</p>
            <p class="mt-2">正确答案：${currentQuestion.correctAnswer}</p>
            <p>单词：${currentQuestion.word.spelling}</p>
            <p>释义：${currentQuestion.word.paraphrase}</p>
            <p class="mt-2">例句：${currentQuestion.example.en}</p>
            <p>翻译：${currentQuestion.example.cn}</p>
            <p class="mt-2 text-red-600">-5 分</p>
        `;
        
        // 更新进度和分数
        progressData.incorrect++;
        progressData.score = Math.max(0, progressData.score - 5); // 最少扣到0分
        progressData.learningWords.add(currentQuestion.word.wordid);
        progressData.unmasteredWords.delete(currentQuestion.word.wordid);
    }
    
    // 更新进度显示
    updateProgressDisplay();
    updateScoreDisplay();
    updateChallengeDisplay();
}

// 更新进度显示
function updateProgressDisplay() {
    const totalWords = vocabularyData.length;
    const masteredCountValue = progressData.masteredWords.size;
    const learningCountValue = progressData.learningWords.size;
    const unmasteredCountValue = progressData.unmasteredWords.size;
    
    // 更新计数
    if (masteredCount) masteredCount.textContent = masteredCountValue;
    if (learningCount) learningCount.textContent = learningCountValue;
    if (unmasteredCount) unmasteredCount.textContent = unmasteredCountValue;
    
    // 更新进度条
    if (masteredProgress) masteredProgress.style.width = `${(masteredCountValue / totalWords) * 100}%`;
    if (learningProgress) learningProgress.style.width = `${(learningCountValue / totalWords) * 100}%`;
    if (unmasteredProgress) unmasteredProgress.style.width = `${(unmasteredCountValue / totalWords) * 100}%`;
}

// 更新分数显示
function updateScoreDisplay() {
    if (scoreDisplay) scoreDisplay.textContent = progressData.score;
}

// 更新挑战显示
function updateChallengeDisplay() {
    if (challengeLevel) challengeLevel.textContent = currentLevel;
    if (challengeScore) challengeScore.textContent = progressData.score;
    if (levelDisplay) levelDisplay.textContent = currentLevel;
    if (levelProgress) levelProgress.style.width = `${(currentLevel / maxLevel) * 100}%`;
    if (levelProgressText) levelProgressText.textContent = `${currentLevel}/${maxLevel}`;
}

// 更新进度图表
function updateProgressChart() {
    const ctx = document.getElementById('progress-chart');
    
    // 销毁现有图表
    if (window.progressChart) {
        window.progressChart.destroy();
    }
    
    // 创建新图表
    window.progressChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['正确', '错误'],
            datasets: [{
                label: '答题数量',
                data: [progressData.correct, progressData.incorrect],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 99, 132, 0.6)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// 初始化应用
init();
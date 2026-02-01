const fs = require('fs');

// 读取原始数据
console.log('正在读取数据文件...');
const vocabularyData = JSON.parse(fs.readFileSync('data/tb_vocabulary.json', 'utf8'));
const examplesData = JSON.parse(fs.readFileSync('data/tb_voc_examples.json', 'utf8'));

console.log(`词汇数据: ${vocabularyData.length} 条`);
console.log(`例句数据: ${examplesData.length} 条`);

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
console.log(`有例句的单词: ${vocabularyData.length} 条`);

// 按频率排序，只保留高频词汇
vocabularyData.sort((a, b) => (b.frequency || 0) - (a.frequency || 0));
const simplifiedVocab = vocabularyData.slice(0, 1000);
console.log(`精选高频词汇: ${simplifiedVocab.length} 条`);

// 提取这些单词的例句
const simplifiedExamples = [];
const wordIds = new Set(simplifiedVocab.map(w => w.wordid));
examplesData.forEach(example => {
    if (wordIds.has(example.wordid)) {
        simplifiedExamples.push(example);
    }
});
console.log(`精选例句: ${simplifiedExamples.length} 条`);

// 移除词汇数据中的 examples 字段（因为例句已经单独存储）
simplifiedVocab.forEach(word => {
    delete word.examples;
});

// 保存精简数据
console.log('正在保存精简数据...');
fs.writeFileSync('data/tb_vocabulary_simple.json', JSON.stringify(simplifiedVocab), 'utf8');
fs.writeFileSync('data/tb_voc_examples_simple.json', JSON.stringify(simplifiedExamples), 'utf8');

// 显示文件大小
const vocabSize = fs.statSync('data/tb_vocabulary_simple.json').size / 1024 / 1024;
const examplesSize = fs.statSync('data/tb_voc_examples_simple.json').size / 1024 / 1024;

console.log('\n完成！');
console.log(`精简词汇文件: ${vocabSize.toFixed(2)} MB`);
console.log(`精简例句文件: ${examplesSize.toFixed(2)} MB`);
console.log(`总计: ${(vocabSize + examplesSize).toFixed(2)} MB`);
console.log('\n请在 index.html 和 js/app.js 中将文件名改为:');
console.log('  data/tb_vocabulary_simple.json');
console.log('  data/tb_voc_examples_simple.json');

import json

print('正在读取数据文件...')
with open('data/tb_vocabulary.json', 'r', encoding='utf-8') as f:
    vocabularyData = json.load(f)
with open('data/tb_voc_examples.json', 'r', encoding='utf-8') as f:
    examplesData = json.load(f)

print(f'词汇数据: {len(vocabularyData)} 条')
print(f'例句数据: {len(examplesData)} 条')

# 按wordid对例句进行分组
groupedExamples = {}
for example in examplesData:
    wordid = example['wordid']
    if wordid not in groupedExamples:
        groupedExamples[wordid] = []
    groupedExamples[wordid].append(example)

# 将例句添加到词汇数据中
for word in vocabularyData:
    word['examples'] = groupedExamples.get(word['wordid'], [])

# 过滤掉没有例句的单词
vocabularyData = [word for word in vocabularyData if word['examples']]
print(f'有例句的单词: {len(vocabularyData)} 条')

# 按频率排序，只保留高频词汇
vocabularyData.sort(key=lambda x: (x.get('frequency') or 0), reverse=True)
simplifiedVocab = vocabularyData[:1000]
print(f'精选高频词汇: {len(simplifiedVocab)} 条')

# 提取这些单词的例句
wordIds = {w['wordid'] for w in simplifiedVocab}
simplifiedExamples = [e for e in examplesData if e['wordid'] in wordIds]
print(f'精选例句: {len(simplifiedExamples)} 条')

# 移除词汇数据中的 examples 字段（因为例句已经单独存储）
for word in simplifiedVocab:
    if 'examples' in word:
        del word['examples']

# 保存精简数据
print('正在保存精简数据...')
with open('data/tb_vocabulary_simple.json', 'w', encoding='utf-8') as f:
    json.dump(simplifiedVocab, f, ensure_ascii=False, indent=2)
with open('data/tb_voc_examples_simple.json', 'w', encoding='utf-8') as f:
    json.dump(simplifiedExamples, f, ensure_ascii=False, indent=2)

# 显示文件大小
import os
vocabSize = os.path.getsize('data/tb_vocabulary_simple.json') / 1024 / 1024
examplesSize = os.path.getsize('data/tb_voc_examples_simple.json') / 1024 / 1024

print('\n完成！')
print(f'精简词汇文件: {vocabSize:.2f} MB')
print(f'精简例句文件: {examplesSize:.2f} MB')
print(f'总计: {vocabSize + examplesSize:.2f} MB')
print('\n需要在 index.html 和 js/app.js 中将文件名改为:')
print('  data/tb_vocabulary_simple.json')
print('  data/tb_voc_examples_simple.json')

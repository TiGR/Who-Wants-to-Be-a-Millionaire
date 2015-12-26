# Use me to import questions from a file
# File format:
# You can write many sets, each set starts with line starting with # sign
# Each set must contain 15 lines of questions
# Each question contains of Question and 4 answers, they must be delimetered by tab symbol
# Correct answer must start with ~ sign
# EXAMPLE is in inputExample.txt

import json
import sys

if len(sys.argv) != 2:
	print("Usage:")
	print("python importFromFile.py <inputFileName>")
	print("Example of input file is inputExample.txt")
	sys.exit(1)

fileName = sys.argv[1]

file = open(fileName, 'r')

currentArray = []
allData = {'games': []}

for line in file:
	line = line.rstrip()
	if line == '' or line.isspace():
		continue
	if line.startswith('#'):
		if len(currentArray) == 0:
			continue
		allData['games'].append({'questions': currentArray})
		currentArray = []
		continue
	data = line.split('\t')
	q = data[0]
	answers = data[1:]
	correct = 0
	for idx, a in enumerate(answers):
		if a.startswith('~'):
			correct = idx
	answers[correct] = answers[correct][1:]
	currentArray.append({'question': q, 'correct': correct, 'content': answers})

if not len(currentArray) == 0:
	allData['games'].append({'questions': currentArray})

jsont = json.dumps(allData, indent=4, separators=(',', ': '))

with open('../questions.json', 'w') as f:
	f.write(jsont)
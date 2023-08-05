import fs from 'fs'
import { parseSync, stringifySync } from 'subtitle'

var args = process.argv.slice(2);
const max_line_length = args[0];

console.log("max line length:" + max_line_length);

let tooLongLines;

//Usage: node index.js 56

let subtitles = fs.readdirSync('./src')
let supportExtensions = ['srt', 'vtt']
for (let subtitleFile of subtitles) {
  if (!supportExtensions.includes(subtitleFile.split('.').pop())) continue
  let subtitleInput = fs.readFileSync(`./src/${subtitleFile}`, 'utf8');
  
  subtitleInput = parseSync(subtitleInput);
  subtitleInput = subtitleInput.filter(line => line.type === 'cue');

  let subtitleOutput = [];
  let current = "";
  let next = "";

  // split in half the long sentences
  let currentSentence;
  let i = 0;
  let j = 0;
  let numb;
  let firstSameSentence;
  let middleSameSentence;
  let lastSameSentence;
  tooLongLines = 0;
  while (i<subtitleInput.length-1) {
      currentSentence = cleanSentence(subtitleInput[i].data.text);
      j=i+1;
      while (cleanSentence(subtitleInput[j].data.text) === currentSentence && j < subtitleInput.length-1) {
        j++;
      }
      firstSameSentence = subtitleInput[i];
      numb = j-i;
      middleSameSentence = subtitleInput[i + parseInt(numb/2)];
      if (middleSameSentence.data.text.indexOf("<u>") === -1) {
        middleSameSentence = subtitleInput[i + parseInt(numb/2) + 1];
      }
      lastSameSentence = subtitleInput[j-1];
      addNewSentence(firstSameSentence, middleSameSentence, lastSameSentence, subtitleOutput);
      i=j;
  }
    console.log("For subtitle " + subtitleFile + " there were " + tooLongLines + " that were too long");
    fs.writeFileSync(`./res/${subtitleFile}`, stringifySync(subtitleOutput, { format: 'srt' }))
}


function addNewSentence(firstSameSentence, middleSameSentence, lastSameSentence, subOutput) {
  if (cleanSentence(firstSameSentence.data.text).length > max_line_length && middleSameSentence.data.text.indexOf("</u>") > -1) {
    tooLongLines++;
    subOutput.push({
      type: 'cue',
      data: {
        start: firstSameSentence.data.start,
        end: middleSameSentence.data.end,
        text: cleanSentence(middleSameSentence.data.text.substring(0, middleSameSentence.data.text.indexOf("</u>")))
      }
    });

    subOutput.push({
      type: 'cue',
      data: {
        start: middleSameSentence.data.end,
        end: lastSameSentence.data.end,
        text: cleanSentence(middleSameSentence.data.text.substring(middleSameSentence.data.text.indexOf("</u>"), middleSameSentence.data.text.length))
      }
    });

  } else {
    subOutput.push({
      type: 'cue',
      data: {
        start: firstSameSentence.data.start,
        end: lastSameSentence.data.end,
        text: cleanSentence(firstSameSentence.data.text)
      }
    });
  }
}

function cleanSentence(sentence) {
  return sentence.replace("<u>","").replace("</u>", "");
}


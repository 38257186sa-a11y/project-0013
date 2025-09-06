// --- Question Bank ---
const BUILTIN_BANK = {
  political_science: [
    {title:'Hegemony in Gramsci', promptTopic:'Critically analyze the concept of hegemony in Antonio Gramsci’s Prison Notebooks.'},
    {title:'Sovereignty: Bodin & Hobbes', promptTopic:'Compare Jean Bodin and Thomas Hobbes on sovereignty.'}
  ],
  ssc_history: [{title:'Revolt of 1857', promptTopic:'Discuss causes and consequences of the Revolt of 1857.'}],
  history: [{title:'Ashoka and Dhamma', promptTopic:'Explain Ashoka’s Dhamma policy and its impact.'}],
  world_history: [{title:'Russian Revolution 1917', promptTopic:'Analyze causes and consequences of the Russian Revolution of 1917.'}],
  languages: [{title:'Kumaran Asan', promptTopic:'Discuss Kumaran Asan’s role in Malayalam modern poetry.'}],
  mixed: [{title:'Comparative Politics', promptTopic:'Trace transformation of Comparative Politics after WWII.'}]
};

function log(msg){const a=document.getElementById('logArea');a.innerText=(new Date()).toLocaleTimeString()+' — '+msg+'\\n'+a.innerText;}
function formatDate(d){return d.toISOString().slice(0,10);}
function seedFromDate(dateStr){let s=0;for(let i=0;i<dateStr.length;i++)s=((s<<5)-s)+dateStr.charCodeAt(i);return Math.abs(s);}
function pickFromBank(topic,seed){const arr=BUILTIN_BANK[topic]||BUILTIN_BANK['mixed'];return arr[seed%arr.length];}
function generateComprehensionPlaceholders(n){return Array.from({length:n},(_,i)=>({q:`Comprehension Q${i+1}?`,answer:'[Answer]'}));}
function generateMCQPlaceholders(n){return Array.from({length:n},(_,i)=>({q:`MCQ ${i+1}?`,options:['A','B','C','D'],answer:'A'}));}

// --- DeepSeek call ---
async function generateWithDeepSeek(prompt){
  try {
    const res = await fetch(\"/.netlify/functions/deepseek\", {
      method: \"POST\", headers: { \"Content-Type\": \"application/json\" },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    return data.output || \"[No output from DeepSeek]\";
  } catch(e){ log(\"DeepSeek error: \"+e.message); return \"[Error calling DeepSeek]\"; }
}

// --- Module generation ---
async function generateModule({topic,mode,date,essayCount,compCount,mcqCount}){
  const dateStr=formatDate(date);
  const seed=seedFromDate(dateStr);
  document.getElementById('seedDisplay').innerText=seed;
  document.getElementById('dateDisplay').innerText=dateStr;

  const base=pickFromBank(topic,seed);
  const essays=[];

  for(let i=0;i<essayCount;i++){
    let essayText=`LOCAL_PLACEHOLDER: ${base.promptTopic}`;
    if(mode==='deepseek'){
      essayText=await generateWithDeepSeek(`Write a 1000-word academic essay on: ${base.promptTopic}`);
    }
    essays.push({
      title:base.title,
      essay:essayText,
      comprehension:generateComprehensionPlaceholders(compCount),
      mcq:generateMCQPlaceholders(mcqCount)
    });
  }

  return {date:dateStr,seed,topic,essays};
}

function renderModule(mod){
  const el=document.getElementById('questionArea');el.innerHTML='';
  mod.essays.forEach((es,idx)=>{
    const wrap=document.createElement('div');wrap.className='card';
    wrap.innerHTML=`<h3>${idx+1}. ${es.title}</h3><div>${es.essay}</div>`;
    const compH=document.createElement('h4');compH.innerText='Comprehension Questions';wrap.appendChild(compH);
    const compList=document.createElement('ol');es.comprehension.forEach(c=>{const li=document.createElement('li');li.innerText=c.q;compList.appendChild(li);});wrap.appendChild(compList);
    const mcqH=document.createElement('h4');mcqH.innerText='MCQs';wrap.appendChild(mcqH);
    es.mcq.forEach(m=>{const d=document.createElement('div');d.className='mcq';d.innerHTML=`<div><strong>Q:</strong> ${m.q}</div><div>A) ${m.options[0]}</div><div>B) ${m.options[1]}</div><div>C) ${m.options[2]}</div><div>D) ${m.options[3]}</div><div class='small'><strong>Answer:</strong> ${m.answer}</div>`;wrap.appendChild(d);});
    el.appendChild(wrap);
  });
}

// --- Events ---
document.getElementById('generateBtn').addEventListener('click',async()=>{
  const topic=document.getElementById('topicSelect').value;
  const mode=document.getElementById('modeSelect').value;
  const essayCount=parseInt(document.getElementById('essayCount').value)||1;
  const compCount=parseInt(document.getElementById('compCount').value)||10;
  const mcqCount=parseInt(document.getElementById('mcqCount').value)||2;
  const date=new Date();
  log(`Generating in ${mode} mode...`);
  const mod=await generateModule({topic,mode,date,essayCount,compCount,mcqCount});
  renderModule(mod);
  localStorage.setItem('last_module',JSON.stringify(mod));
  log('Module saved locally.');
});

// Init
document.getElementById('dateDisplay').innerText=formatDate(new Date());
document.getElementById('seedDisplay').innerText=seedFromDate(formatDate(new Date()));
const last=localStorage.getItem('last_module');if(last)renderModule(JSON.parse(last));

/** Optional private endpoint. Public static preview never calls this file. */
export function parseJsonSafe(text) {
  if (typeof text !== 'string' || text.length > 20000) return null;
  try {return JSON.parse(text);} catch {
    const start=text.indexOf('{'),end=text.lastIndexOf('}');
    if(start<0||end<=start)return null;
    try {return JSON.parse(text.slice(start,end+1));}catch{return null;}
  }
}
export function normalizeResult(parsed) {
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return null;
  const short=(value,limit)=>typeof value==='string'?value.trim().slice(0,limit):'';
  const decode=short(parsed.decode||parsed.interpretation,2400);
  if(!decode)return null;
  const raw=parsed.plan||parsed.study_plan;
  const plan=(Array.isArray(raw)?raw:typeof raw==='string'?raw.split(/\n|；|;|、/):[]).filter(v=>typeof v==='string').map(v=>v.trim().slice(0,240)).filter(Boolean).slice(0,8);
  return {decode,anxiety:short(parsed.anxiety||parsed.stressor,1600),plan,quote:short(parsed.quote,500)};
}
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  // Gate before reading private provider settings, parsing user input or making any request.
  if(process.env.PENGUIN_ENABLE_CLOUD!=='true')return res.status(503).json({error:'公开演示为离线模式；未启用个人模型后端。'});
  const allowed=process.env.PENGUIN_ALLOWED_ORIGIN||'http://127.0.0.1:4176';
  if(!req.headers?.origin||req.headers.origin!==allowed)return res.status(403).json({error:'仅接受自己配置的来源。'});
  res.setHeader('Access-Control-Allow-Origin',allowed);res.setHeader('Vary','Origin');
  if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');return res.status(204).end();}
  if(req.method!=='POST')return res.status(405).json({error:'仅支持POST。'});
  const body=typeof req.body==='string'?parseJsonSafe(req.body):req.body;
  const dream=typeof body?.dream==='string'?body.dream.trim():'';
  if(!dream||dream.length>2000)return res.status(400).json({error:'仅接受1至2000字的合成练习场景。'});
  const apiKey=process.env.ZHIPU_API_KEY,model=process.env.ZHIPU_MODEL;
  if(!apiKey||!model)return res.status(503).json({error:'个人后端尚未配置可用模型。'});
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
  try {
    const response=await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`},body:JSON.stringify({model,temperature:0.4,max_tokens:1200,messages:[{role:'system',content:'你提供合成内容的课程学习/创作联想。输入只是虚构场景，不是病史。禁止诊断、猜测真实心理原因、宣称疗效或预测。历史梦境叙事标签不能当科学证据。请根据电气工程关键词提供温和可选的练习，结果须标明未经验证。只输出JSON: {"decode":"联想示例","anxiety":"课程复习关注点","plan":["练习建议"],"quote":"不承诺效果的鼓励"}。'},{role:'user',content:`以下是合成场景，仅用于学习联想：${dream}`} ]})});
    if(!response.ok)return res.status(502).json({error:'外部模型请求未成功；未返回提供方原始错误或私人配置。'});
    const data=await response.json();const result=normalizeResult(parseJsonSafe(data?.choices?.[0]?.message?.content));
    if(!result)return res.status(502).json({error:'外部模型未返回有效的演示结构。'});
    return res.status(200).json(result);
  } catch {return res.status(502).json({error:'个人模型服务不可用或超时；可继续使用离线演示。'});}
  finally {clearTimeout(timeout);}
}

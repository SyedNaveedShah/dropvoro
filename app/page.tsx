'use client'
import { useState } from 'react'

export default function Page(){
  const [url,setUrl]=useState(''); const [loading,setLoading]=useState(false);
  const [result,setResult]=useState<any>(null); const [error,setError]=useState('');

  async function download(){
    if(!url) return; setLoading(true); setError(''); setResult(null);
    try{
      const isYT = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('shorts');
      if(isYT){
        const api = `https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encodeURIComponent(url)}`;
        const r = await fetch(api); const j = await r.json();
        const vUrl = j?.data?.url || j?.url || j?.data?.download;
        if(!vUrl) throw new Error();
        const vid = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/)?.[1] || '';
        setResult({title: j?.data?.title || 'YouTube Video', videoUrl: vUrl, thumb: vid? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : '', platform: 'YouTube'});
      } else {
        const r = await fetch(`/api/json?url=${encodeURIComponent(url)}`);
        const j = await r.json();
        const vUrl = j?.url || j?.picker?.[0]?.url;
        if(!vUrl) throw new Error();
        setResult({title: j?.title || 'Video', videoUrl: vUrl, thumb: j?.thumb || j?.picker?.[0]?.thumb || '', platform: j?.platform || 'Video'});
      }
    }catch{ setError('Link invalid hai. Public TikTok/YouTube link try karo.'); }
    setLoading(false);
  }

  return (
    <div style={{minHeight:'100vh',background:'#0a0a0f',color:'#fff',fontFamily:'system-ui',padding:20}}>
      <div style={{maxWidth:560,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginTop:50}}>
          <div style={{width:72,height:72,background:'linear-gradient(135deg,#8b5cf6,#ec4899)',borderRadius:20,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:32}}>⬇️</div>
          <h1 style={{fontSize:44,fontWeight:900,margin:'16px 0 6px',letterSpacing:-1}}>DropVoro</h1>
          <p style={{opacity:0.6,margin:0}}>Fast • Free • No Watermark • YouTube Works</p>
        </div>

        <div style={{background:'#161622',border:'1px solid #26263a',borderRadius:24,padding:20,marginTop:36}}>
          <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Paste YouTube / TikTok / Insta link..."
            style={{width:'100%',padding:'18px',borderRadius:14,background:'#0a0a0f',border:'1px solid #2a2a40',color:'#fff',fontSize:16,outline:'none',boxSizing:'border-box'}} />
          <button onClick={download} style={{width:'100%',marginTop:12,padding:16,borderRadius:14,background:loading?'#333':'linear-gradient(135deg,#8b5cf6,#7c3aed)',border:'none',color:'#fff',fontWeight:800,fontSize:17}}>
            {loading?'Please wait...':'Download Now'}
          </button>
          {error && <p style={{color:'#ff7a7a',textAlign:'center',marginTop:12}}>{error}</p>}
        </div>

        {result && (
          <div style={{background:'#161622',border:'1px solid #26263a',borderRadius:24,padding:16,marginTop:18}}>
            {result.thumb && <img src={result.thumb} style={{width:'100%',borderRadius:12,aspectRatio:'16/9',objectFit:'cover'}} />}
            <h3 style={{margin:'12px 0 4px'}}>{result.title}</h3>
            <p style={{opacity:0.5,fontSize:12,margin:0}}>{result.platform}</p>
            <a href={result.videoUrl} target="_blank" rel="noreferrer" style={{display:'block',textAlign:'center',marginTop:14,padding:14,borderRadius:12,background:'#22c55e',color:'#000',fontWeight:800,textDecoration:'none'}}>✅ Save Video - Click Here</a>
            <video src={result.videoUrl} controls style={{width:'100%',marginTop:12,borderRadius:12}} />
          </div>
        )}

        <p style={{textAlign:'center',opacity:0.3,marginTop:40,fontSize:11}}>DropVoro • Peshawar</p>
      </div>
    </div>
  )
}
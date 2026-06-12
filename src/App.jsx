import { useState, useRef, useEffect } from "react";

// ─── PRODUITS ANGY AVEC VRAIS PRIX ───────────────────────────────────────────
const CATALOGUE = {
  iphones: [
    {nom:"iPhone XR",     prix:{64:"90 000",128:"100 000",256:"120 000"}},
    {nom:"iPhone 11",     prix:{64:"115 000",128:"120 000",256:"130 000"}},
    {nom:"iPhone 11 Pro", prix:{64:"150 000",256:"165 000",512:"170 000"}},
    {nom:"iPhone 11 Pro Max", prix:{64:"165 000",256:"175 000",512:"190 000"}},
    {nom:"iPhone 12",     prix:{64:"140 000",128:"160 000",256:"180 000"}},
    {nom:"iPhone 12 Pro", prix:{128:"185 000",256:"195 000"}},
    {nom:"iPhone 12 Pro Max", prix:{128:"230 000",256:"250 000"}},
    {nom:"iPhone 13",     prix:{128:"190 000",256:"210 000"}},
    {nom:"iPhone 13 Pro", prix:{128:"240 000",256:"260 000"}},
    {nom:"iPhone 13 Pro Max", prix:{128:"290 000",256:"310 000",512:"340 000","1To":"360 000"}},
    {nom:"iPhone 14",     prix:{128:"250 000",256:"260 000"}},
    {nom:"iPhone 14 Pro", prix:{128:"290 000",256:"310 000"}},
    {nom:"iPhone 14 Pro Max", prix:{128:"370 000",256:"390 000",512:"410 000"}},
    {nom:"iPhone 15",     prix:{128:"290 000",256:"310 000"}},
    {nom:"iPhone 15 Pro", prix:{128:"370 000",256:"390 000"}},
    {nom:"iPhone 15 Pro Max", prix:{256:"430 000",512:"450 000"}},
    {nom:"iPhone 16",     prix:{128:"380 000",256:"400 000"}},
    {nom:"iPhone 16 Pro", prix:{256:"450 000",512:"470 000","1To":"490 000"}},
    {nom:"iPhone 16 Pro Max", prix:{256:"540 000",512:"560 000","1To":"580 000"}},
    {nom:"iPhone 17",     prix:{256:"510 000",512:"550 000"}},
    {nom:"iPhone 17 Air", prix:{256:"590 000"}},
    {nom:"iPhone 17 Pro", prix:{256:"660 000",512:"690 000","1To":"720 000"}},
    {nom:"iPhone 17 Pro Max", prix:{256:"780 000",512:"830 000","1To":"870 000"}},
  ]
};

const SYSTEM_PROMPT = `Tu es l'Assistant Commercial d'ANGY COMPANY, une boutique tech à Dakar, Sénégal. Tu t'appelles ANGY Assistant.

TON RÔLE :
- Accueillir chaleureusement les clients
- Présenter les produits avec les vrais prix
- Qualifier les prospects (quel iPhone ? quel budget ? quelle ville ?)
- Générer des devis personnalisés
- Encourager à contacter via WhatsApp pour finaliser
- Répondre en français naturel et sénégalais (tu peux utiliser quelques expressions locales)

CATALOGUE COMPLET :
${CATALOGUE.iphones.map(p => `${p.nom} : ${Object.entries(p.prix).map(([k,v])=>`${k}Go → ${v} FCFA`).join(", ")}`).join("\n")}

INFOS ANGY COMPANY :
- Localisation : Malika — Parcelles Assainies, Dakar
- Téléphone : +221 78 116 32 86 / +221 71 053 89 17
- WhatsApp : +221 78 116 32 86
- Site : angy-company-site.vercel.app
- Produits : 100% authentiques, importés des USA
- Paiement : Wave, Orange Money, Espèces
- Livraison : disponible sur Dakar

STYLE DE RÉPONSE :
- Chaleureux et professionnel
- Concis — max 3-4 lignes par réponse
- Toujours terminer par une question pour qualifier le client
- Utiliser des emojis avec modération
- Ne jamais inventer des prix — utiliser uniquement le catalogue ci-dessus
- Si le client demande un prix non listé, dire "contactez-nous sur WhatsApp"

OBJECTIF : Qualifier le prospect et l'amener à contacter sur WhatsApp pour finaliser la vente.`;

// ─── QUESTIONS RAPIDES ────────────────────────────────────────────────────────
const QUICK_REPLIES = [
  "Quels sont vos prix ?",
  "Vous avez l'iPhone 15 ?",
  "Vous livrez à Dakar ?",
  "C'est authentique ?",
  "Comment passer commande ?",
  "iPhone dans mon budget 200 000 FCFA",
];

export default function AngyAssistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "👋 Bonjour ! Je suis l'Assistant ANGY COMPANY.\n\nJe suis là pour vous aider à trouver le meilleur iPhone selon votre budget ! 📱\n\nQu'est-ce que je peux faire pour vous aujourd'hui ?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showEmbed, setShowEmbed] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const D = darkMode ? {
    bg:"#0A0A0F", card:"#111120", border:"rgba(255,255,255,0.08)",
    text:"#F0F0F8", muted:"#7788AA", input:"rgba(255,255,255,0.06)",
    msgUser:"#1400FF", msgBot:"#1C1C2E", bubble:"rgba(255,255,255,0.05)",
  } : {
    bg:"#F0F0F8", card:"#FFFFFF", border:"rgba(0,0,0,0.08)",
    text:"#0A0A1A", muted:"#556680", input:"rgba(0,0,30,0.04)",
    msgUser:"#1400FF", msgBot:"#F5F5FA", bubble:"rgba(0,0,0,0.04)",
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior:"smooth"});
  }, [messages]);

  const envoyer = async (texte) => {
    const msg = texte || input.trim();
    if(!msg || loading) return;
    setInput("");

    const newMessages = [...messages, {role:"user", content:msg}];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages.map(m => ({role: m.role, content: m.content}))
        })
      });

      if(!response.ok) {
        const err = await response.json();
        console.error("API error:", err);
        setMessages(prev => [...prev, {role:"assistant", content:"❌ Erreur API. Contactez-nous sur WhatsApp : +221 78 116 32 86 😊"}]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      const reply = data.content?.[0]?.text || "Désolé, je n'ai pas pu répondre. Contactez-nous sur WhatsApp : +221 78 116 32 86";
      setMessages(prev => [...prev, {role:"assistant", content:reply}]);
    } catch(e) {
      console.error("Fetch error:", e);
      setMessages(prev => [...prev, {role:"assistant", content:"❌ Erreur de connexion. Contactez-nous directement sur WhatsApp : +221 78 116 32 86 😊"}]);
    }
    setLoading(false);
  };

  const embedCode = `<!-- ANGY Assistant Widget -->
<script>
  window.ANGY_CONFIG = {
    primaryColor: "#1400FF",
    companyName: "ANGY COMPANY",
    greeting: "Bonjour ! Je suis l'Assistant ANGY. Comment puis-je vous aider ?"
  };
</script>
<script src="https://angy-assistant.vercel.app/widget.js"></script>`;

  return (
    <div style={{minHeight:"100vh",background:D.bg,color:D.text,fontFamily:"'SF Pro Display','Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column"}}>

      {/* HEADER */}
      <header style={{background:darkMode?"rgba(8,8,15,0.97)":"rgba(240,240,248,0.97)",backdropFilter:"blur(20px)",borderBottom:`1px solid ${D.border}`,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {/* Logo ANGY */}
          <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#1400FF,#7700CC)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🤖</div>
          <div>
            <div style={{fontWeight:800,fontSize:15}}>ANGY Assistant</div>
            <div style={{fontSize:11,color:"#30D158",display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#30D158"}}/>
              En ligne — Répond instantanément
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setShowEmbed(!showEmbed)} style={{padding:"7px 14px",borderRadius:9,background:D.input,border:`1px solid ${D.border}`,color:D.text,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>
            {"</>"}  Intégrer
          </button>
          <button onClick={()=>setDarkMode(d=>!d)} style={{padding:"7px 12px",borderRadius:9,background:D.input,border:`1px solid ${D.border}`,cursor:"pointer",fontSize:16}}>
            {darkMode?"☀️":"🌙"}
          </button>
        </div>
      </header>

      {/* EMBED CODE */}
      {showEmbed&&(
        <div style={{background:darkMode?"#0D0D1A":"#F5F5FF",borderBottom:`1px solid ${D.border}`,padding:"14px 20px"}}>
          <div style={{fontSize:12,fontWeight:700,color:D.muted,marginBottom:8,textTransform:"uppercase"}}>Code d'intégration pour votre site</div>
          <pre style={{background:D.bubble,border:`1px solid ${D.border}`,borderRadius:10,padding:"12px 16px",fontSize:11,color:D.text,overflowX:"auto",margin:0,whiteSpace:"pre-wrap"}}>
            {embedCode}
          </pre>
          <button onClick={()=>{navigator.clipboard.writeText(embedCode);}} style={{marginTop:8,padding:"6px 14px",borderRadius:8,background:"#1400FF",color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
            📋 Copier le code
          </button>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",flex:1,overflow:"hidden",maxWidth:1100,margin:"0 auto",width:"100%",padding:"0 16px",gap:16,paddingTop:16,paddingBottom:16}}>

        {/* CHAT */}
        <div style={{display:"flex",flexDirection:"column",background:D.card,border:`1px solid ${D.border}`,borderRadius:18,overflow:"hidden"}}>

          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"20px 16px",display:"flex",flexDirection:"column",gap:12}}>
            {messages.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",gap:10,alignItems:"flex-end"}}>
                {m.role==="assistant"&&(
                  <div style={{width:32,height:32,borderRadius:10,background:"linear-gradient(135deg,#1400FF,#7700CC)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>🤖</div>
                )}
                <div style={{maxWidth:"75%",padding:"11px 14px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?"linear-gradient(135deg,#1400FF,#7700CC)":D.msgBot,color:m.role==="user"?"#fff":D.text,fontSize:14,lineHeight:1.6,whiteSpace:"pre-wrap",boxShadow:m.role==="user"?"0 4px 14px rgba(20,0,255,0.3)":"none",border:m.role==="assistant"?`1px solid ${D.border}`:"none"}}>
                  {m.content}
                </div>
                {m.role==="user"&&(
                  <div style={{width:32,height:32,borderRadius:10,background:"rgba(20,0,255,0.15)",border:`1px solid rgba(20,0,255,0.3)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>👤</div>
                )}
              </div>
            ))}
            {loading&&(
              <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
                <div style={{width:32,height:32,borderRadius:10,background:"linear-gradient(135deg,#1400FF,#7700CC)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🤖</div>
                <div style={{padding:"12px 16px",borderRadius:"16px 16px 16px 4px",background:D.msgBot,border:`1px solid ${D.border}`,display:"flex",gap:4,alignItems:"center"}}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{width:7,height:7,borderRadius:"50%",background:D.muted,animation:`bounce 1s infinite ${i*0.15}s`}}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>

          {/* Quick replies */}
          <div style={{padding:"8px 16px",display:"flex",gap:6,overflowX:"auto",borderTop:`1px solid ${D.border}`}}>
            {QUICK_REPLIES.map(r=>(
              <button key={r} onClick={()=>envoyer(r)} disabled={loading}
                style={{padding:"6px 12px",borderRadius:99,border:`1px solid ${D.border}`,background:D.input,color:D.text,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:500,whiteSpace:"nowrap",flexShrink:0,transition:"all 0.15s"}}>
                {r}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{padding:"12px 16px",borderTop:`1px solid ${D.border}`,display:"flex",gap:10,alignItems:"center"}}>
            <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&envoyer()}
              placeholder="Tapez votre message..."
              style={{flex:1,background:D.input,border:`1px solid ${D.border}`,borderRadius:12,padding:"11px 14px",color:D.text,fontSize:14,fontFamily:"inherit",outline:"none"}}/>
            <button onClick={()=>envoyer()} disabled={loading||!input.trim()}
              style={{width:44,height:44,borderRadius:12,background:input.trim()&&!loading?"linear-gradient(135deg,#1400FF,#7700CC)":D.input,color:"#fff",border:"none",cursor:input.trim()&&!loading?"pointer":"default",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
              {loading?"⏳":"➤"}
            </button>
          </div>
        </div>

        {/* PANNEAU DROITE */}
        <div style={{display:"flex",flexDirection:"column",gap:14,overflowY:"auto"}}>

          {/* Actions rapides */}
          <div style={{background:D.card,border:`1px solid ${D.border}`,borderRadius:16,padding:16}}>
            <div style={{fontSize:11,fontWeight:700,color:D.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12}}>Actions rapides</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[
                {icon:"💬",label:"Ouvrir WhatsApp",color:"#25D366",action:()=>window.open("https://wa.me/221781163286","_blank")},
                {icon:"🌐",label:"Voir le site web",color:"#1400FF",action:()=>window.open("https://angy-company-site.vercel.app","_blank")},
                {icon:"🔄",label:"Réinitialiser chat",color:"#FF9F0A",action:()=>setMessages([{role:"assistant",content:"👋 Bonjour ! Je suis l'Assistant ANGY COMPANY.\n\nJe suis là pour vous aider à trouver le meilleur iPhone selon votre budget ! 📱\n\nQu'est-ce que je peux faire pour vous aujourd'hui ?"}])},
              ].map(a=>(
                <button key={a.label} onClick={a.action}
                  style={{padding:"10px 14px",borderRadius:11,background:`${a.color}14`,border:`1px solid ${a.color}33`,color:a.color,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,textAlign:"left",display:"flex",gap:10,alignItems:"center"}}>
                  <span>{a.icon}</span>{a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats conversation */}
          <div style={{background:D.card,border:`1px solid ${D.border}`,borderRadius:16,padding:16}}>
            <div style={{fontSize:11,fontWeight:700,color:D.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12}}>Cette conversation</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[
                {label:"Messages",value:messages.length,color:"#0A84FF"},
                {label:"Échanges",value:Math.floor(messages.length/2),color:"#BF5AF2"},
              ].map(s=>(
                <div key={s.label} style={{background:D.input,borderRadius:10,padding:"10px 12px"}}>
                  <div style={{fontSize:22,fontWeight:800,color:s.color}}>{s.value}</div>
                  <div style={{fontSize:11,color:D.muted,marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Catalogue rapide */}
          <div style={{background:D.card,border:`1px solid ${D.border}`,borderRadius:16,padding:16}}>
            <div style={{fontSize:11,fontWeight:700,color:D.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12}}>Top produits</div>
            {[
              {nom:"iPhone 17 Pro Max",prix:"780 000",icon:"📱"},
              {nom:"iPhone 16 Pro",prix:"450 000",icon:"📱"},
              {nom:"iPhone 15",prix:"290 000",icon:"📱"},
              {nom:"iPhone 13",prix:"190 000",icon:"📱"},
              {nom:"iPhone 11",prix:"115 000",icon:"📱"},
            ].map(p=>(
              <div key={p.nom} onClick={()=>envoyer(`Infos sur ${p.nom}`)}
                style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${D.border}`,cursor:"pointer"}}>
                <div style={{fontSize:13,fontWeight:600}}>{p.icon} {p.nom}</div>
                <div style={{fontSize:12,color:"#30D158",fontWeight:700}}>{p.prix} F</div>
              </div>
            ))}
          </div>

          {/* Info */}
          <div style={{background:"rgba(20,0,255,0.08)",border:"1px solid rgba(20,0,255,0.2)",borderRadius:16,padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:"#6680FF",marginBottom:8}}>💡 Comment utiliser</div>
            <div style={{fontSize:12,color:D.muted,lineHeight:1.7}}>
              Cet assistant répond automatiquement à vos clients 24h/24. Intégrez-le sur votre site web avec le code d'intégration.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%,100%{transform:translateY(0)}
          50%{transform:translateY(-4px)}
        }
      `}</style>
    </div>
  );
}

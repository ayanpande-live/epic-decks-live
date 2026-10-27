import { normalizeRequest, validateRequest, requestSummary } from "../assets/sourcing-request.mjs";

// Pokebro Outlook relay. All secrets MUST remain server-side. Inert until explicitly enabled.
// Microsoft 365 Graph app-only Mail.Send can have broad mailbox privileges.
// Before enabling, scope it to welcome@epic-decks.com via Exchange Online Application RBAC.
const DESTINATION="welcome@epic-decks.com";
const MAX_BYTES=12000;
const respond=(res,code,body)=>res.status(code).setHeader("Cache-Control","no-store").json(body);
const enabled=()=>["MS_TENANT_ID","MS_CLIENT_ID","MS_CLIENT_SECRET","TURNSTILE_SITE_KEY","TURNSTILE_SECRET_KEY","TURNSTILE_ALLOWED_HOSTNAME"]
  .every(k=>Boolean(process.env[k])) &&
  process.env.POKEBRO_MAIL_ENABLED==="true" && process.env.POKEBRO_MAIL_RATE_LIMIT_READY==="true";

function validEmail(s){
  return typeof s==="string" && s.length<255 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s.trim());
}
function hostnameIsAllowed(host,req){
  const expected=String(process.env.TURNSTILE_ALLOWED_HOSTNAME||"").toLowerCase().trim();
  return !!host && host.toLowerCase()===expected &&
    String(req.headers.host||"").split(":")[0].toLowerCase()===expected;
}
async function verifyChallenge(token,req){
  if(typeof token!=="string"||token.length>2048||!token)return false;
  const body=new URLSearchParams({secret:process.env.TURNSTILE_SECRET_KEY,response:token});
  const result=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{
    method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},
    body:body.toString(),signal:AbortSignal.timeout(8000)
  });
  if(!result.ok)return false;
  const obj=await result.json();
  return obj.success===true && obj.action==="pokebro_sourcing" &&
    hostnameIsAllowed(obj.hostname,req);
}
async function graphToken(){
  const tenant=encodeURIComponent(process.env.MS_TENANT_ID);
  const data=new URLSearchParams({client_id:process.env.MS_CLIENT_ID,client_secret:process.env.MS_CLIENT_SECRET,
    scope:"https://graph.microsoft.com/.default",grant_type:"client_credentials"});
  const reply=await fetch("https://login.microsoftonline.com/"+tenant+"/oauth2/v2.0/token",{
    method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},
    body:data.toString(),signal:AbortSignal.timeout(10000)
  });
  if(!reply.ok)throw Error("Microsoft authorization unavailable");
  const out=await reply.json();if(!out.access_token)throw Error("No Microsoft access token");
  return out.access_token;
}
async function send(token,to,subject,body,replyTo){
  const addr={emailAddress:{address:to}};
  const message={
    subject,
    body:{contentType:"text",content:body},
    toRecipients:[addr]
  };
  if(replyTo)message.replyTo=[{emailAddress:{address:replyTo}}];
  const url="https://graph.microsoft.com/v1.0/users/"+encodeURIComponent(DESTINATION)+"/sendMail";
  const r=await fetch(url,{method:"POST",headers:{"content-type":"application/json","authorization":"Bearer "+token},
    body:JSON.stringify({message,saveToSentItems:true}),signal:AbortSignal.timeout(12000)});
  if(r.status!==202)throw Error("Microsoft mail service could not accept the email");
}
export default async function handler(req,res){
  if(req.method==="GET")return respond(res,200,{enabled:enabled(),sitekey:enabled()?process.env.TURNSTILE_SITE_KEY:null});
  if(req.method!=="POST"){res.setHeader("Allow","GET, POST");return respond(res,405,{error:"Method not allowed"});}
  if(!enabled())return respond(res,503,{error:"Automatic email relay is not available. Use the email draft or copy option."});
  const length=Number(req.headers["content-length"]||0);
  if(length>MAX_BYTES)return respond(res,413,{error:"Request too large."});
  if(!String(req.headers["content-type"]||"").toLowerCase().includes("application/json"))return respond(res,415,{error:"JSON required."});
  const referer=req.headers.origin;
  if(referer){try{const url=new URL(referer);if(url.protocol!=="https:"||!hostnameIsAllowed(url.hostname,req))return respond(res,403,{error:"Origin mismatch"});}catch{return respond(res,403,{error:"Invalid origin"});}}
  try{
    const raw=typeof req.body==="string"?JSON.parse(req.body):req.body;
    if(!raw || JSON.stringify(raw).length>MAX_BYTES)return respond(res,413,{error:"Request too large."});
    if(raw.website) return respond(res,202,{accepted:true}); // Honeypot, no email
    if(raw.privacy_ack!==true)return respond(res,400,{error:"Acknowledge the privacy notice to submit."});
    const contact=String(raw.customer_email||"").trim();
    if(!validEmail(contact))return respond(res,400,{error:"Please provide a valid reply email."});
    const request=normalizeRequest(raw.request||{});
    const issues=validateRequest(request);if(issues.length)return respond(res,400,{error:issues[0]});
    const challenge=await verifyChallenge(raw.turnstile_token,req);
    if(!challenge)return respond(res,403,{error:"Security challenge expired or failed. Please try again."});
    const bearer=await graphToken();
    const summary=requestSummary(request);
    const ticket="PB-"+new Date().toISOString().slice(0,10).replaceAll("-","")+
      "-"+Math.random().toString(36).slice(2,8).toUpperCase();
    const internal=[
      "Pokébro sourcing enquiry / "+ticket,
      "Customer reply address: "+contact,
      "Submission channel: website",
      "Request reference: "+ticket,
      "",
      summary,
      "",
      "Manual follow-up required. Never treat an emailed request as buyer purchase approval."
    ].join("\n");
    await send(bearer,DESTINATION,"[Pokébro request] "+request.card.slice(0,75)+" ("+ticket+")",internal,contact);
    // Transactional acknowledgement, best-effort only; a failed acknowledgement does not
    // undo the successfully accepted internal email.
    try{
      await send(bearer,contact,"Epic Decks received your sourcing request — "+ticket,
        "Thanks for contacting Epic Decks.\n\nWe received your sourcing enquiry (reference "+ticket+").\n"+
        "We'll review your requirements and reply with sourcing options or follow-up questions.\n"+
        "No purchase has been made or authorized. Pricing, inspection and shipping terms will be confirmed in a separate quote.\n\n"+
        "Regards,\nEpic Decks NL\nwelcome@epic-decks.com");
    }catch{ /* log no customer details or secrets; operator can resend manually */ }
    return respond(res,202,{accepted:true,reference:ticket});
  }catch{
    return respond(res,502,{error:"We couldn't confirm email delivery. Please copy the brief and email us directly; check with Epic Decks before retrying to avoid duplicate requests."});
  }
}

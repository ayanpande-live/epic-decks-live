// Legacy Vercel preview route, disabled while Epic Decks moves to AWS SES.
// The live form remains review/copy/mailto only; no automatic customer data is collected here.
// Production AWS will provide the same /api/sourcing-request interface once reviewed and deployed.
export default function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method==="GET")return res.status(200).json({enabled:false,siteKey:""});
  if(req.method==="POST")return res.status(503).json({
    error:"Automatic website email delivery is not configured yet. Please use the draft email option."
  });
  res.setHeader("Allow","GET, POST");
  return res.status(405).json({error:"Method not supported."});
}

"""Safe anonymous BikerLink API baseline probes for migration gates.

This script sends only GET, HEAD, OPTIONS, and anonymous WebSocket handshakes.
It does not log in or send application writes, uploads, SOS, notifications, or
callbacks. Authenticated gate checks must be performed separately with an
authorized sandbox account and must never use a real SOS action.
"""

import argparse
import json
import statistics
import time
import urllib.request
import urllib.error
import subprocess
from pathlib import Path

TARGETS={"public_apex":"https://biker-link.net","railway_origin":"https://bikerlink-production.up.railway.app"}
GETS=[
 ("health","/api/health",200),("readiness","/healthz",200),
 ("auth_session","/api/auth/me",401),("profile","/api/users/me",401),
 ("chat","/api/chat/conversations",401),("chat_sse","/api/chat/stream",401),
 ("session_sse","/api/auth/session-events",401),("notifications","/api/notifications",401),
 ("ai_config","/api/ai/assistant/config",401),("apk_status","/api/download/apk/status",200),
 ("app_config","/api/config",200),("community_stats","/api/community/stats",200),
]
OPTIONS=[
 ("registration","/api/auth/register"),("login","/api/auth/login"),
 ("sos","/api/sos"),("chat_write","/api/chat/conversations"),
 ("telemetry_write","/api/telemetry/batch"),("image_upload","/api/users/me/photos"),
 ("media_upload","/api/admin/media/upload"),
]
HEADS=[("blog","/blog",200,None),("contact","/contact",200,None),("web_login","/accedi",200,None),
 ("web_admin_diagnostics","/admin/diagnostics/live",302,"/accedi?next=/admin/diagnostics/live"),
 ("privacy_policy_redirect","/privacy-policy",301,"/privacy"),
 ("planner_redirect","/pianifica",302,"/accedi?next=/pianifica"),
 ("apk_latest_redirect","/api/download/apk/latest",302,"https://drive.google.com/uc?export=download&id=15teG0lCIWFi6YuXtcfIMPjuWcctPc5cH"),
 ("r2_source_image","/assets/images/hero-forest.webp",200,None),("favicon","/favicon.png",200,None),
 ("leaflet_html","/leaflet-map.html",200,None),("roadmap_json","/roadmap.json",200,None)]
WEBSOCKETS=[("ws_admin_notifications","/ws/admin/notifications"),("ws_diagnostic","/ws/diagnostic")]

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None
opener=urllib.request.build_opener(NoRedirect)

def shape(body, ct):
    if not body: return {"kind":"empty"}
    if "json" in (ct or "").lower():
        try:
            x=json.loads(body)
            if isinstance(x,dict):
                result={"kind":"object","keys":sorted(x)[:40]}
                if x.get("revision") is not None: result["revision"]=x.get("revision")
                if x.get("state") is not None: result["state"]=x.get("state")
                if x.get("degraded") is not None: result["degraded"]=x.get("degraded")
                return result
            if isinstance(x,list): return {"kind":"array","length_at_least":len(x)}
            return {"kind":type(x).__name__}
        except: pass
    return {"kind":"non_json","bytes":len(body)}

def req(base,method,path,headers=None,data=None,timeout=12):
    url=base+path; start=time.perf_counter(); h=headers or {}
    r=urllib.request.Request(url,data=data,headers=h,method=method)
    try:
      with opener.open(r,timeout=timeout) as resp:
        body=resp.read(2048) if method!="HEAD" else b""
        status=resp.status; hdr=resp.headers
    except urllib.error.HTTPError as e:
      body=e.read(2048) if method!="HEAD" else b""; status=e.code; hdr=e.headers
    except Exception as e:
      return {"method":method,"url":url,"expected":None,"status":None,"error":type(e).__name__,"latency_ms":round((time.perf_counter()-start)*1000)}
    ct=hdr.get("Content-Type")
    setc=hdr.get_all("Set-Cookie") or []
    cookies=[]
    for c in setc:
      parts=[p.strip() for p in c.split(';')]
      cookies.append({"name":parts[0].split('=',1)[0],"attributes":[p for p in parts[1:] if p.lower().startswith(('path=','domain=','samesite=','secure','httponly','max-age=','expires='))]})
    return {"method":method,"url":url,"status":status,"latency_ms":round((time.perf_counter()-start)*1000),"content_type":ct,"schema":shape(body,ct),"headers":{k:hdr.get(k) for k in ["Cache-Control","Access-Control-Allow-Origin","Access-Control-Allow-Credentials","Access-Control-Allow-Methods","Access-Control-Allow-Headers","Vary","X-Content-Type-Options","Referrer-Policy"] if hdr.get(k) is not None},"cookies":cookies,"location":hdr.get("Location")}

def websocket_probe(base,path):
    url=base+path
    marker="__BIKERLINK_PROBE__"
    command=["curl","-sS","--http1.1","--max-time","8","-D","-","-o","/dev/null","-w",f"\\n{marker}%{{http_code}} %{{time_total}}\\n",
      "-H","Connection: Upgrade","-H","Upgrade: websocket","-H","Sec-WebSocket-Version: 13",
      "-H","Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==","-H","Origin: https://biker-link.net",url]
    start=time.perf_counter()
    result=subprocess.run(command,capture_output=True,text=True,check=False,timeout=10)
    output=result.stdout
    status_line=None
    response_headers={}
    for line in output.splitlines():
      if line.startswith("HTTP/"):
        status_line=line
        response_headers={}
      elif ":" in line and status_line:
        key,value=line.split(":",1)
        response_headers[key.strip().lower()]=value.strip()
    status_code=None
    latency_ms=round((time.perf_counter()-start)*1000)
    for line in output.splitlines():
      if line.startswith(marker):
        parts=line[len(marker):].split()
        if parts:
          try: status_code=int(parts[0])
          except ValueError: pass
        if len(parts)>1:
          try: latency_ms=round(float(parts[1])*1000)
          except ValueError: pass
    return {"method":"GET","url":url,"status":status_code,"latency_ms":latency_ms,"content_type":response_headers.get("content-type"),"schema":{"kind":"empty"},"headers":{k:response_headers[k] for k in ("connection","cache-control","access-control-allow-origin") if k in response_headers},"cookies":[],"location":response_headers.get("location"),"transport":"anonymous WebSocket upgrade probe via curl","probe_return_code":result.returncode,"probe_error":result.stderr.strip() or None}

out={"captured_at_utc":time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),"backend_revision_expected":"aedfb278f487105a10567c9efa4c090705b3d801","targets":{},"limitations":["No authenticated user credentials or session cookie were used.","No writes, SOS activation, notifications, uploads, or external callbacks were issued.","SSE endpoints were checked only for their anonymous response; no authenticated stream was opened.","WebSocket checks were anonymous handshakes expected to be rejected with HTTP 401; they do not validate an authenticated persistent session."]}
for name,base in TARGETS.items():
 items=[]
 for label,path,expected in GETS:
  row=req(base,"GET",path,{"Accept":"application/json, text/event-stream"},timeout=8); row.update({"test":label,"expected_status":expected,"pass":row.get("status")==expected}); items.append(row)
 for label,path in OPTIONS:
  row=req(base,"OPTIONS",path,{"Origin":"https://biker-link.net","Access-Control-Request-Method":"POST","Access-Control-Request-Headers":"content-type,authorization"},timeout=8)
  allow_methods=(row.get("headers") or {}).get("Access-Control-Allow-Methods","")
  allow_headers=(row.get("headers") or {}).get("Access-Control-Allow-Headers","").lower()
  row.update({"test":"cors_"+label,"expected_status":200,"pass":row.get("status")==200 and (row.get("headers") or {}).get("Access-Control-Allow-Origin")=="https://biker-link.net" and (row.get("headers") or {}).get("Access-Control-Allow-Credentials")=="true" and "post" in allow_methods.lower() and "content-type" in allow_headers and "authorization" in allow_headers})
  items.append(row)
 for label,path,expected,location in HEADS:
  row=req(base,"HEAD",path,{},timeout=8)
  row.update({"test":"head_"+label,"expected_status":expected,"expected_location":location,"pass":row.get("status")==expected and (location is None or row.get("location")==location)})
  items.append(row)
 for label,path in WEBSOCKETS:
  row=websocket_probe(base,path)
  row.update({"test":label,"expected_status":401,"pass":row.get("status")==401})
  items.append(row)
 health=next((r for r in items if r['test']=='health'),{})
 out['targets'][name]={"base_url":base,"revision":health.get("schema",{}).get("revision") if isinstance(health.get("schema"),dict) else None,"results":items}
parser=argparse.ArgumentParser()
parser.add_argument('--output',default='API_BEFORE.json',help='JSON evidence output path')
args=parser.parse_args()
output=Path(args.output)
output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps(out,indent=2,ensure_ascii=False)+"\n")
summary={}
for name,value in out['targets'].items():
 latencies=[r['latency_ms'] for r in value['results'] if r.get('latency_ms') is not None]
 summary[name]={"revision":value['revision'],"checks":len(value['results']),"pass":sum(r['pass'] is True for r in value['results']),"fail":sum(r['pass'] is False for r in value['results']),"median_latency_ms":statistics.median(latencies) if latencies else None,"output":str(output)}
print(json.dumps(summary,indent=2,ensure_ascii=False))

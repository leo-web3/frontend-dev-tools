var ContentScript=function(){"use strict";var E=Object.defineProperty;var x=(l,d,p)=>d in l?E(l,d,{enumerable:!0,configurable:!0,writable:!0,value:p}):l[d]=p;var u=(l,d,p)=>(x(l,typeof d!="symbol"?d+"":d,p),p);const l={INJECT_ENVIRONMENT:"INJECT_ENVIRONMENT",CREATE_OVERLAY:"CREATE_OVERLAY",UPDATE_OVERLAY:"UPDATE_OVERLAY",REMOVE_OVERLAY:"REMOVE_OVERLAY",TOGGLE_OVERLAY_VISIBILITY:"TOGGLE_OVERLAY_VISIBILITY",CORS_STATUS_CHANGED:"CORS_STATUS_CHANGED",GET_CURRENT_TAB:"GET_CURRENT_TAB",ADJUST_BROWSER_SIZE:"ADJUST_BROWSER_SIZE",SAVE_CONFIG:"SAVE_CONFIG",LOAD_CONFIG:"LOAD_CONFIG"};class d{constructor(){u(this,"overlays",new Map);u(this,"dragState",{isDragging:!1,startX:0,startY:0,startLeft:0,startTop:0});this.initializeGlobalStyles(),this.initializeEventListeners()}async createOverlay(e){try{return await(()=>new Promise(o=>{const r=()=>{if(document.body){const n=this.createOverlayElement(e);this.overlays.set(e.id,n),document.body.appendChild(n),o()}else setTimeout(r,10)};r()}))(),{success:!0,data:`Overlay ${e.id} created`}}catch(t){return{success:!1,error:t instanceof Error?t.message:"Failed to create overlay"}}}async updateOverlay(e,t){try{const o=this.overlays.get(e);return o?(this.applyUpdatesToElement(o,t),{success:!0,data:`Overlay ${e} updated`}):{success:!1,error:"Overlay not found"}}catch(o){return{success:!1,error:o instanceof Error?o.message:"Failed to update overlay"}}}async removeOverlay(e){try{const t=this.overlays.get(e);if(t){const o=t._menuElement;o&&o.parentNode&&o.parentNode.removeChild(o),t.remove(),this.overlays.delete(e)}return{success:!0,data:`Overlay ${e} removed`}}catch(t){return{success:!1,error:t instanceof Error?t.message:"Failed to remove overlay"}}}async toggleVisibility(e){try{const t=this.overlays.get(e);if(!t)return{success:!1,error:"Overlay not found"};const o=t.style.display!=="none";return t.style.display=o?"none":"block",{success:!0,data:`Overlay ${e} ${o?"hidden":"shown"}`}}catch(t){return{success:!1,error:t instanceof Error?t.message:"Failed to toggle visibility"}}}clearAllOverlays(){this.overlays.forEach(e=>{const t=e._menuElement;t&&t.parentNode&&t.parentNode.removeChild(t),e.remove()}),this.overlays.clear()}adjustOverlaysToPageChanges(){this.overlays.forEach((e,t)=>{document.body&&e.parentNode!==document.body&&document.body.appendChild(e)})}createOverlayElement(e){const t=document.createElement("div");t.className="fe-dev-tools-overlay-wrapper",t.setAttribute("data-overlay-id",e.id);const o=document.createElement("div");o.className="fe-dev-tools-overlay-container";const r=document.createElement("img");r.src=e.imageUrl,r.alt="UI Comparison Overlay",r.draggable=!1,r.onload=()=>{},o.appendChild(r);const n=this.createControlsElement(e.id);return t.appendChild(o),this.applyStylesAndProperties(t,e),this.positionMenuForOverlay(n,e),t._menuElement=n,t}positionMenuForOverlay(e,t){const{position:o,size:r}=t,n=o.x+r.width-45,i=o.y+r.height-45;e.style.setProperty("left",`${n}px`,"important"),e.style.setProperty("top",`${i}px`,"important"),e.parentNode||document.body.appendChild(e)}createControlsElement(e){const t=document.createElement("div");t.className="fe-dev-tools-menu-button",t.innerHTML="⚙️",t.title="图层设置";const o=document.createElement("div");o.className="fe-dev-tools-menu-dropdown",o.style.display="none",[{text:"🔒 冻结图层",action:"freeze",id:`freeze-${e}`},{text:"👁️ 隐藏图层",action:"hide",id:`hide-${e}`},{text:"📏 调整尺寸",action:"resize",id:`resize-${e}`},{text:"❌ 删除图层",action:"delete",id:`delete-${e}`}].forEach(({text:c,action:y,id:f})=>{const g=document.createElement("div");g.className="fe-dev-tools-menu-item",g.innerHTML=c,g.onclick=b=>{b.stopPropagation(),this.handleMenuAction(e,y),o.style.display="none"},o.appendChild(g)});const n=document.createElement("div");n.className="fe-dev-tools-menu-item fe-dev-tools-transparency-item";const i=document.createElement("span");i.textContent="🎨 透明度: ",i.style.fontSize="12px";const s=document.createElement("input");s.type="range",s.min="0",s.max="100",s.value="70",s.className="fe-dev-tools-transparency-slider",s.oninput=c=>{c.stopPropagation();const y=c.target.value,f=t.closest(".fe-dev-tools-overlay-container");f&&(f.style.opacity=(parseInt(y)/100).toString())},n.appendChild(i),n.appendChild(s),o.appendChild(n),t.onclick=c=>{c.stopPropagation();const y=o.style.display!=="none";o.style.display=y?"none":"block"},document.addEventListener("click",()=>{o.style.display="none"});const a=document.createElement("div");return a.className="fe-dev-tools-menu-container",a.appendChild(t),a.appendChild(o),a}applyStylesAndProperties(e,t){const{position:o,size:r,opacity:n,visible:i,locked:s}=t;e.style.setProperty("position","fixed","important"),e.style.setProperty("left",`${o.x}px`,"important"),e.style.setProperty("top",`${o.y}px`,"important"),e.style.setProperty("width",`${r.width}px`,"important"),e.style.setProperty("height",`${r.height}px`,"important"),e.style.setProperty("opacity",n.toString(),"important"),e.style.setProperty("display",i?"block":"none","important"),e.style.setProperty("z-index","999998","important"),e.style.setProperty("pointer-events",s?"none":"auto","important"),e.style.setProperty("user-select","none","important");const a=e.querySelector(".fe-dev-tools-overlay-container");a&&(a.style.setProperty("position","relative","important"),a.style.setProperty("width","100%","important"),a.style.setProperty("height","100%","important"),a.style.setProperty("border","2px dashed rgba(59, 130, 246, 0.5)","important"),a.style.setProperty("box-sizing","border-box","important")),s||(e.style.cursor="move",e.addEventListener("mousedown",y=>this.startDrag(y,t.id)));const c=e.querySelector("img");c&&(c.style.cssText=`
        width: auto !important;
        height: auto !important;
        max-width: 100% !important;
        max-height: 100% !important;
        display: block !important;
        pointer-events: none !important;
      `)}applyUpdatesToElement(e,t){if(t.position&&(e.style.left=`${t.position.x}px`,e.style.top=`${t.position.y}px`),t.size&&(e.style.width=`${t.size.width}px`,e.style.height=`${t.size.height}px`),t.opacity!==void 0&&(e.style.opacity=t.opacity.toString()),t.visible!==void 0){e.style.display=t.visible?"block":"none";const o=e._menuElement;o&&(o.style.display=t.visible?"block":"none")}if(t.locked!==void 0&&(e.style.pointerEvents=t.locked?"none":"auto",e.style.cursor=t.locked?"default":"move"),(t.position||t.size)&&e.hasAttribute("data-overlay-id")){const o=e._menuElement;if(o){const r=parseInt(e.style.left)||0,n=parseInt(e.style.top)||0,i=parseInt(e.style.width)||0,s=parseInt(e.style.height)||0;this.positionMenuForOverlay(o,{position:{x:r,y:n},size:{width:i,height:s}})}}}handleControlAction(e,t){switch(t){case"toggle":this.toggleVisibility(e);break;case"lock":break;case"delete":this.removeOverlay(e);break}}handleMenuAction(e,t){const o=this.overlays.get(e);if(o)switch(t){case"freeze":this.toggleFreeze(e,o);break;case"hide":this.toggleVisibility(e);break;case"resize":this.showResizeDialog(e,o);break;case"delete":this.removeOverlay(e);break}}toggleFreeze(e,t){var r;if(t.style.pointerEvents==="none"){t.style.pointerEvents="auto",t.style.cursor="move",t.style.border="2px dashed rgba(59, 130, 246, 0.5)";const n=i=>this.startDrag(i,e);t.addEventListener("mousedown",n)}else{t.style.pointerEvents="none",t.style.cursor="default",t.style.border="2px solid rgba(34, 197, 94, 0.8)";const n=t.cloneNode(!0);(r=t.parentNode)==null||r.replaceChild(n,t),this.overlays.set(e,n);const i=n.querySelector(".fe-dev-tools-menu-container");i&&(i.style.pointerEvents="auto")}}showResizeDialog(e,t){const o=parseInt(t.style.width)||300,r=parseInt(t.style.height)||200,n=prompt(`请输入新的宽度 (当前: ${o}px):`,o.toString());if(n===null)return;const i=prompt(`请输入新的高度 (当前: ${r}px):`,r.toString());if(i===null)return;const s=parseInt(n),a=parseInt(i);if(isNaN(s)||isNaN(a)||s<=0||a<=0){alert("请输入有效的数字");return}t.style.width=`${s}px`,t.style.height=`${a}px`,chrome.runtime.sendMessage({type:"UPDATE_OVERLAY_SIZE",payload:{id:e,size:{width:s,height:a}}})}startDrag(e,t){if(this.dragState.isDragging)return;const o=this.overlays.get(t);o&&(this.dragState={isDragging:!0,currentOverlay:t,startX:e.clientX,startY:e.clientY,startLeft:parseInt(o.style.left)||0,startTop:parseInt(o.style.top)||0},e.preventDefault())}initializeEventListeners(){document.addEventListener("mousemove",e=>{if(!this.dragState.isDragging||!this.dragState.currentOverlay)return;const t=this.overlays.get(this.dragState.currentOverlay);if(!t)return;const o=e.clientX-this.dragState.startX,r=e.clientY-this.dragState.startY;t.style.left=`${this.dragState.startLeft+o}px`,t.style.top=`${this.dragState.startTop+r}px`}),document.addEventListener("mouseup",()=>{if(this.dragState.isDragging){const e=this.dragState.currentOverlay;if(e){const t=this.overlays.get(e);if(t){const o=parseInt(t.style.left),r=parseInt(t.style.top);chrome.runtime.sendMessage({type:"UPDATE_OVERLAY_POSITION",payload:{id:e,position:{x:o,y:r}}})}}}this.dragState.isDragging=!1,this.dragState.currentOverlay=void 0}),document.addEventListener("keydown",e=>{e.ctrlKey&&e.shiftKey&&e.code==="KeyU"&&(e.preventDefault(),this.toggleAllOverlays()),e.code==="Escape"&&this.hideAllOverlays()})}toggleAllOverlays(){const t=Array.from(this.overlays.values()).filter(o=>o.style.display!=="none").length>0;this.overlays.forEach(o=>{o.style.display=t?"none":"block"})}hideAllOverlays(){this.overlays.forEach(e=>{e.style.display="none"})}initializeGlobalStyles(){const e="fe-dev-tools-overlay-styles";if(document.getElementById(e))return;const t=()=>{if(!document.head){setTimeout(t,10);return}const o=document.createElement("style");o.id=e,o.textContent=`
        .fe-dev-tools-overlay-wrapper {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          font-size: 12px !important;
        }
        
        .fe-dev-tools-overlay-container {
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        .fe-dev-tools-overlay-wrapper:hover .fe-dev-tools-menu-container {
          opacity: 1 !important;
        }
        
        .fe-dev-tools-menu-container {
          position: fixed !important;
          opacity: 0.8 !important;
          transition: opacity 0.2s ease !important;
          z-index: 999999 !important;
          pointer-events: auto !important;
        }
        
        .fe-dev-tools-menu-button {
          background: #007bff !important;
          color: white !important;
          border: 2px solid rgba(255, 255, 255, 0.5) !important;
          border-radius: 50% !important;
          width: 40px !important;
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          font-size: 20px !important;
          font-weight: bold !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 4px 16px rgba(0, 123, 255, 0.3) !important;
        }
        
        .fe-dev-tools-menu-button:hover {
          background: rgba(0, 0, 0, 0.9) !important;
          transform: scale(1.1) !important;
        }
        
        .fe-dev-tools-menu-dropdown {
          position: absolute !important;
          bottom: 40px !important;
          right: 0 !important;
          background: rgba(0, 0, 0, 0.9) !important;
          border-radius: 8px !important;
          padding: 8px !important;
          min-width: 160px !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
          backdrop-filter: blur(8px) !important;
        }
        
        .fe-dev-tools-menu-item {
          color: white !important;
          padding: 8px 12px !important;
          cursor: pointer !important;
          border-radius: 4px !important;
          font-size: 12px !important;
          line-height: 1.4 !important;
          transition: background 0.2s ease !important;
          white-space: nowrap !important;
        }
        
        .fe-dev-tools-menu-item:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }
        
        .fe-dev-tools-transparency-item {
          padding: 6px 12px !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }
        
        .fe-dev-tools-transparency-slider {
          flex: 1 !important;
          height: 4px !important;
          background: rgba(255, 255, 255, 0.3) !important;
          border-radius: 2px !important;
          outline: none !important;
          -webkit-appearance: none !important;
        }
        
        .fe-dev-tools-transparency-slider::-webkit-slider-thumb {
          -webkit-appearance: none !important;
          width: 12px !important;
          height: 12px !important;
          background: white !important;
          border-radius: 50% !important;
          cursor: pointer !important;
        }
        
        .fe-dev-tools-transparency-slider::-moz-range-thumb {
          width: 12px !important;
          height: 12px !important;
          background: white !important;
          border-radius: 50% !important;
          cursor: pointer !important;
          border: none !important;
        }
      `,document.head.appendChild(o)};t()}}const m=class m{constructor(){u(this,"uiComparator");this.uiComparator=new d,this.initializeMessageListeners(),this.initializePageObserver()}static getInstance(){return m.instance||(m.instance=new m),m.instance}initializeMessageListeners(){chrome.runtime.onMessage.addListener((e,t,o)=>(this.handleMessage(e).then(o),!0))}async handleMessage(e){try{const{type:t,payload:o}=e;switch(t){case l.CREATE_OVERLAY:return await this.uiComparator.createOverlay(o);case l.UPDATE_OVERLAY:return await this.uiComparator.updateOverlay(o.id,o.updates);case l.REMOVE_OVERLAY:return await this.uiComparator.removeOverlay(o.id);case l.TOGGLE_OVERLAY_VISIBILITY:return await this.uiComparator.toggleVisibility(o.id);case l.CORS_STATUS_CHANGED:return this.handleCorsStatusChange(o.enabled);default:throw new Error(`Unknown message type: ${t}`)}}catch(t){return{success:!1,error:t instanceof Error?t.message:"Unknown error"}}}handleCorsStatusChange(e){return this.showNotification(`CORS ${e?"enabled":"disabled"}`,e?"success":"info"),{success:!0}}initializePageObserver(){"navigation"in window?window.navigation.addEventListener("navigate",()=>{this.onPageChange()}):window.addEventListener("popstate",()=>{this.onPageChange()});const e=()=>{document.body?new MutationObserver(()=>{this.uiComparator.adjustOverlaysToPageChanges()}).observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["style","class"]}):setTimeout(e,10)};e()}onPageChange(){setTimeout(()=>{this.uiComparator.clearAllOverlays(),this.loadOverlaysForCurrentPage()},100)}async loadOverlaysForCurrentPage(){var e;try{const t=await chrome.runtime.sendMessage({type:l.LOAD_CONFIG,payload:{url:window.location.href}});if(t.success&&((e=t.data)!=null&&e.overlays))for(const o of t.data.overlays)await this.uiComparator.createOverlay(o)}catch{}}showNotification(e,t){const o=()=>{if(!document.body){setTimeout(o,10);return}const r=document.createElement("div");r.className=`fe-dev-tools-notification fe-dev-tools-notification--${t}`,r.textContent=e;const n=`
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: ${t==="success"?"#10b981":t==="error"?"#ef4444":"#3b82f6"} !important;
        color: white !important;
        padding: 12px 16px !important;
        border-radius: 6px !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
        z-index: 999999 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        transition: all 0.3s ease !important;
        opacity: 0 !important;
        transform: translateX(100%) !important;
      `;r.setAttribute("style",n),document.body.appendChild(r),requestAnimationFrame(()=>{r.style.opacity="1",r.style.transform="translateX(0)"}),setTimeout(()=>{r.style.opacity="0",r.style.transform="translateX(100%)",setTimeout(()=>{r.parentNode&&r.parentNode.removeChild(r)},300)},3e3)};o()}initialize(){const e=()=>{if(!document.body){setTimeout(e,10);return}const t=document.createElement("div");t.id="fe-dev-tools-indicator",t.textContent="FE Dev Tools Loaded",t.style.cssText=`
        position: fixed !important;
        top: 10px !important;
        left: 10px !important;
        background: #10b981 !important;
        color: white !important;
        padding: 4px 8px !important;
        font-size: 12px !important;
        z-index: 999999 !important;
        border-radius: 4px !important;
      `,document.body.appendChild(t),setTimeout(()=>{t==null||t.remove()},3e3)};e(),document.readyState==="complete"?this.loadOverlaysForCurrentPage():window.addEventListener("load",()=>{this.loadOverlaysForCurrentPage()})}cleanup(){this.uiComparator.clearAllOverlays()}};u(m,"instance");let p=m;const h=p.getInstance();return h.initialize(),window.addEventListener("beforeunload",()=>{h.cleanup()}),chrome.runtime.onConnect.addListener(v=>{v.onDisconnect.addListener(()=>{h.cleanup()})}),h}();

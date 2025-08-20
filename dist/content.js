var ContentScript=function(){"use strict";var v=Object.defineProperty;var f=(i,s,l)=>s in i?v(i,s,{enumerable:!0,configurable:!0,writable:!0,value:l}):i[s]=l;var y=(i,s,l)=>(f(i,typeof s!="symbol"?s+"":s,l),l);const i={INJECT_ENVIRONMENT:"INJECT_ENVIRONMENT",CREATE_OVERLAY:"CREATE_OVERLAY",UPDATE_OVERLAY:"UPDATE_OVERLAY",REMOVE_OVERLAY:"REMOVE_OVERLAY",TOGGLE_OVERLAY_VISIBILITY:"TOGGLE_OVERLAY_VISIBILITY",CORS_STATUS_CHANGED:"CORS_STATUS_CHANGED",GET_CURRENT_TAB:"GET_CURRENT_TAB",ADJUST_BROWSER_SIZE:"ADJUST_BROWSER_SIZE",SAVE_CONFIG:"SAVE_CONFIG",LOAD_CONFIG:"LOAD_CONFIG"};class s{constructor(){y(this,"overlays",new Map);y(this,"globalMenuContainer",null);y(this,"dragState",{isDragging:!1,startX:0,startY:0,startLeft:0,startTop:0});this.initializeGlobalStyles(),this.initializeEventListeners()}async createOverlay(t){try{return await(()=>new Promise(o=>{const n=()=>{if(document.body){this.globalMenuContainer||this.createGlobalMenuContainer();const r=this.createOverlayElement(t);this.overlays.set(t.id,r),document.body.appendChild(r),this.updateGlobalMenuVisibility(),o()}else setTimeout(n,10)};n()}))(),{success:!0,data:`Overlay ${t.id} created`}}catch(e){return{success:!1,error:e instanceof Error?e.message:"Failed to create overlay"}}}async updateOverlay(t,e){try{const o=this.overlays.get(t);return o?(this.applyUpdatesToElement(o,e),{success:!0,data:`Overlay ${t} updated`}):{success:!1,error:"Overlay not found"}}catch(o){return{success:!1,error:o instanceof Error?o.message:"Failed to update overlay"}}}async removeOverlay(t){try{const e=this.overlays.get(t);return e&&(e.remove(),this.overlays.delete(t)),this.updateGlobalMenuVisibility(),{success:!0,data:`Overlay ${t} removed`}}catch(e){return{success:!1,error:e instanceof Error?e.message:"Failed to remove overlay"}}}async toggleVisibility(t){try{const e=this.overlays.get(t);if(!e)return{success:!1,error:"Overlay not found"};const o=e.style.display!=="none";return e.style.display=o?"none":"block",{success:!0,data:`Overlay ${t} ${o?"hidden":"shown"}`}}catch(e){return{success:!1,error:e instanceof Error?e.message:"Failed to toggle visibility"}}}clearAllOverlays(){this.overlays.forEach(t=>{t.remove()}),this.overlays.clear(),this.updateGlobalMenuVisibility()}adjustOverlaysToPageChanges(){this.overlays.forEach((t,e)=>{document.body&&t.parentNode!==document.body&&document.body.appendChild(t)})}createOverlayElement(t){const e=document.createElement("div");e.className="fe-dev-tools-overlay-wrapper",e.setAttribute("data-overlay-id",t.id);const o=document.createElement("div");o.className="fe-dev-tools-overlay-container";const n=document.createElement("img");return n.src=t.imageUrl,n.alt="UI Comparison Overlay",n.draggable=!1,n.onload=()=>{},o.appendChild(n),e.appendChild(o),this.applyStylesAndProperties(e,t),e}createGlobalMenuContainer(){if(this.globalMenuContainer)return;this.globalMenuContainer=document.createElement("div"),this.globalMenuContainer.className="fe-dev-tools-menu-container",this.globalMenuContainer.style.cssText=`
      position: fixed !important;
      bottom: 40px !important;
      right: 40px !important;
      z-index: 999999 !important;
      pointer-events: auto !important;
      opacity: 0.8 !important;
      transition: opacity 0.2s ease !important;
    `;const t=this.createMenuButton(),e=this.createMenuDropdown();this.globalMenuContainer.appendChild(t),this.globalMenuContainer.appendChild(e),document.body.appendChild(this.globalMenuContainer)}updateGlobalMenuVisibility(){if(this.globalMenuContainer){const t=this.overlays.size>0;this.globalMenuContainer.style.display=t?"block":"none"}}createMenuButton(){const t=document.createElement("div");return t.className="fe-dev-tools-menu-button",t.innerHTML="⚙️",t.title="图层设置",t.onclick=e=>{if(e.stopPropagation(),this.globalMenuContainer){const o=this.globalMenuContainer.querySelector(".fe-dev-tools-menu-dropdown");if(o){const n=o.style.display!=="none";o.style.display=n?"none":"block"}}},t}createMenuDropdown(){const t=document.createElement("div");t.className="fe-dev-tools-menu-dropdown",t.style.display="none",[{text:"👁️ 切换所有图层",action:"toggle-all"},{text:"🔒 冻结所有图层",action:"freeze-all"},{text:"❌ 删除所有图层",action:"delete-all"}].forEach(({text:p,action:c})=>{const a=document.createElement("div");a.className="fe-dev-tools-menu-item",a.innerHTML=p,a.onclick=m=>{m.stopPropagation(),this.handleGlobalMenuAction(c),t.style.display="none"},t.appendChild(a)});const o=document.createElement("div");o.className="fe-dev-tools-menu-item fe-dev-tools-transparency-item";const n=document.createElement("span");n.textContent="🎨 透明度: ",n.style.fontSize="12px";const r=document.createElement("input");return r.type="range",r.min="0",r.max="100",r.value="70",r.className="fe-dev-tools-transparency-slider",r.oninput=p=>{p.stopPropagation();const c=p.target.value,a=parseInt(c)/100;this.overlays.forEach(m=>{m.style.opacity=a.toString()})},o.appendChild(n),o.appendChild(r),t.appendChild(o),document.addEventListener("click",()=>{t.style.display="none"}),t}applyStylesAndProperties(t,e){const{position:o,size:n,opacity:r,visible:p,locked:c}=e;t.style.setProperty("position","fixed","important"),t.style.setProperty("left",`${o.x}px`,"important"),t.style.setProperty("top",`${o.y}px`,"important"),t.style.setProperty("width",`${n.width}px`,"important"),t.style.setProperty("height",`${n.height}px`,"important"),t.style.setProperty("opacity",r.toString(),"important"),t.style.setProperty("display",p?"block":"none","important"),t.style.setProperty("z-index","999998","important"),t.style.setProperty("pointer-events",c?"none":"auto","important"),t.style.setProperty("user-select","none","important");const a=t.querySelector(".fe-dev-tools-overlay-container");a&&(a.style.setProperty("position","relative","important"),a.style.setProperty("width","100%","important"),a.style.setProperty("height","100%","important"),a.style.setProperty("border","2px dashed rgba(59, 130, 246, 0.5)","important"),a.style.setProperty("box-sizing","border-box","important")),c||(t.style.cursor="move",t.addEventListener("mousedown",g=>this.startDrag(g,e.id)));const m=t.querySelector("img");m&&(m.style.cssText=`
        width: auto !important;
        height: auto !important;
        max-width: 100% !important;
        max-height: 100% !important;
        display: block !important;
        pointer-events: none !important;
      `)}applyUpdatesToElement(t,e){e.position&&(t.style.left=`${e.position.x}px`,t.style.top=`${e.position.y}px`),e.size&&(t.style.width=`${e.size.width}px`,t.style.height=`${e.size.height}px`),e.opacity!==void 0&&(t.style.opacity=e.opacity.toString()),e.visible!==void 0&&(t.style.display=e.visible?"block":"none"),e.locked!==void 0&&(t.style.pointerEvents=e.locked?"none":"auto",t.style.cursor=e.locked?"default":"move")}handleGlobalMenuAction(t){switch(t){case"toggle-all":this.toggleAllOverlays();break;case"freeze-all":this.freezeAllOverlays();break;case"delete-all":this.clearAllOverlays();break}}freezeAllOverlays(){this.overlays.forEach(t=>{if(t.style.pointerEvents==="none"){t.style.pointerEvents="auto",t.style.cursor="move";const o=t.querySelector(".fe-dev-tools-overlay-container");o&&(o.style.border="2px dashed rgba(59, 130, 246, 0.5)")}else{t.style.pointerEvents="none",t.style.cursor="default";const o=t.querySelector(".fe-dev-tools-overlay-container");o&&(o.style.border="2px solid rgba(34, 197, 94, 0.8)")}})}startDrag(t,e){if(this.dragState.isDragging)return;const o=this.overlays.get(e);o&&(this.dragState={isDragging:!0,currentOverlay:e,startX:t.clientX,startY:t.clientY,startLeft:parseInt(o.style.left)||0,startTop:parseInt(o.style.top)||0},t.preventDefault())}initializeEventListeners(){document.addEventListener("mousemove",t=>{if(!this.dragState.isDragging||!this.dragState.currentOverlay)return;const e=this.overlays.get(this.dragState.currentOverlay);if(!e)return;const o=t.clientX-this.dragState.startX,n=t.clientY-this.dragState.startY;e.style.left=`${this.dragState.startLeft+o}px`,e.style.top=`${this.dragState.startTop+n}px`}),document.addEventListener("mouseup",()=>{if(this.dragState.isDragging){const t=this.dragState.currentOverlay;if(t){const e=this.overlays.get(t);if(e){const o=parseInt(e.style.left),n=parseInt(e.style.top);chrome.runtime.sendMessage({type:"UPDATE_OVERLAY_POSITION",payload:{id:t,position:{x:o,y:n}}})}}}this.dragState.isDragging=!1,this.dragState.currentOverlay=void 0}),document.addEventListener("keydown",t=>{t.ctrlKey&&t.shiftKey&&t.code==="KeyU"&&(t.preventDefault(),this.toggleAllOverlays()),t.code==="Escape"&&this.hideAllOverlays()})}toggleAllOverlays(){const e=Array.from(this.overlays.values()).filter(o=>o.style.display!=="none").length>0;this.overlays.forEach(o=>{o.style.display=e?"none":"block"})}hideAllOverlays(){this.overlays.forEach(t=>{t.style.display="none"})}initializeGlobalStyles(){const t="fe-dev-tools-overlay-styles";if(document.getElementById(t))return;const e=()=>{if(!document.head){setTimeout(e,10);return}const o=document.createElement("style");o.id=t,o.textContent=`
        .fe-dev-tools-overlay-wrapper {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          font-size: 12px !important;
        }
        
        .fe-dev-tools-overlay-container {
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        .fe-dev-tools-menu-container {
          position: fixed !important;
          bottom: 40px !important;
          right: 40px !important;
          opacity: 0.8 !important;
          transition: opacity 0.2s ease !important;
          z-index: 999999 !important;
          pointer-events: auto !important;
        }
        
        .fe-dev-tools-menu-container:hover {
          opacity: 1 !important;
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
      `,document.head.appendChild(o)};e()}}const d=class d{constructor(){y(this,"uiComparator");this.uiComparator=new s,this.initializeMessageListeners(),this.initializePageObserver()}static getInstance(){return d.instance||(d.instance=new d),d.instance}initializeMessageListeners(){chrome.runtime.onMessage.addListener((t,e,o)=>(this.handleMessage(t).then(o),!0))}async handleMessage(t){try{const{type:e,payload:o}=t;switch(e){case i.CREATE_OVERLAY:return await this.uiComparator.createOverlay(o);case i.UPDATE_OVERLAY:return await this.uiComparator.updateOverlay(o.id,o.updates);case i.REMOVE_OVERLAY:return await this.uiComparator.removeOverlay(o.id);case i.TOGGLE_OVERLAY_VISIBILITY:return await this.uiComparator.toggleVisibility(o.id);case i.CORS_STATUS_CHANGED:return this.handleCorsStatusChange(o.enabled);default:throw new Error(`Unknown message type: ${e}`)}}catch(e){return{success:!1,error:e instanceof Error?e.message:"Unknown error"}}}handleCorsStatusChange(t){return this.showNotification(`CORS ${t?"enabled":"disabled"}`,t?"success":"info"),{success:!0}}initializePageObserver(){"navigation"in window?window.navigation.addEventListener("navigate",()=>{this.onPageChange()}):window.addEventListener("popstate",()=>{this.onPageChange()});const t=()=>{document.body?new MutationObserver(()=>{this.uiComparator.adjustOverlaysToPageChanges()}).observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["style","class"]}):setTimeout(t,10)};t()}onPageChange(){setTimeout(()=>{this.uiComparator.clearAllOverlays(),this.loadOverlaysForCurrentPage()},100)}async loadOverlaysForCurrentPage(){var t;try{const e=await chrome.runtime.sendMessage({type:i.LOAD_CONFIG,payload:{url:window.location.href}});if(e.success&&((t=e.data)!=null&&t.overlays))for(const o of e.data.overlays)await this.uiComparator.createOverlay(o)}catch{}}showNotification(t,e){const o=()=>{if(!document.body){setTimeout(o,10);return}const n=document.createElement("div");n.className=`fe-dev-tools-notification fe-dev-tools-notification--${e}`,n.textContent=t;const r=`
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: ${e==="success"?"#10b981":e==="error"?"#ef4444":"#3b82f6"} !important;
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
      `;n.setAttribute("style",r),document.body.appendChild(n),requestAnimationFrame(()=>{n.style.opacity="1",n.style.transform="translateX(0)"}),setTimeout(()=>{n.style.opacity="0",n.style.transform="translateX(100%)",setTimeout(()=>{n.parentNode&&n.parentNode.removeChild(n)},300)},3e3)};o()}initialize(){const t=()=>{if(!document.body){setTimeout(t,10);return}const e=document.createElement("div");e.id="fe-dev-tools-indicator",e.textContent="FE Dev Tools Loaded",e.style.cssText=`
        position: fixed !important;
        top: 10px !important;
        left: 10px !important;
        background: #10b981 !important;
        color: white !important;
        padding: 4px 8px !important;
        font-size: 12px !important;
        z-index: 999999 !important;
        border-radius: 4px !important;
      `,document.body.appendChild(e),setTimeout(()=>{e==null||e.remove()},3e3)};t(),document.readyState==="complete"?this.loadOverlaysForCurrentPage():window.addEventListener("load",()=>{this.loadOverlaysForCurrentPage()})}cleanup(){this.uiComparator.clearAllOverlays()}};y(d,"instance");let l=d;const u=l.getInstance();return u.initialize(),window.addEventListener("beforeunload",()=>{u.cleanup()}),chrome.runtime.onConnect.addListener(h=>{h.onDisconnect.addListener(()=>{u.cleanup()})}),u}();

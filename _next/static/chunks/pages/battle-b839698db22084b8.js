(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[973],{1461:function(e,r,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/battle",function(){return t(1063)}])},1063:function(e,r,t){"use strict";t.r(r),t.d(r,{default:function(){return J}});var n=t(5893),o=t(7294),a=t(7715),l=t(134),u=t(5596),s=t.n(u),c=t(2757),i=function(e){var r=e.red,t=e.green,o=c.yr.filter((function(e){return e.key===t.armorType}))[0];o||console.error("Unable to find green armor type; using monster armor");var a=c.yr.filter((function(e){return e.key===r.armorType}))[0];a||console.error("Unable to find green armor type; using monster armor");var u=(0,l.Z)(r.class,r.level,(null===o||void 0===o?void 0:o.armorType)||null,t.armorClass,r.weapon),i=(0,l.Z)(t.class,t.level,(null===a||void 0===a?void 0:a.armorType)||null,r.armorClass,t.weapon);return(0,n.jsxs)("div",{className:s().outerCell,children:[(0,n.jsx)("div",{className:s().left,children:u}),(0,n.jsx)("div",{className:s().right,children:i})]})},d=t(9521),f=t(6387),p=t.n(f),m=t(6212),v=t(1051),b=t(650),y=t(2198),h=t.n(y),w=t(3935),_=t(6177),g=t.n(_),j=t(8885),C=t(5924),x=function(e){var r=e.setOpen,t=e.creatureName,o=e.handleCreatureName,a=e.creatureClass,l=e.handleCreatureClass,u=e.levelOptions,s=e.level,c=e.handleLevel,i=e.armorTypeOptions,d=e.armorType,f=e.handleArmorType,p=e.armorClassOptions,v=e.armorClass,b=e.handleArmorClass,y=e.weaponOptions,h=e.weapon,_=e.handleWeapon,x=e.row,N=document.getElementById("app-modal");return N?(0,w.createPortal)((0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)("div",{className:g().modalShadow,onClick:function(){r(!1)}}),(0,n.jsxs)("div",{className:g().modal,style:{backgroundColor:x?"var(--caput-martuum)":"var(--dark-olive-green)"},children:[(0,n.jsx)("input",{className:g().nameInput,type:"text",defaultValue:t,onBlur:o,placeholder:"(Name or label)"}),(0,n.jsx)("br",{}),(0,n.jsx)(j.ZP,{isSearchable:!1,instanceId:"creatureClass",styles:C.Z,value:m.AN.filter((function(e){return e.value===a})),options:m.AN,onChange:l}),(0,n.jsx)("br",{}),(0,n.jsx)(j.ZP,{isSearchable:!1,instanceId:"level",styles:C.Z,value:u.filter((function(e){return e.value===s})),options:u,onChange:c}),(0,n.jsx)("br",{}),(0,n.jsx)(j.ZP,{isSearchable:!1,instanceId:"armorType",styles:C.Z,value:i.filter((function(e){return e.value===d})),options:i,onChange:f}),(0,n.jsx)("br",{}),(0,n.jsx)(j.ZP,{isSearchable:!1,instanceId:"armorClass",styles:C.Z,value:p.current.filter((function(e){return e.value===v})),options:p.current,onChange:b}),(0,n.jsx)("br",{}),(0,n.jsx)(j.ZP,{isSearchable:!1,instanceId:"weapon",styles:C.Z,value:y.filter((function(e){return e.value===h})),options:y,onChange:_})]})]}),N):(0,n.jsx)(n.Fragment,{})};function N(e,r){(null==r||r>e.length)&&(r=e.length);for(var t=0,n=new Array(r);t<r;t++)n[t]=e[t];return n}function O(e){return function(e){if(Array.isArray(e))return N(e)}(e)||function(e){if("undefined"!==typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}(e)||function(e,r){if(!e)return;if("string"===typeof e)return N(e,r);var t=Object.prototype.toString.call(e).slice(8,-1);"Object"===t&&e.constructor&&(t=e.constructor.name);if("Map"===t||"Set"===t)return Array.from(t);if("Arguments"===t||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t))return N(e,r)}(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}var k=function(e){var r,t,a,l,u=e.row,s=e.col,i=e.creature,d=e.dispatch,f=(0,o.useState)(i.name),p=f[0],y=f[1],w=(0,o.useState)(i.class),_=w[0],g=w[1],j=(0,o.useRef)(i.class),C=(0,o.useState)(i.level),N=C[0],k=C[1],I=(0,o.useState)((0,v.rq)(i.class===m.EN?m.EN:(0,m.A3)(i.class))),S=I[0],T=I[1],A=(0,o.useState)((0,b.CB)(i.class)),R=A[0],E=A[1],P=(0,o.useState)(i.weapon),B=P[0],F=P[1],Z=(0,o.useState)((0,c.BO)(_)),M=Z[0],D=Z[1],U=(0,o.useState)(i.armorType),H=U[0],G=U[1],q=(0,o.useRef)(O(Array(21)).map((function(e,r){return{value:10-r,label:"AC ".concat(10-r)}}))),L=(0,o.useState)(i.armorClass),z=L[0],Q=L[1],X=(0,o.useState)(!1),$=X[0],J=X[1],V=function(e){var r;return(null===(r=c.yr.filter((function(r){return r.key===e}))[0])||void 0===r?void 0:r.armorType)||10},K=null===(r=M.filter((function(e){return e.value===H}))[0])||void 0===r?void 0:r.label;K||console.error("Could not find armor label for armor type: ".concat(H));var W=_===m.EN?null===(t=v.zy.get(N))||void 0===t?void 0:t.label:"".concat(N);return W||(console.log(S),console.error("Could not find level label where value is: ".concat(N))),(0,n.jsx)(n.Fragment,{children:(0,n.jsxs)("div",{className:h().container,children:[(0,n.jsx)("div",{className:h().removeInput,children:(0,n.jsx)("button",{className:u<1?h().buttonRemoveColumn:h().buttonRemoveRow,onClick:function(){return d(u<1?{type:5,row:u,col:s}:{type:4,row:u,col:s})},children:"x"})}),(0,n.jsx)("div",{className:u<1?h().battleInputColumn:h().battleInputRow,onClick:function(){J(!0)},children:(0,n.jsxs)("div",{children:[p&&(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)("span",{className:h().creatureName,children:p}),(0,n.jsx)("br",{})]}),(null===(a=m.AN.filter((function(e){return e.value===_}))[0])||void 0===a?void 0:a.label)||"(No class selected)",W&&(0,n.jsxs)(n.Fragment,{children:[":"," ",_===m.EN?(0,n.jsx)(n.Fragment,{children:"HD "}):_===m.vT?(0,n.jsx)(n.Fragment,{children:"F"}):(0,n.jsx)(n.Fragment,{children:"L"}),W]}),(0,n.jsx)("br",{}),H>1&&K&&(0,n.jsxs)(n.Fragment,{children:[K,(0,n.jsx)("br",{})]}),"AC ",z,(0,n.jsx)("br",{}),(null===(l=R.filter((function(e){return e.value===B}))[0])||void 0===l?void 0:l.label)||"(No weapon selected"]})}),$&&(0,n.jsx)(x,{setOpen:J,creatureName:p,handleCreatureName:function(e){y(e.target.value),d({type:1,row:u,col:s,creature:{key:i.key,name:e.target.value,class:_,level:N,armorType:H,armorClass:z,weapon:B}})},creatureClass:_,handleCreatureClass:function(e){var r=null===e||void 0===e?void 0:e.value;if(r){if(r!==j.current){var t,n;g(r);var o=(0,v.rq)(r===m.EN?m.EN:(0,m.A3)(r));T(o),k(r===m.EN?3:1);var a=(0,c.BO)(r);D(a);var l=null===(t=a[0])||void 0===t?void 0:t.value;l?(G(l),Q(V(l))):console.error("Unable to set new armor type or armor class for new creature class: ".concat(r));var f=(0,b.CB)(r);E(f);var y=null===(n=f[0])||void 0===n?void 0:n.value;y?F(y):console.error("Unable to load new weapon, using previous weapon: ".concat(B)),j.current=r,d({type:1,row:u,col:s,creature:{key:i.key,name:p,class:r,level:r===m.EN?3:1,armorType:l||H,armorClass:l?V(l):z,weapon:y||B}})}}else console.error("Could not switch creature class")},levelOptions:S,level:N,handleLevel:function(e){var r=null===e||void 0===e?void 0:e.value;r?(k(r),d({type:1,row:u,col:s,creature:{key:i.key,name:p,class:_,level:r,armorType:H,armorClass:z,weapon:B}})):console.error("could not switch to new level")},armorTypeOptions:M,armorType:H,handleArmorType:function(e){var r=null===e||void 0===e?void 0:e.value;if(r){G(r);var t=V(r);Q(t),d({type:1,row:u,col:s,creature:{key:i.key,name:p,class:_,level:N,armorType:r,armorClass:t,weapon:B}})}else console.error("Could not switch to new armor type")},armorClassOptions:q,armorClass:z,handleArmorClass:function(e){var r=null===e||void 0===e?void 0:e.value;r||0===r?(Q(r),d({type:1,row:u,col:s,creature:{key:i.key,name:p,class:_,level:N,armorType:H,armorClass:r,weapon:B}})):console.error("Could not switch to new armor class")},weaponOptions:R,weapon:B,handleWeapon:function(e){var r=null===e||void 0===e?void 0:e.value;r?(F(r),d({type:1,row:u,col:s,creature:{key:i.key,name:p,class:_,level:N,armorType:H,armorClass:z,weapon:r}})):console.error("Could not select new weapon")},row:u})]})})},I=t(1752),S=t(3454);function T(e,r,t){return r in e?Object.defineProperty(e,r,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[r]=t,e}function A(e){for(var r=1;r<arguments.length;r++){var t=null!=arguments[r]?arguments[r]:{},n=Object.keys(t);"function"===typeof Object.getOwnPropertySymbols&&(n=n.concat(Object.getOwnPropertySymbols(t).filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable})))),n.forEach((function(r){T(e,r,t[r])}))}return e}function R(e,r){if(null==e)return{};var t,n,o=function(e,r){if(null==e)return{};var t,n,o={},a=Object.keys(e);for(n=0;n<a.length;n++)t=a[n],r.indexOf(t)>=0||(o[t]=e[t]);return o}(e,r);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)t=a[n],r.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(o[t]=e[t])}return o}var E=function(e){var r=e.rememberedState,t=(0,I.default)().publicRuntimeConfig.NODE_ENV,l=(0,o.useState)(void 0),u=l[0],s=l[1],c=(0,o.useRef)(0),f=(0,o.useMemo)((function(){return{key:0,class:m.EN,level:3,armorType:1,armorClass:5,weapon:1}}),[]),v=function(){return c.current++,c.current},b=(0,o.useMemo)((function(){return[[{},A({},f,{key:v()}),A({},f,{key:v()})],[A({},f,{key:v()}),{},{}],[A({},f,{key:v()}),{},{}],[A({},f,{key:v()}),{},{}]]}),[f]),y=(0,o.useMemo)((function(){return r||b}),[b,r]),h=(0,o.useReducer)((function(e,r){switch(r.type){case 5:return e.map((function(e){return e.filter((function(e,t){return t!==r.col}))}));case 4:return e.filter((function(e,t){return t!==r.row}));case 3:return e.map((function(e,r){return e.concat(0===r?A({},f,{key:v()}):{})}));case 2:var t,n=(null===(t=e[0])||void 0===t?void 0:t.length)||0,o=[A({},f,{key:v()})].concat(n>1?Array(n-1).fill({}):[]);return e.concat([o]);default:return e.map((function(e,t){return t===r.row?e.map((function(e,t){return t===r.col?r.creature?r.creature:(console.error("Unable to change creature: returning unedited creature instead"),e):e})):e.slice()}))}}),y),w=h[0],_=h[1];(0,o.useEffect)((function(){(0,a.deflate)(JSON.stringify({version:4,state:w}),(function(e,r){e&&(console.error("An error occurred:",e),S.exitCode=1),s(encodeURIComponent(r.toString("base64")))}))}),[w]),(0,o.useEffect)((function(){return function(){console.log("unmounting Battle")}}),[]),(0,o.useEffect)((function(){u&&window.history.replaceState({},"","production"!==t?"/battle?s=".concat(u):"/adnd-combat-tools/battle?s=".concat(u))}),[t,u]);var g=(0,o.useCallback)((function(e,r){var t=w[e.row.index+1];return t&&w[0]&&t[0]&&w[0][r]?(0,n.jsx)(i,{red:t[0],green:w[0][r]}):(0,n.jsx)(n.Fragment,{})}),[w]),j=(0,o.useMemo)((function(){return[{Header:(0,n.jsxs)("div",{className:p().tableTitle,children:["AD&D",(0,n.jsx)("br",{}),"Battle Grid"]}),accessor:"col0"}].concat(w[0]?w[0].slice(1).map((function(e,r){return{Header:(0,n.jsx)(k,{row:0,col:r+1,creature:e,dispatch:_},e.key),accessor:"col".concat(r+1),Cell:function(e){return g(e,r+1)}}})):[])}),[g,w]),C=(0,o.useMemo)((function(){return w.slice(1).map((function(e,r){return e[0]?{col0:(0,n.jsx)(k,{row:r+1,col:0,creature:e[0],dispatch:_},e[0].key)}:(console.error("Could note render BattleInput for row: ".concat(r)),(0,n.jsx)(n.Fragment,{}))}))}),[w]),x=(0,d.useTable)({columns:j,data:C}),N=x.getTableProps,O=x.getTableBodyProps,T=x.headerGroups,E=x.rows,P=x.prepareRow;return(0,n.jsx)("div",{id:"app-modal",children:(0,n.jsxs)("div",{className:p().container,children:[(0,n.jsx)("div",{className:p().addColumn,children:(0,n.jsx)("button",{className:p().buttonAddColumn,onClick:function(){return _({type:3})},children:"+"})}),(0,n.jsxs)("table",A({className:p().myBorder},N(),{children:[(0,n.jsx)("thead",{children:T.map((function(e){var r=e.getHeaderGroupProps(),t=r.key,o=R(r,["key"]);return(0,n.jsx)("tr",A({},o,{children:e.headers.map((function(e){var r=e.getHeaderProps(),t=r.key,o=R(r,["key"]);return(0,n.jsx)("th",A({},o,{children:e.render("Header")}),t)}))}),t)}))}),(0,n.jsx)("tbody",A({},O(),{children:E.map((function(e){return P(e),(0,n.jsx)("tr",A({},e.getRowProps(),{children:e.cells.map((function(e){return(0,n.jsx)("td",A({},e.getCellProps(),{children:e.render("Cell")}))}))}))}))}))]})),(0,n.jsx)("div",{className:p().addRow,children:(0,n.jsx)("button",{className:p().buttonAddRow,onClick:function(){return _({type:2})},children:"+"})})]})})},P=t(1163),B=t(4051),F=t.n(B),Z=t(1876).Buffer,M=t(3454);function D(e,r){(null==r||r>e.length)&&(r=e.length);for(var t=0,n=new Array(r);t<r;t++)n[t]=e[t];return n}function U(e,r,t,n,o,a,l){try{var u=e[a](l),s=u.value}catch(c){return void t(c)}u.done?r(s):Promise.resolve(s).then(n,o)}function H(e){return function(){var r=this,t=arguments;return new Promise((function(n,o){var a=e.apply(r,t);function l(e){U(a,n,o,l,u,"next",e)}function u(e){U(a,n,o,l,u,"throw",e)}l(void 0)}))}}function G(e,r,t){return r in e?Object.defineProperty(e,r,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[r]=t,e}function q(e){for(var r=1;r<arguments.length;r++){var t=null!=arguments[r]?arguments[r]:{},n=Object.keys(t);"function"===typeof Object.getOwnPropertySymbols&&(n=n.concat(Object.getOwnPropertySymbols(t).filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable})))),n.forEach((function(r){G(e,r,t[r])}))}return e}function L(e,r){return function(e){if(Array.isArray(e))return e}(e)||function(e,r){var t=null==e?null:"undefined"!==typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(null!=t){var n,o,a=[],l=!0,u=!1;try{for(t=t.call(e);!(l=(n=t.next()).done)&&(a.push(n.value),!r||a.length!==r);l=!0);}catch(s){u=!0,o=s}finally{try{l||null==t.return||t.return()}finally{if(u)throw o}}return a}}(e,r)||function(e,r){if(!e)return;if("string"===typeof e)return D(e,r);var t=Object.prototype.toString.call(e).slice(8,-1);"Object"===t&&e.constructor&&(t=e.constructor.name);if("Map"===t||"Set"===t)return Array.from(t);if("Arguments"===t||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t))return D(e,r)}(e,r)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}var z=function(e){switch(e){case"monster":return m.EN;case"cleric":return m.v2;case"druid":return m.uz;case"fighter":return m.XD;case"ranger":return m.C$;case"paladin":return m.Bq;case"magicuser":return m.vs;case"illusionist":return m.p1;case"thief":return m.np;case"assassin":return m.M3;case"monk":return m.Lv;case"bard":return m.vT;default:return console.error("Unrecognized class ".concat(e,", returning MONSTER")),m.EN}},Q=function(e,r){if(r===m.EN){var t=Array.from(v.zy).filter((function(r){var t=L(r,2);t[0];return t[1].label===e}))[0];return t?t[0]:(console.error("Could not get level for monster level ".concat(e,", returning 3 (1HD)")),3)}var n=parseInt(e,10);return isNaN(n)?(console.error("Could not parse level for ${level}, returning 1"),1):n},X=function(e){switch(e.version){case 1:return e.state.map((function(e){return e.map((function(e){if(Object.keys(e).length){var r=e,t=c.yr.filter((function(e){return e.armorType===((t=r.armorType).trim()?parseInt(t,10):null);var t}))[0],n=Array.from(b.Ar).filter((function(e){var t=L(e,2);t[0];return t[1].name===r.weapon}))[0],o=z(r.class);return q({},r,{armorType:t?t.key:0,weapon:n?n[0]:0,class:o,level:Q(r.level,o)})}return e}))}));case 2:return e.state.map((function(e){return e.map((function(e){if(Object.keys(e).length){var r=e,t=Array.from(b.Ar).filter((function(e){var t=L(e,2);t[0];return t[1].name===r.weapon}))[0],n=z(r.class);return q({},r,{weapon:t?t[0]:0,class:n,level:Q(r.level,n)})}return e}))}));case 3:return e.state.map((function(e){return e.map((function(e){if(Object.keys(e).length){var r=e,t=z(r.class);return q({},r,{class:t,level:Q(r.level,t)})}return e}))}));default:return e.state}},$=function(e){var r=e.encodedState,t=(0,o.useState)(void 0),l=t[0],u=t[1];return(0,o.useEffect)((function(){var e=!0;return function(){t.apply(this,arguments)}(),function(){e=!1};function t(){return(t=H(F().mark((function t(){var n;return F().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:u(void 0),n=Z.from(decodeURI(r),"base64"),(0,a.unzip)(n,(function(r,t){r&&(console.error("An error occurred:",r),M.exitCode=1);var n=JSON.parse(t.toString());e&&u(X(n))}));case 3:case"end":return t.stop()}}),t)})))).apply(this,arguments)}}),[r]),(0,n.jsx)(n.Fragment,{children:l&&(0,n.jsx)(E,{rememberedState:l})})},J=function(){var e=(0,P.useRouter)(),r=(0,o.useState)(!1),t=r[0],a=r[1],l=e.query.s;return(0,o.useEffect)((function(){e.isReady&&a(!0)}),[e.isReady]),t?l?(0,n.jsx)($,{encodedState:l}):(0,n.jsx)(E,{}):(0,n.jsx)(n.Fragment,{})}},6387:function(e){e.exports={eggshell:"#F0EFDD",container:"battle_container__jOK3k",addColumn:"battle_addColumn__Glgxv",addRow:"battle_addRow__vsUfL",buttonBase:"battle_buttonBase__T7y3f",buttonAddRow:"battle_buttonAddRow__XvZNM battle_buttonBase__T7y3f",buttonAddColumn:"battle_buttonAddColumn__MttIL battle_buttonBase__T7y3f",myBorder:"battle_myBorder__DZpxH",tableTitle:"battle_tableTitle___IoaN"}},2198:function(e){e.exports={container:"battleInput_container__snaa3",buttonRemoveColumn:"battleInput_buttonRemoveColumn__oZQhs battleInput_buttonBase__bRQPF",buttonRemoveRow:"battleInput_buttonRemoveRow__7VYOu battleInput_buttonBase__bRQPF",removeInput:"battleInput_removeInput__ZCgfN",buttonBase:"battleInput_buttonBase__bRQPF",battleInput:"battleInput_battleInput__p1o3G",battleInputColumn:"battleInput_battleInputColumn__4jFpI battleInput_battleInput__p1o3G",battleInputRow:"battleInput_battleInputRow__04l_x battleInput_battleInput__p1o3G",creatureName:"battleInput_creatureName__JqfyT"}},6177:function(e){e.exports={modalShadow:"battleModal_modalShadow__vrTuw",modal:"battleModal_modal__C7q8v",nameInput:"battleModal_nameInput__TbCNp"}},5596:function(e){e.exports={outerCell:"cellOutput_outerCell__IKmle",left:"cellOutput_left__E98RM",right:"cellOutput_right__gNDDm"}}},function(e){e.O(0,[885,582,342,774,888,179],(function(){return r=1461,e(e.s=r);var r}));var r=e.O();_N_E=r}]);
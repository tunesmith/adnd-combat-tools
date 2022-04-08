"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[342],{134:function(e,r,n){var t=n(1051),a=n(6212),o=n(650);r.Z=function(e,r,n,i,l){var s=(0,t.H6)("monster"===e?"monster":a.$[e],r),u=n?(0,o.Ji)(l,n):0;return(0,t.UQ)(i+u,s)}},5924:function(e,r){function n(e,r,n){return r in e?Object.defineProperty(e,r,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[r]=n,e}function t(e){for(var r=1;r<arguments.length;r++){var t=null!=arguments[r]?arguments[r]:{},a=Object.keys(t);"function"===typeof Object.getOwnPropertySymbols&&(a=a.concat(Object.getOwnPropertySymbols(t).filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable})))),a.forEach((function(r){n(e,r,t[r])}))}return e}var a={control:function(e){return t({},e,{backgroundColor:"#F0EFDD"})},option:function(e){return t({},e,{backgroundColor:"#F0EFDD",color:"black"})}};r.Z=a},2757:function(e,r,n){function t(e,r){(null==r||r>e.length)&&(r=e.length);for(var n=0,t=new Array(r);n<r;n++)t[n]=e[n];return t}function a(e,r){return function(e){if(Array.isArray(e))return e}(e)||function(e,r){var n=null==e?null:"undefined"!==typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(null!=n){var t,a,o=[],i=!0,l=!1;try{for(n=n.call(e);!(i=(t=n.next()).done)&&(o.push(t.value),!r||o.length!==r);i=!0);}catch(s){l=!0,a=s}finally{try{i||null==n.return||n.return()}finally{if(l)throw a}}return o}}(e,r)||function(e,r){if(!e)return;if("string"===typeof e)return t(e,r);var n=Object.prototype.toString.call(e).slice(8,-1);"Object"===n&&e.constructor&&(n=e.constructor.name);if("Map"===n||"Set"===n)return Array.from(n);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return t(e,r)}(e,r)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}n.d(r,{yr:function(){return c},BO:function(){return d},ZS:function(){return f}});var o=[2,3,4,6],i=[2],l=[2,4],s=[2,3,4,6],u=[2,4,14],c=[{key:1,armorType:null,armorDescription:"Natural armor (Monster)"},{key:2,armorType:10,armorDescription:"AT 10 - No Armor"},{key:3,armorType:9,armorDescription:"AT 9 - Shield only"},{key:4,armorType:8,armorDescription:"AT 8 - Leather armor"},{key:5,armorType:8,armorDescription:"AT 8 - Padded armor"},{key:6,armorType:7,armorDescription:"AT 7 - Leather armor + shield"},{key:7,armorType:7,armorDescription:"AT 7 - Padded armor + shield"},{key:8,armorType:7,armorDescription:"AT 7 - Studded leather"},{key:9,armorType:7,armorDescription:"AT 7 - Ring mail"},{key:10,armorType:6,armorDescription:"AT 6 - Studded leather + shield"},{key:11,armorType:6,armorDescription:"AT 6 - Ring mail + shield"},{key:12,armorType:6,armorDescription:"AT 6 - Scale mail"},{key:13,armorType:5,armorDescription:"AT 5 - Scale mail + shield"},{key:14,armorType:5,armorDescription:"AT 5 - Chain mail"},{key:15,armorType:4,armorDescription:"AT 4 - Chain mail + shield"},{key:16,armorType:4,armorDescription:"AT 4 - Splint mail"},{key:17,armorType:4,armorDescription:"AT 4 - Banded mail"},{key:18,armorType:3,armorDescription:"AT 3 - Splint mail + shield"},{key:19,armorType:3,armorDescription:"AT 3 - Banded mail + shield"},{key:20,armorType:3,armorDescription:"AT 3 - Plate mail"},{key:21,armorType:2,armorDescription:"AT 2 - Plate mail + shield"}],m=function(e,r){return e.filter((function(e){return r.includes(e.key)}))},p={monster:function(){return c},cleric:function(){return c.slice(1)},druid:function(){return m(c,o)},fighter:function(){return c.slice(1)},paladin:function(){return c.slice(1)},ranger:function(){return c.slice(1)},magicuser:function(){return m(c,i)},illusionist:function(){return m(c,i)},thief:function(){return m(c,l)},assassin:function(){return m(c,s)},monk:function(){return m(c,i)},bard:function(){return m(c,u)}},d=function(e){return p[e]().map((function(e){return{value:e.key,label:e.armorDescription}}))},y={" ":"Natural Armor (Monster)",10:"AT 10 - No Armor",9:"AT 9 - Shield only",8:"AT 8 - Leather or padded armor",7:"AT 7 - Leather or padded armor + shield / studded leather / ring mail",6:"AT 6 - Studded leather or ring mail + shield / scale mail",5:"AT 5 - Scale mail + shield / chain mail",4:"AT 4 - Chain mail + shield / splint mail / banded mail",3:"AT 3 - Splint or banded mail + shield / plate mail",2:"AT 2 - Plate mail + shield"},f=Object.entries(y).reverse().map((function(e){var r=a(e,2);return{value:r[0],label:r[1]}}))},6212:function(e,r,n){function t(e,r){(null==r||r>e.length)&&(r=e.length);for(var n=0,t=new Array(r);n<r;n++)t[n]=e[n];return t}function a(e,r){return function(e){if(Array.isArray(e))return e}(e)||function(e,r){var n=null==e?null:"undefined"!==typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(null!=n){var t,a,o=[],i=!0,l=!1;try{for(n=n.call(e);!(i=(t=n.next()).done)&&(o.push(t.value),!r||o.length!==r);i=!0);}catch(s){l=!0,a=s}finally{try{i||null==n.return||n.return()}finally{if(l)throw a}}return o}}(e,r)||function(e,r){if(!e)return;if("string"===typeof e)return t(e,r);var n=Object.prototype.toString.call(e).slice(8,-1);"Object"===n&&e.constructor&&(n=e.constructor.name);if("Map"===n||"Set"===n)return Array.from(n);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return t(e,r)}(e,r)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}n.d(r,{$:function(){return o},A:function(){return i}});var o={cleric:"cleric",druid:"cleric",fighter:"fighter",ranger:"fighter",paladin:"fighter",magicuser:"magicuser",illusionist:"magicuser",thief:"thief",assassin:"thief",monk:"cleric",bard:"fighter"},i=Object.entries({monster:"Monster",cleric:"Cleric",druid:"Druid",fighter:"Fighter",ranger:"Ranger",paladin:"Paladin",magicuser:"Magic-User",illusionist:"Illusionist",thief:"Thief",assassin:"Assassin",monk:"Monk",bard:"Bard"}).map((function(e){var r=a(e,2);return{value:r[0],label:r[1]}}))},1051:function(e,r,n){function t(e,r){(null==r||r>e.length)&&(r=e.length);for(var n=0,t=new Array(r);n<r;n++)t[n]=e[n];return t}function a(e,r){return function(e){if(Array.isArray(e))return e}(e)||function(e,r){var n=null==e?null:"undefined"!==typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(null!=n){var t,a,o=[],i=!0,l=!1;try{for(n=n.call(e);!(i=(t=n.next()).done)&&(o.push(t.value),!r||o.length!==r);i=!0);}catch(s){l=!0,a=s}finally{try{i||null==n.return||n.return()}finally{if(l)throw a}}return o}}(e,r)||i(e,r)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function o(e){return function(e){if(Array.isArray(e))return t(e)}(e)||function(e){if("undefined"!==typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}(e)||i(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function i(e,r){if(e){if("string"===typeof e)return t(e,r);var n=Object.prototype.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(n):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?t(e,r):void 0}}n.d(r,{H6:function(){return d},UQ:function(){return y},zT:function(){return h}});var l=new Map([["up to 1-1","21"],["1-1","20"],["1","19"],["1+","18"],["2-3+","16"],["4-5+","15"],["6-7+","13"],["8-9+","12"],["10-11+","10"],["12-13+","9"],["14-15+","8"],["16+","7"]]),s={0:21,1:20,3:18,5:16,7:14,9:12,11:10,13:8,15:6,17:4},u={1:20,4:18,7:16,10:14,13:12,16:10,19:9},c={1:21,5:19,9:16,13:14,17:12,21:10},m={1:21,6:19,11:16,16:13,21:11},p=function(e,r){return Object.entries(e).reduce((function(e,n){var t=a(n,2),o=t[0],i=t[1];return parseInt(o,10)<=parseInt(r,10)?i:e}),30)},d=function(e,r){switch(e){case"fighter":return p(s,r);case"cleric":return p(u,r);case"magicuser":return p(m,r);case"thief":return p(c,r);default:return l.get(r)}},y=function(e,r){var n=r-e;return n>=20?Math.max(20,n-5):n},f=function(e){var r,n,t=Object.entries(e).map((function(e){return parseInt(e[0],10)})),a=(r=Math).max.apply(r,o(t)),i=(n=Math).min.apply(n,o(t));return Array.from(Array(a-i+1).keys()).map((function(e){return{value:"".concat(e+i),label:"Level ".concat(e+i).concat(e+i===a?"+":"")}}))},h=function(e){switch(e){case"fighter":return f(s);case"cleric":return f(u);case"magicuser":return f(m);case"thief":return f(c);default:return Array.from(l).map((function(e){var r=a(e,1)[0];return{value:r,label:"".concat(r," HD")}}))}}},650:function(e,r,n){function t(e,r){(null==r||r>e.length)&&(r=e.length);for(var n=0,t=new Array(r);n<r;n++)t[n]=e[n];return t}function a(e,r){return function(e){if(Array.isArray(e))return e}(e)||function(e,r){var n=null==e?null:"undefined"!==typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(null!=n){var t,a,o=[],i=!0,l=!1;try{for(n=n.call(e);!(i=(t=n.next()).done)&&(o.push(t.value),!r||o.length!==r);i=!0);}catch(s){l=!0,a=s}finally{try{i||null==n.return||n.return()}finally{if(l)throw a}}return o}}(e,r)||function(e,r){if(!e)return;if("string"===typeof e)return t(e,r);var n=Object.prototype.toString.call(e).slice(8,-1);"Object"===n&&e.constructor&&(n=e.constructor.name);if("Map"===n||"Set"===n)return Array.from(n);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return t(e,r)}(e,r)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}n.d(r,{Ar:function(){return i},Ji:function(){return l},CB:function(){return c}});var o=[17,18,19,22,53],i=new Map([[1,{weaponType:"natural",name:"Natural Weapon (Monster)",acAdjustments:[0,0,0,0,0,0,0,0,0]}],[2,{weaponType:"melee",name:"Axe, Battle",acAdjustments:[-3,-2,-1,-1,0,0,1,1,2],length:4,speedFactor:7}],[3,{weaponType:"melee",name:"Axe, Hand (Held)",acAdjustments:[-3,-2,-2,-1,0,0,1,1,1],length:1.5,speedFactor:4}],[4,{weaponType:"missile",name:"Axe, Hand (Hurled)",acAdjustments:[-4,-3,-2,-1,-1,0,0,0,1],fireRate:1}],[5,{weaponType:"melee",name:"Bardiche",acAdjustments:[-2,-1,0,0,1,1,2,2,3],length:5,speedFactor:9}],[6,{weaponType:"melee",name:"Bec de Corbin",acAdjustments:[2,2,2,0,0,0,0,0,-1],length:6,speedFactor:9}],[7,{weaponType:"melee",name:"Bill-Guisarme",acAdjustments:[0,0,0,0,0,0,1,0,0],length:8,speedFactor:10}],[8,{weaponType:"melee",name:"Bo Stick",acAdjustments:[-9,-7,-5,-3,-1,0,1,0,3],length:5,speedFactor:3}],[9,{weaponType:"missile",name:"Bow, composite, long",acAdjustments:[-3,-3,-1,0,1,2,2,2,3],fireRate:2}],[10,{weaponType:"missile",name:"Bow, composite, short",acAdjustments:[-3,-3,-1,0,1,2,2,2,3],fireRate:2}],[11,{weaponType:"missile",name:"Bow, long",acAdjustments:[-1,0,0,1,2,3,3,3,3],fireRate:2}],[12,{weaponType:"missile",name:"Bow, short",acAdjustments:[-5,-4,-1,0,0,1,2,2,2],fireRate:2}],[13,{weaponType:"melee",name:"Club (Held)",acAdjustments:[-5,-4,-3,-2,-1,-1,0,0,1],length:3,speedFactor:4}],[14,{weaponType:"missile",name:"Club (Hurled)",acAdjustments:[-7,-5,-3,-2,-1,-1,-1,0,0],fireRate:1}],[15,{weaponType:"missile",name:"Crossbow, heavy",acAdjustments:[-1,0,1,2,3,3,4,4,4],fireRate:.5}],[16,{weaponType:"missile",name:"Crossbow, light",acAdjustments:[-2,-1,0,0,1,2,3,3,3],fireRate:1}],[17,{weaponType:"melee",name:"Dagger (Held)",acAdjustments:[-3,-3,-2,-2,0,0,1,1,3],length:1.25,speedFactor:2}],[18,{weaponType:"missile",name:"Dagger (Hurled)",acAdjustments:[-5,-4,-3,-2,-1,-1,0,0,1],fireRate:2}],[19,{weaponType:"missile",name:"Dart",acAdjustments:[-5,-4,-3,-2,-1,0,1,0,1],fireRate:3}],[20,{weaponType:"melee",name:"Fauchard",acAdjustments:[-2,-2,-1,-1,0,0,0,-1,-1],length:8,speedFactor:8}],[21,{weaponType:"melee",name:"Fauchard-Fork",acAdjustments:[-1,-1,-1,0,0,0,1,0,1],length:8,speedFactor:8}],[22,{weaponType:"melee",name:"Fist or Open Hand",acAdjustments:[-7,-5,-3,-1,0,0,2,0,4],length:2,speedFactor:1}],[23,{weaponType:"melee",name:"Flail, Footman\u2019s",acAdjustments:[2,2,1,2,1,1,1,1,-1],length:4,speedFactor:7}],[24,{weaponType:"melee",name:"Flail, Horseman\u2019s",acAdjustments:[0,0,0,0,0,1,1,1,0],length:2,speedFactor:6}],[25,{weaponType:"melee",name:"Fork, Military",acAdjustments:[-2,-2,-1,0,0,1,1,0,1],length:7,speedFactor:7}],[26,{weaponType:"melee",name:"Glaive",acAdjustments:[-1,-1,0,0,0,0,0,0,0],length:8,speedFactor:8}],[27,{weaponType:"melee",name:"Glaive-Guisarme",acAdjustments:[-1,-1,0,0,0,0,0,0,0],length:8,speedFactor:9}],[28,{weaponType:"melee",name:"Guisarme",acAdjustments:[-2,-2,-1,-1,0,0,0,-1,-1],length:6,speedFactor:8}],[29,{weaponType:"melee",name:"Guisarme-Voulge",acAdjustments:[-1,-1,0,1,1,1,0,0,0],length:7,speedFactor:10}],[30,{weaponType:"melee",name:"Halberd",acAdjustments:[1,1,1,2,2,2,1,1,0],length:5,speedFactor:9}],[31,{weaponType:"melee",name:"Hammer, Lucern",acAdjustments:[1,1,2,2,2,1,1,0,0],length:5,speedFactor:9}],[32,{weaponType:"melee",name:"Hammer (Held)",acAdjustments:[0,1,0,1,0,0,0,0,0],length:1.5,speedFactor:4}],[33,{weaponType:"missile",name:"Hammer (Hurled)",acAdjustments:[-2,-1,0,0,0,0,0,0,1],fireRate:1}],[34,{weaponType:"missile",name:"Javelin",acAdjustments:[-5,-4,-3,-2,-1,0,1,0,1],fireRate:1}],[35,{weaponType:"melee",name:"Jo Stick",acAdjustments:[-8,-6,-4,-2,-1,0,1,0,2],length:3,speedFactor:2}],[36,{weaponType:"melee",name:"Lance (heavy horse)",acAdjustments:[3,3,2,2,2,1,1,0,0],length:14,speedFactor:8}],[37,{weaponType:"melee",name:"Lance (light horse)",acAdjustments:[-2,-2,-1,0,0,0,0,0,0],length:10,speedFactor:7}],[38,{weaponType:"melee",name:"Lance (medium horse)",acAdjustments:[0,1,1,1,1,0,0,0,0],length:12,speedFactor:6}],[39,{weaponType:"melee",name:"Mace, Footman\u2019s",acAdjustments:[1,1,0,0,0,0,0,1,-1],length:2.5,speedFactor:7}],[40,{weaponType:"melee",name:"Mace, Horseman\u2019s",acAdjustments:[1,1,0,0,0,0,0,0,0],length:1.5,speedFactor:6}],[41,{weaponType:"melee",name:"Morning Star",acAdjustments:[0,1,1,1,1,1,1,2,2],length:4,speedFactor:7}],[42,{weaponType:"melee",name:"Partisan",acAdjustments:[0,0,0,0,0,0,0,0,0],length:7,speedFactor:9}],[43,{weaponType:"melee",name:"Pick, Military, Footman\u2019s",acAdjustments:[2,2,1,1,0,-1,-1,-1,-2],length:4,speedFactor:7}],[44,{weaponType:"melee",name:"Pick, Military, Horseman\u2019s",acAdjustments:[1,1,1,1,0,0,-1,-1,-1],length:2,speedFactor:5}],[45,{weaponType:"melee",name:"Pike, awl",acAdjustments:[-1,0,0,0,0,0,0,-1,-2],length:18,speedFactor:13}],[46,{weaponType:"melee",name:"Ranseur",acAdjustments:[-2,-1,-1,0,0,0,0,0,1],length:8,speedFactor:8}],[47,{weaponType:"melee",name:"Scimitar",acAdjustments:[-3,-2,-2,-1,0,0,1,1,3],length:3,speedFactor:4}],[48,{weaponType:"missile",name:"Sling (bullet)",acAdjustments:[-2,-2,-1,0,0,0,2,1,3],fireRate:1}],[49,{weaponType:"missile",name:"Sling (stone)",acAdjustments:[-5,-4,-2,-1,0,0,2,1,3],fireRate:1}],[50,{weaponType:"melee",name:"Spear (held)",acAdjustments:[-2,-1,-1,-1,0,0,0,0,0],length:9,speedFactor:7}],[51,{weaponType:"missile",name:"Spear (hurled)",acAdjustments:[-3,-3,-2,-2,-1,0,0,0,0],fireRate:1}],[52,{weaponType:"melee",name:"Spetum",acAdjustments:[-2,-1,0,0,0,0,0,1,2],length:8,speedFactor:8}],[53,{weaponType:"melee",name:"Staff, quarter",acAdjustments:[-7,-5,-3,-1,0,0,1,1,1],length:7,speedFactor:4}],[54,{weaponType:"melee",name:"Sword, bastard",acAdjustments:[0,0,1,1,1,1,1,1,0],length:4.5,speedFactor:6}],[55,{weaponType:"melee",name:"Sword, broad",acAdjustments:[-3,-2,-1,0,0,1,1,1,2],length:3.5,speedFactor:5}],[56,{weaponType:"melee",name:"Sword, long",acAdjustments:[-2,-1,0,0,0,0,0,1,2],length:3.5,speedFactor:5}],[57,{weaponType:"melee",name:"Sword, short",acAdjustments:[-3,-2,-1,0,0,0,1,0,2],length:2,speedFactor:3}],[58,{weaponType:"melee",name:"Sword, two-handed",acAdjustments:[2,2,2,2,3,3,3,1,0],length:6,speedFactor:10}],[59,{weaponType:"melee",name:"Trident",acAdjustments:[-3,-2,-1,-1,0,0,1,0,1],length:6,speedFactor:7}],[60,{weaponType:"melee",name:"Voulge",acAdjustments:[-1,-1,0,1,1,1,0,0,0],length:8,speedFactor:10}]]),l=function(e,r){return i.get(e).acAdjustments[r-2]},s=function(e,r){return Array.from(e).filter((function(e){return r.includes(e[0])}))},u={monster:i,cleric:s(i,[13,14,22,23,24,31,32,33,39,40,53]),druid:s(i,[13,14,17,18,19,22,31,32,33,47,48,49,50,51,53]),fighter:Array.from(i).slice(1),paladin:Array.from(i).slice(1),ranger:Array.from(i).slice(1),magicuser:s(i,o),illusionist:s(i,o),thief:s(i,[13,14,17,18,19,22,48,49,55,56,57]),assassin:Array.from(i).slice(1),monk:s(i,[3,4,5,6,7,8,13,14,15,16,17,18,20,21,22,25,26,27,28,29,30,31,34,35,36,37,38,42,45,46,50,51,52,53,59,60]),bard:s(i,[13,14,17,18,19,22,34,47,48,49,50,51,53,54,55,56,57])},c=function(e){return Array.from(u[e]).map((function(e){var r=a(e,2);return{value:r[0],label:r[1].name}}))}}}]);
import identity from './itemIdentity.json' with { type: 'json' }
import normalRoutes from './normalEvolutionRequirements.json' with { type: 'json' }
const retired = new Set([...identity.retiredIds, ...Object.values(normalRoutes).map(r => r.retiredItemId).filter(Boolean)])
export const ITEM_ID_ALIASES = Object.freeze(identity.aliases)
export const canonicalItemId = id => typeof id !== 'string' || retired.has(id) ? null : Object.hasOwn(ITEM_ID_ALIASES, id) ? ITEM_ID_ALIASES[id] : id
export const isSpiritItem = id => /^(human|beast)-spirit-/.test(id ?? '')
export function normalizeItemInventory(raw) {
 const out = {}; for (const [oldId, value] of Object.entries(raw ?? {})) { const id=canonicalItemId(oldId),count=Number(value); if (!id || ['__proto__','constructor','prototype'].includes(id) || !Number.isFinite(count) || count<=0) continue; out[id]=(out[id]??0)+Math.floor(count) } return out
}
export function normalizeEvolutionItemRequirement(rule) {
 const base=rule.itemName.split(' · ')[0],name=base.endsWith('의 디지멘탈')?base:/^에보류터 · 시스터몬/.test(rule.itemName)?'각성 에보류터':rule.itemName
 return {...rule,itemName:name,itemId:canonicalItemId(rule.itemId??'item-evolution-'+rule.itemName)}
}
export function getEvolutionCatalystCount(unit, inventory, id) { return (normalizeItemInventory(inventory)[id]??0)+(isSpiritItem(id)?Math.max(0,Number(unit?.battleItems?.[id])||0):0) }
export function consumeEvolutionCatalyst(unit, inventory, item) {
 const next=normalizeItemInventory(inventory);if(!item)return{combatant:unit,inventory:next};const id=item.id,needed=item.requiredCount??1;if(getEvolutionCatalystCount(unit,next,id)<needed)return null;
 const fromBag=Math.min(next[id]??0,needed);if(fromBag){next[id]-=fromBag;if(!next[id])delete next[id]}const remainder=needed-fromBag;let combatant=unit;
 if(remainder){const battleItems={...unit.battleItems,[id]:(unit.battleItems?.[id]??0)-remainder};if(!battleItems[id])delete battleItems[id];combatant={...unit,battleItems}}return{combatant,inventory:next}
}
export function mergeRewardEntries(items) {
 const entries=new Map();for(const item of items){const id=canonicalItemId(item.id);if(!id)continue;const previous=entries.get(id),targets=[...new Set([...(previous?.evolutionTargets??[]),...(item.evolutionTargets??[]),...(item.evolutionItemFor?[item.evolutionItemFor]:[])])];
 if(!previous)entries.set(id,{...item,id,...(targets.length?{evolutionTargets:targets}:{})});else entries.set(id,{...previous,description:[...new Set([previous.description,item.description].filter(Boolean))].join('\n'),...(targets.length?{evolutionTargets:targets}:{})})}return [...entries.values()]
}

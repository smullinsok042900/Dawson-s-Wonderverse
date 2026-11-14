// Raycaster does not check Object3D.visible or scene membership. Invisible
// material-only hit planes remain valid, but hidden/removed objects do not.
export function isVisibleTarget(object,scene){for(let o=object;o;o=o.parent){if(o.visible===false)return false;if(o===scene)return true;}return false;}

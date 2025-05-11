export let levelData;

export async function getLevelData(levelName) {
   if (levelData) return levelData;
   return getOtherLevelData(levelName);
}

export async function getOtherLevelData(levelName) {
   const url = `/resources/levels/${levelName}.json`;
   return await fetch(url).then(x => x.text()).then(y => {
      levelData = JSON.parse(y);
      return levelData;
   });
}


export function setLevelData(newLevelData) {
   levelData = newLevelData;
}